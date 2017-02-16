import httpStatus from 'http-status';
import xl from 'excel4node';
import _ from 'lodash';
import Report from '../models/report';
import Placement from '../models/placement';
import Venue from '../models/venue';
import User from '../models/user';
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
    results.filter(item =>
      item.inventory_item_id
      && item.inventory_item_id.product_id
      && item.area_id
      && item.section_id)
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
  Venue.findById(req.report.venue_id).execAsync().then(venue =>
    User.findById(req.user._id).execAsync().then((user) => {
      const xls = generateReportXLS(req.report.data, user, venue);
      return xls.write(`${new Date(req.report.created_at)
        .toString()
        .split(' ')
        .splice(0, 5)
        .join(' ')}.xlsx`, res);
    })
  );
}

function addProductSheetToWorkBook(wb, products, user, venue, supplier) {
  // Add Worksheets to the workbook
  const ws = wb.addWorksheet(supplier.name || 'Other');

  // Calculate longest product name's length
  let productNameMaxLength = 10;
  products.forEach((item) => {
    if (item.name.length > productNameMaxLength) {
      productNameMaxLength = item.name.length;
    }
  });

  // Set column widths
  ws.column(1).setWidth(12);
  ws.column(2).setWidth(productNameMaxLength);
  ws.column(7).setWidth(24);
  ws.column(8).setWidth(18);


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

  const supplierName = wb.createStyle({
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
    numberFormat: '£#,##0.00; (£#,##0.00); -'
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

  // Top header has 4 rows
  const skipRows = 5;
  const currentDate = new Date();

  // Top header
  ws.cell(1, 1, 1, 8, true).string(supplier.name || 'Other').style(supplierName);
  ws.cell(2, 1, 5, 8).style(yellowBg);
  ws.cell(2, 1).string('Name:').style(header);
  ws.cell(2, 2).string(venue.profile.name || '');
  ws.cell(2, 7).string('Date:').style(header);
  ws.cell(2, 8).date(currentDate);
  ws.cell(3, 1).string('Account:').style(header);
  ws.cell(3, 2).string(supplier.account_number || '');
  ws.cell(3, 7).string('Contact:').style(header);
  ws.cell(3, 8).string(venue.profile.tel || '').style(alignRight);
  ws.cell(4, 1).string('Address:').style(header);
  ws.cell(4, 2).string(venue.profile.address || '');
  ws.cell(4, 7).string('Order Placed By:').style(header);
  ws.cell(4, 8).string(user.name || '').style(alignRight);
  ws.cell(5, 1).string('Email:').style(header);
  ws.cell(5, 2).string(venue.profile.email || '');
  ws.cell(5, 7).string('Requested Delivery Date:').style(header);
  ws.cell(5, 8).date(currentDate);

  // Columns definition
  const columns = [
    { key: 'sku', title: 'SKU', type: 'string' }, // A
    { key: 'name', title: 'Description', type: 'string' }, // B
    { key: 'cost_price', title: 'Net Price', type: 'number' }, // C
    { key: 'inc_vat', title: 'Inc VAT', type: 'number' }, // D
    { key: 'par_level', title: 'Par Level', type: 'number' }, // E
    { key: 'stock_level', title: 'Stock Level', type: 'number' }, // F
    { key: 'order', title: 'Order Quantity (Bottles)', type: 'number' }, // G
    { key: 'value', title: 'Value (Inc VAT)', type: 'number' } // H
  ];

  // Freeze Header BUG: https://github.com/amekkawi/excel4node/issues/107
  // ws.row(5).freeze();

  // List products
  for (let i = 0; i < products.length; i++) {
    if (i === 0) {
      for (let k = 0; k < columns.length; k++) {
        ws.cell(i + 1 + skipRows, k + 1).string(columns[k].title).style(header2);
      }
    }
    for (let j = 0; j < columns.length; j++) {
      const row = i + 2 + skipRows;
      if (columns[j].key === 'inc_vat') {
        ws.cell(row, j + 1).formula(`C${row}*1.2`).style(currencyStyle);
      } else if (columns[j].key === 'value') {
        ws.cell(row, j + 1).formula(`G${row}*D${row}`).style(currencyStyle);
      } else {
        ws.cell(row, j + 1)[columns[j].type](products[i][columns[j].key]);
        if (columns[j].key === 'cost_price') {
          ws.cell(row, j + 1).style(currencyStyle);
        }
      }
    }
  }

  // Claculate total cost for the order
  const lastRow = products.length + skipRows + 2;
  ws.cell(lastRow, 1, lastRow, 8).style(header2).style(alignRight);
  ws.cell(lastRow, 7).string('Total (Inc VAT)');
  ws.cell(lastRow, 8).formula(`SUM(H6:H${(lastRow - 1)})`).style(currencyStyle);

  // Barflow branding
  ws.cell(lastRow + 1, 1, lastRow + 1, 8, true).string('Generated by BarFlow').style(alignCenter);
  ws.cell(lastRow + 2, 1, lastRow + 2, 8, true).link('http://barflow.io').style(alignCenter);

  // Return the workbook with the new sheet
  return wb;
}

function generateReportXLS(report, user, venue) {
  // Create a new instance of  a Workbook class
  let wb = new xl.Workbook({
    dateFormat: 'dd.mm.yyyy;@'
  });

  const productsBySuppliers = _.groupBy(report, 'supplier_id._id');

  Object.keys(productsBySuppliers).forEach((supplierId) => {
    const products = productsBySuppliers[supplierId].map(item => (
      {
        name: item.product_id.name,
        sku: item.supplier_product_code || '',
        par_level: item.par_level || 0,
        cost_price: item.cost_price || 0,
        supplier: item.supplier || {},
        stock_level: parseFloat(item.volume.toFixed(1)) || 0,
        order: item.order || 0
      }
    ));

    const supplier = productsBySuppliers[supplierId][0].supplier_id || {};

    wb = addProductSheetToWorkBook(wb, products, user, venue, supplier);
  });

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
  .then(report => report.saveAsync())
  .then(savedReport =>
    Placement.update({ venue_id: req.body.venue_id }, { volume: 0 }, { multi: true }).execAsync()
    .then(() =>
      res.status(httpStatus.CREATED).json(savedReport)
    )
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
