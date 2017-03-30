import httpStatus from 'http-status';
import xl from 'excel4node';
import _ from 'lodash';
import moment from 'moment';
import Report from '../models/report';
import Placement from '../models/placement';
import Venue from '../models/venue';
import User from '../models/user';
import Inventory from '../models/inventory';
import patchModel from '../helpers/patchModel';

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
    select: '-__v -updated_at -created_at',
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

      const roundToDecimal = value =>
        Math.round((value) * 100) / 100;

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

function getExport(req, res) {
  return Venue.get(req.report.venue_id).then((venue) => {
    const xls = generateReportXLS(req.report, venue);
    const fileName = `${venue.profile.name} Stock Report ${moment(req.report.created_at).format('DD-MM-YYYY')}.xlsx`;
    return xls.write(fileName, res);
  });
}

function generateReportXLS(report, {
  profile: {
    name: venueName = ''
  }
}) {
  // Create a new instance of  a Workbook class
  const wb = new xl.Workbook({
    dateFormat: 'dd.mm.yyyy;@'
  });

  // Styles
  const header = wb.createStyle({
    font: {
      bold: true,
    },
    alignment: {
      horizontal: 'left'
    },
    fill: {
      type: 'pattern',
      patternType: 'solid',
      fgColor: '#FFFF00'
    }
  });

  const yellowBg = wb.createStyle({
    fill: {
      type: 'pattern',
      patternType: 'solid',
      fgColor: '#FFFF00'
    }
  });

  const darkBgWhiteBoldCenterText = wb.createStyle({
    fill: {
      type: 'pattern',
      patternType: 'solid',
      fgColor: '#383838'
    },
    alignment: {
      horizontal: 'center'
    },
    font: {
      bold: true,
      color: '#FFFFFF',
      size: 14
    }
  });

  const header2 = wb.createStyle({
    font: {
      bold: true,
    },
    alignment: {
      horizontal: 'center'
    },
    fill: {
      type: 'pattern',
      patternType: 'solid',
      fgColor: '#ececec'
    }
  });

  const currencyStyle = wb.createStyle({
    numberFormat: '£#,##0.00; (£#,##0.00); 0'
  });

  const alignLeft = wb.createStyle({
    alignment: {
      horizontal: 'left'
    }
  });

  const alignRight = wb.createStyle({
    alignment: {
      horizontal: 'right'
    }
  });

  const alignCenter = wb.createStyle({
    alignment: {
      horizontal: 'center'
    }
  });

  // Add Worksheets to the workbook
  const ws = wb.addWorksheet('Stock Report');

  // Calculate longest item name's length
  const descriptionMaxLength = report.data.reduce((mem, item) => {
    const name = item.product_id.name;
    if (name.length > mem) {
      mem = name.length;
    }
    return mem;
  }, 10);

  // Set column widths
  ws.column(1).setWidth(18);
  ws.column(2).setWidth(descriptionMaxLength);

  // Top header
  ws.cell(1, 1, 1, 6, true).string('Stock Report').style(darkBgWhiteBoldCenterText);
  ws.cell(2, 1, 4, 6).style(yellowBg);
  ws.cell(2, 1).string('Venue:').style(header);
  ws.cell(2, 2).string(venueName);
  ws.cell(3, 1).string('Date:').style(header);
  ws.cell(3, 2).string(moment(report.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft);
  ws.cell(4, 1).string('Created by:').style(header);
  ws.cell(4, 2).string(`${report.created_by.name} <${report.created_by.email}>`).style(alignLeft);

  // setting currentRow
  let currentRow = 4;

  // Columns definitions
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 6).style(header2);
  ws.cell(currentRow, 1).string('Category'); // A
  ws.cell(currentRow, 2).string('Description'); // B
  ws.cell(currentRow, 3).string('Net Price'); // C
  ws.cell(currentRow, 4).string('Par Level'); // D
  ws.cell(currentRow, 5).string('Stock Level'); // E
  ws.cell(currentRow, 6).string('Value'); // F

  // List items
  report.data.forEach(({
      cost_price: price = 0,
      par_level: parLevel = 0,
      volume: stockLevel = 0,
      value = 0,
      product_id: product = {
        name: 'other',
        sub_category: 'other'
      }
    }) => {
    ++currentRow;
    ws.cell(currentRow, 1).string(`${product.category} / ${product.sub_category}`);
    ws.cell(currentRow, 2).string(product.name);
    ws.cell(currentRow, 3).number(price).style(currencyStyle);
    ws.cell(currentRow, 4).number(parLevel);
    ws.cell(currentRow, 5).number(Math.round(stockLevel * 100) / 100);
    ws.cell(currentRow, 6).number(value).style(currencyStyle);
  });

  // Claculate total value
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 6).style(header2).style(alignRight);
  ws.cell(currentRow, 5).string('Total');
  ws.cell(currentRow, 6).formula(`SUM(F6:F${(currentRow - 1)})`).style(currencyStyle);


  // Barflow branding
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true);
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true).string('Powered by BarFlow').style(alignCenter);
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true).link('http://barflow.io').style(alignCenter);

  return wb;
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

export default { load, get, create, update, list, remove, getExport };
