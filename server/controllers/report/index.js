import httpStatus from 'http-status';
import _ from 'lodash';
import moment from 'moment';

import Venue from '../../models/venue';
import Report from '../../models/report';
import Placement from '../../models/placement';
import User from '../../models/user';
import Inventory from '../../models/inventory';
import Order from '../../models/order';
import patchModel from '../../helpers/patchModel';

import { reportToXLS, usageReportToXLS } from './export.js';

/**
 * Load report and append to req.
 */
function load(req, res, next, id) {
  if (id === 'live') {
    return next();
  }
  Report.get(id).then((report) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = report.venue_id; // eslint-disable-line no-param-reassign
    req.report = report; // eslint-disable-line no-param-reassign
    return next();
  }).error(e => next(e));
}

function roundToDecimal(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Get report
 * @returns {Report}
 */
function get(req, res) {
  const venues = Object.keys(req.user.roles);
  const whiteList = req.query.venue_id ? { venue_id: req.query.venue_id } : { venue_id : { $in: venues }}; // eslint-disable-line
  if (req.params.report_id === 'live') {
    return generateReport(whiteList).then(report => res.json(report));
  }
  return res.json(req.report);
}

function generateReport(filters) {
  return Placement.find(filters)
  .populate({
    path: 'section_id area_id',
    select: 'name'
  })
  .populate({
    path: 'inventory_item_id',
    select: '-__v -updated_at -created_at -history',
    populate: {
      path: 'product_id supplier_id',
      select: '-__v -updated_at -created_at',
    },
  })
  .lean()
  .execAsync()
  .then(results =>
    results.filter(item =>
      item.inventory_item_id
      && item.inventory_item_id.product_id
      && item.area_id
      && item.section_id)
    .reduce((mem, item) => {
      const memItem = mem.items[item.inventory_item_id._id] =
        mem.items[item.inventory_item_id._id] || Object.assign({}, item.inventory_item_id, {
          areas: {},
          volume: 0,
          value: 0
        });

      const memItemArea = memItem.areas[item.area_id._id] =
        memItem.areas[item.area_id._id] || Object.assign({}, item.area_id, {
          sections: {},
          volume: 0,
          value: 0
        });

      const memItemSection = memItemArea.sections[item.section_id._id] =
        memItemArea.sections[item.section_id._id] || Object.assign({}, item.section_id, {
          volume: 0,
          value: 0
        });

      const memStatType = mem.stats.types[memItem.product_id.type] =
        mem.stats.types[memItem.product_id.type] || {
          value: 0,
          categories: {}
        };

      const memStatCategory = memStatType.categories[memItem.product_id.category] =
        memStatType.categories[memItem.product_id.category] || {
          value: 0,
          sub_categories: {}
        };

      const memStatSubCategory = memStatCategory.sub_categories[memItem.product_id.sub_category] =
        memStatCategory.sub_categories[memItem.product_id.sub_category] || {
          value: 0
        };

      const itemValue = item.volume * (memItem.cost_price || 0 ); //eslint-disable-line

      // Inventory item sums
      memItem.volume += item.volume;
      memItem.value = roundToDecimal(memItem.value + itemValue); //eslint-disable-line
      memItemArea.volume += item.volume;
      memItemArea.value = roundToDecimal(memItemArea.value + itemValue); //eslint-disable-line
      memItemSection.volume += item.volume; //eslint-disable-line
      memItemSection.value = roundToDecimal(memItemSection.value + itemValue); // eslint-disable-line

      // Stat sums
      mem.stats.total_value = roundToDecimal(mem.stats.total_value + itemValue); //eslint-disable-line
      memStatType.value = roundToDecimal(memStatType.value + itemValue); //eslint-disable-line
      memStatCategory.value = roundToDecimal(memStatCategory.value + itemValue); //eslint-disable-line
      memStatSubCategory.value = roundToDecimal(memStatSubCategory.value + itemValue); //eslint-disable-line

      return mem;
    }, { items: {}, stats: { types: {}, total_value: 0 } })
  )
  .then(results =>
    Inventory.find(filters)
    .populate({
      path: 'product_id supplier_id',
      select: '-__v -updated_at -created_at'
    }).lean().execAsync()
    .then(inventories => (
      {
        items: inventories.filter(item => item.product_id).reduce((mem, item) => {
          if (!mem[item._id]) {
            mem[item._id] = Object.assign({}, item, {
              areas: {},
              volume: 0,
              value: 0
            });
          }
          return mem;
        }, results.items),
        stats: results.stats
      })
  ))
  .then((results) => {
    const report = Object.keys(results.items).map((itemId) => {
      // calculating how much to order based on par_level, volume and count_as_full
      results.items[itemId].order = 0;
      let fullBottles = results.items[itemId].volume - (results.items[itemId].volume % 1);
      if (results.items[itemId].volume % 1 > results.items[itemId].count_as_full) {
        fullBottles++;
      }
      const order = results.items[itemId].par_level - fullBottles;
      if (results.items[itemId].par_level && order > 0) {
        results.items[itemId].order = order;
      }

      results.items[itemId].areas = Object.keys(results.items[itemId].areas).map((areaId) => {
        results.items[itemId].areas[areaId].sections = Object.keys(results.items[itemId].areas[areaId].sections) //eslint-disable-line
        .map(sectionId =>
          results.items[itemId].areas[areaId].sections[sectionId]
        );
        return results.items[itemId].areas[areaId];
      });
      return results.items[itemId];
    });
    return {
      data: _.orderBy(report, ['product_id.category', 'product_id.sub_category', 'product_id.name']),
      stats: results.stats
    };
  });
}

/**
 * Create new report
 * @property {string} req.body.name - The name of report.
 * @property {string} req.body.order - The order of report.
 * @returns {Report}
 */
function create(req, res, next) {
  User.get(req.user._id)
  .then(user =>
    generateReport({ venue_id: req.body.venue_id }).then((reportData) => {
      const report = new Report({
        venue_id: req.body.venue_id,
        data: reportData.data,
        stats: reportData.stats,
        created_by: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      });
      return report;
    })
  )
  .then(report => report.saveAsync())
  .then(savedReport =>
    res.status(httpStatus.CREATED).json(savedReport)
  )
  .error(e => next(e));
}

/**
 * Update existing report
 * @property {string} req.body.name - The name of report.
 * @property {string} req.body.order - The order of report.
 * @returns {Report}
 */
function update(req, res, next) {
  const report = req.report;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  // Let admins approve a report to make it available to all users
  if (!req.user.admin) delete req.body.approved; // eslint-disable-line

  patchModel(report, Report, req.body);

  report.saveAsync()
    .then(savedReport => res.json(savedReport))
    .error(e => next(e));
}

/**
 * Get report list.
 * @property {number} req.query.skip - Number of reports to be skipped.
 * @property {number} req.query.limit - Limit number of reports to be returned.
 * @returns {Report[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  const whiteList = { venue_id : { $in: venues }}; // eslint-disable-line

  Report.list(req.query, whiteList)
    .then(results => res.json(results))
    .error(e => next(e));
}

/**
 * Delete report.
 * @returns {Report}
 */
function remove(req, res, next) {
  const report = req.report;

  report.removeAsync()
    .then(deletedReport => res.json(deletedReport))
    .error(e => next(e));
}

const getExport = (req, res) =>
  Venue.get(req.report.venue_id).then((venue) => {
    const xls = reportToXLS(req.report, venue);
    const fileName = `${venue.profile.name} Stock Report ${moment(req.report.created_at).format('DD-MM-YYYY')}.xlsx`;
    return xls.write(fileName, res);
  });

const generateUsageReport = (openingId, closingId) =>
  Promise.all([
    Report.get(openingId),
    Report.get(closingId)
  ])
  .then(([openingStock, closingStock]) =>
    Order.find({
      status: { $in: ['delivered', 'paid'] },
      req_delivery_date: {
        $gte: openingStock.created_at,
        $lt: closingStock.created_at
      }
    })
    .execAsync()
    .then((purchases) => {
      const items = {};
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          const data = {
            ammount: parseFloat(item.ammount),
            cost: roundToDecimal(
              parseFloat(item.inventory_item.cost_price) * parseFloat(item.ammount)),
            date: purchase.req_delivery_date
          };
          if (!items[item.inventory_item._id]) {
            items[item.inventory_item._id] = [data];
          } else {
            items[item.inventory_item._id].push(data);
          }
        });
      });
      return {
        openingStock: openingStock.toObject(),
        closingStock: closingStock.toObject(),
        purchases: items
      };
    })
  )
  .then(({ openingStock, purchases, closingStock }) => {
    let items = openingStock.data.reduce((mem, item) => {
      mem[item._id] = Object.assign(item, {
        open: item.volume,
        close: 0,
        areas: undefined
      });
      return mem;
    }, {});

    items = closingStock.data.reduce((mem, item) => {
      if (!mem[item._id]) {
        mem[item._id] = Object.assign(item, {
          open: 0,
          areas: undefined
        });
      }
      mem[item._id].close = item.volume;
      return mem;
    }, items);

    items = Object.keys(items).reduce((mem, itemId) => {
      mem[itemId].purchases = purchases[items[itemId]._id] || [];
      const usage =
        (items[itemId].open +
        items[itemId].purchases.reduce((acc, pItem) => {
          acc += pItem.ammount;
          return acc;
        }, 0)) - items[itemId].close;
      items[itemId].usage = usage > 0 ? usage : 0;
      return mem;
    }, items);

    return {
      items,
      open: Object.assign({}, openingStock, {
        data: undefined,
        stats: undefined
      }),
      close: Object.assign({}, closingStock, {
        data: undefined,
        stats: undefined
      }),
    };
  })
  .then(({ items, open, close }) => {
    const itemsArray = Object.keys(items).reduce((mem, item) => {
      mem.push(items[item]);
      return mem;
    }, []);

    const stats = itemsArray.reduce((acc, item) => {
      const type = item.product_id.type || 'beverage';
      const category = item.product_id.category || 'other';
      const subCategory = item.product_id.sub_category || 'other';

      if (!acc.types[type]) {
        acc.types[type] = {
          value: 0,
          categories: {}
        };
      }
      const $type = acc.types[type];

      if (!$type.categories[category]) {
        $type.categories[category] = {
          value: 0,
          sub_categories: {}
        };
      }
      const $category = $type.categories[category];

      if (!$category.sub_categories[subCategory]) {
        $category.sub_categories[subCategory] = {
          value: 0,
        };
      }
      const $subCategory = $category.sub_categories[subCategory];

      const cogs = item.usage > 0 && item.cost_price ? item.usage * item.cost_price : 0;
      acc.total_value += roundToDecimal(cogs);
      $type.value = roundToDecimal($type.value + cogs);
      $category.value = roundToDecimal($category.value + cogs);
      $subCategory.value = roundToDecimal($subCategory.value + cogs);

      return acc;
    }, { types: {}, total_value: 0 });

    return { data: itemsArray, stats, open, close };
  });

function getUsage(req, res, next) {
  const openingId = req.query.open;
  const closingId = req.query.close;

  generateUsageReport(openingId, closingId)
  .then(usageReport => res.send(usageReport))
  .catch(e => next(e));
}

const getUsageExport = (req, res, next) => {
  const openingId = req.query.open;
  const closingId = req.query.close;
  const venueId = req.query.venue_id;

  Promise.all([
    generateUsageReport(openingId, closingId),
    Venue.get(venueId)
  ])
  .then(([usageReport, venue]) => {
    const xls = usageReportToXLS(usageReport, venue);
    const fileName = `${venue.profile.name} Stock Period Report ${moment(usageReport.open.created_at).format('DD-MM-YYYY')} - ${moment(usageReport.close.created_at).format('DD-MM-YYYY')}.xlsx`;
    return xls.write(fileName, res);
  })
  .catch(e => next(e));
};

export default { load, get, create, update, list, remove, getExport, getUsage, getUsageExport };
