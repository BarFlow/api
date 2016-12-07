import httpStatus from 'http-status';
import xl from 'excel4node';
import _ from 'lodash';
import Report from '../models/report';
import Placement from '../models/placement';
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
  .execAsync()
  .then(results =>
    results.filter(item => item.inventory_item_id && item.area_id && item.section_id)
    .reduce((mem, item) => {
      item = item.toObject();
      if (!mem[item.inventory_item_id._id]) {
        mem[item.inventory_item_id._id] = item.inventory_item_id;
        mem[item.inventory_item_id._id].areas = {};
        mem[item.inventory_item_id._id].volume = 0;
      }
      if (!mem[item.inventory_item_id._id].areas[item.area_id._id]) {
        mem[item.inventory_item_id._id].areas[item.area_id._id] = item.area_id;
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections = {};
        mem[item.inventory_item_id._id].areas[item.area_id._id].volume = 0;
      }
      if (!mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id]) {
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id] = item.section_id; //eslint-disable-line
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id].volume = 0; //eslint-disable-line
      }

      mem[item.inventory_item_id._id].volume += item.volume;
      mem[item.inventory_item_id._id].areas[item.area_id._id].volume += item.volume;
      mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id].volume += item.volume; //eslint-disable-line
      return mem;
    }, {})
  )
  .then((results) => {
    const report = Object.keys(results).map((itemId) => {
      // calculating how much to order based on par_level, volume and count_as_full
      results[itemId].order = 0;
      let fullBottles = results[itemId].volume - (results[itemId].volume % 1);
      if (results[itemId].volume % 1 > results[itemId].count_as_full) {
        fullBottles++;
      }
      const order = results[itemId].par_level - fullBottles;
      if (results[itemId].par_level && order > 0) {
        results[itemId].order = order;
      }

      results[itemId].areas = Object.keys(results[itemId].areas).map((areaId) => {
        results[itemId].areas[areaId].sections = Object.keys(results[itemId].areas[areaId].sections)
        .map(sectionId =>
          results[itemId].areas[areaId].sections[sectionId]
        );
        return results[itemId].areas[areaId];
      });
      return results[itemId];
    });
    return _.orderBy(report, ['product_id.name']);
  });
}

function getExport(req, res) {
  const xls = generateXLSfromReport(req.report.data);
  xls.write(`${new Date(req.report.created_at)
    .toString()
    .split(' ')
    .splice(0, 5)
    .join(' ')}.xlsx`, res);
}

function generateXLSfromReport(report) {
  let productNameMaxLength = 10;
  let categoryMaxLength = 10;
  let supplierNameMaxLength = 10;

  const products = _.orderBy(report.map((item) => {
    const supplier = item.supplier_id || {};
    if (supplier.name && supplier.name.length > supplierNameMaxLength) {
      supplierNameMaxLength = supplier.name.length;
    }

    if (item.product_id.name.length > productNameMaxLength) {
      productNameMaxLength = item.product_id.name.length;
    }

    let category = item.product_id.category || 'other';
    if (item.product_id.sub_category) {
      category += `/${item.product_id.sub_category}`;
    }
    if (category.length > categoryMaxLength) {
      categoryMaxLength = category.length;
    }

    return {
      category,
      name: item.product_id.name,
      supplier: supplier.name || '',
      sku: item.supplier_product_code || '',
      par_level: item.par_level || 0,
      stock_level: parseFloat(item.volume.toFixed(1)) || 0,
      order: item.order || 0
    };
  }), ['category', 'supplier', 'name']);

  // Create a new instance of  a Workbook class
  const wb = new xl.Workbook();

  // Add Worksheets to the workbook
  const ws = wb.addWorksheet('Stock Sheet');

  const header = wb.createStyle({
    font: {
      bold: true,
    },
    alignment: {
      horizontal: 'center'
    }
  });

  const columns = [
    { key: 'category', title: 'Category', type: 'string' },
    { key: 'name', title: 'Product', type: 'string' },
    { key: 'supplier', title: 'Supplier', type: 'string' },
    { key: 'sku', title: 'SKU', type: 'string' },
    { key: 'par_level', title: 'Par Level', type: 'number' },
    { key: 'stock_level', title: 'Stock Level', type: 'number' },
    { key: 'order', title: 'Order', type: 'number' }
  ];

  for (let i = 0; i < products.length; i++) {
    if (i === 0) {
      for (let k = 0; k < columns.length; k++) {
        ws.cell(i + 1, k + 1).string(columns[k].title).style(header);
      }
    }
    for (let j = 0; j < columns.length; j++) {
      ws.cell(i + 2, j + 1)[columns[j].type](products[i][columns[j].key]);
    }
  }

  ws.column(1).setWidth(categoryMaxLength);
  ws.column(2).setWidth(productNameMaxLength);
  ws.column(3).setWidth(supplierNameMaxLength);

  return wb;
}

/**
 * Create new report
 * @property {string} req.body.name - The name of report.
 * @property {string} req.body.order - The order of report.
 * @returns {Report}
 */
function create(req, res, next) {
  generateReport({ venue_id: req.body.venue_id }).then((reportData) => {
    const report = new Report({
      venue_id: req.body.venue_id,
      data: reportData
    });
    return report;
  })
  .then(report =>
    report.saveAsync()
    .then(savedReport => res.status(httpStatus.CREATED).json(savedReport))
    .error(e => next(e))
  );
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
