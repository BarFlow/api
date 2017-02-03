import httpStatus from 'http-status';
import xl from 'excel4node';
// import _ from 'lodash';
import Order from '../models/order';
import patchModel from '../helpers/patchModel';

/**
 * Load order and append to req.
 */
function load(req, res, next, id) {
  Order.get(id, req.query.populate === 'true').then((order) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = order.venue_id; // eslint-disable-line no-param-reassign
    req.order = order; // eslint-disable-line no-param-reassign
    return next();
  }).error(e => next(e));
}

/**
 * Get order
 * @returns {Order}
 */
function get(req, res) {
  return res.json(req.order);
}

/**
 * Create new order
 * @property {string} req.body.name - The name of order.
 * @property {string} req.body.order - The order of order.
 * @returns {Order}
 */
function create(req, res, next) {
  if (!Array.isArray(req.body)) {
    req.body = [req.body];
  }

  Promise.all(req.body.map(order =>
    saveModel(order, req.user._id, req.query.populate === 'true')
  ))
    .then((savedOrders) => {
      // If only one item is saved return an object insted of an array
      if (savedOrders.length === 1) {
        savedOrders = savedOrders[0];
      }

      return res.status(httpStatus.CREATED).json(savedOrders);
    })
    .catch(e => next(e));
}

function saveModel(model, createdBy, populate) {
  const order = new Order(Object.assign(model, {
    created_by: createdBy
  }));

  return order.saveAsync()
    .then((savedOrder) => {
      // Populate models if query string is true and the request type is get
      if (populate) {
        return Order.populate(savedOrder, { path: 'supplier_id' });
      }

      return savedOrder;
    });
}

/**
 * Update existing order
 * @property {string} req.body.name - The name of order.
 * @property {string} req.body.order - The order of order.
 * @returns {Order}
 */
function update(req, res, next) {
  const order = req.order;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  patchModel(order, Order, req.body);

  order.saveAsync()
    .then(savedOrder => res.json(savedOrder))
    .error(e => next(e));
}

/**
 * Get order list.
 * @property {number} req.query.skip - Number of orders to be skipped.
 * @property {number} req.query.limit - Limit number of orders to be returned.
 * @returns {Order[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  const whiteList = { venue_id : { $in: venues } }; // eslint-disable-line

  Order.list(req.query, whiteList)
    .then(results => res.header('X-Total-Count', results.length).json(results))
    .error(e => next(e));
}

/**
 * Delete order.
 * @returns {Order}
 */
function remove(req, res, next) {
  const order = req.order;

  order.removeAsync()
    .then(deletedOrder => res.json(deletedOrder))
    .error(e => next(e));
}

function getExport(req, res) {
  const xls = generateOrderSheet(req.order);
  xls.write(`${new Date(req.order.created_at)
    .toString()
    .split(' ')
    .splice(0, 5)
    .join(' ')}.xlsx`, res);
}

function generateOrderSheet({
  supplier_id: supplierId = {},
  items = [],
  other_items: otherItems = [],
  venue_name: venueName = '',
  placed_by: placedBy = '',
  contact_tel: contactTel = '',
  contact_email: contactEmail = '',
  delivery_address: deliveryAddress = '',
  req_delivery_date: reqDeliveryDate = new Date(),
  created_at: createdAt = new Date()
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

  const { name: supplierName = 'Other', account_number: accountNumber = '' } = supplierId;

  // Add Worksheets to the workbook
  const ws = wb.addWorksheet(supplierName);

  // Calculate longest item name's length
  let descriptionMaxLength = items.reduce((mem, item) => {
    const name = item.inventory_item.product_id.name;
    if (name.length > mem) {
      mem = name.length;
    }
    return mem;
  }, 10);
  descriptionMaxLength = otherItems.reduce((mem, item) => {
    const name = item.description;
    if (name.length > mem) {
      mem = name.length;
    }
    return mem;
  }, descriptionMaxLength);

  // Set column widths
  ws.column(1).setWidth(12);
  ws.column(2).setWidth(descriptionMaxLength);
  ws.column(4).setWidth(24);
  ws.column(5).setWidth(18);

  // Top header
  ws.cell(1, 1, 1, 5, true).string(supplierName).style(darkBgWhiteBoldCenterText);
  ws.cell(2, 1, 5, 5).style(yellowBg);
  ws.cell(2, 1).string('Name:').style(header);
  ws.cell(2, 2).string(venueName);
  ws.cell(2, 4).string('Date:').style(header);
  ws.cell(2, 5).date(createdAt);
  ws.cell(3, 1).string('Account:').style(header);
  ws.cell(3, 2).string(accountNumber);
  ws.cell(3, 4).string('Contact:').style(header);
  ws.cell(3, 5).string(contactTel).style(alignRight);
  ws.cell(4, 1).string('Address:').style(header);
  ws.cell(4, 2).string(deliveryAddress);
  ws.cell(4, 4).string('Order Placed By:').style(header);
  ws.cell(4, 5).string(placedBy).style(alignRight);
  ws.cell(5, 1).string('Email:').style(header);
  ws.cell(5, 2).string(contactEmail);
  ws.cell(5, 4).string('Requested Delivery Date:').style(header);
  ws.cell(5, 5).date(reqDeliveryDate);

  // Top header has 5 rows
  const skipRows = 5;

  // Freeze Header BUG: https://github.com/amekkawi/excel4node/issues/107
  // ws.row(5).freeze();

  // Columns definition
  let currentRow = skipRows + 1;
  ws.cell(currentRow, 1, currentRow, 5).style(header2);
  ws.cell(currentRow, 1).string('SKU'); // A
  ws.cell(currentRow, 2).string('Description'); // B
  ws.cell(currentRow, 3).string('Net Price'); // C
  ws.cell(currentRow, 4).string('Quantity (Bottles)'); // D
  ws.cell(currentRow, 5).string('Total'); // E

  // List items
  items.forEach((item) => {
    ++currentRow;
    const {
      product_supplier_code: sku = '',
      cost_price: price = 0,
      product_id: product = {
        name: ''
      } } = item.inventory_item;
    const ammount = item.ammount;

    ws.cell(currentRow, 1).string(sku);
    ws.cell(currentRow, 2).string(product.name);
    ws.cell(currentRow, 3).number(price).style(currencyStyle);
    ws.cell(currentRow, 4).number(ammount);
    ws.cell(currentRow, 5).formula(`C${currentRow}*D${currentRow}`).style(currencyStyle);
  });

  // Other items list
  otherItems.forEach((item) => {
    ++currentRow;
    const {
      description,
      price = 0,
      ammount = 0
    } = item;

    ws.cell(currentRow, 2).string(description);
    ws.cell(currentRow, 3).number(price).style(currencyStyle);
    ws.cell(currentRow, 4).number(ammount);
    ws.cell(currentRow, 5).formula(`C${currentRow}*D${currentRow}`).style(currencyStyle);
  });

  // Claculate total cost for the order
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5).style(header2).style(alignRight);
  ws.cell(currentRow, 4).string('Subtotal');
  ws.cell(currentRow, 5).formula(`SUM(E6:E${(currentRow - 1)})`).style(currencyStyle);
  ++currentRow;
  ws.cell(currentRow, 4, currentRow, 5).style(header2).style(alignRight);
  ws.cell(currentRow, 4).string('VAT');
  ws.cell(currentRow, 5).formula(`E${currentRow - 1} * 0.2`).style(currencyStyle);
  ++currentRow;
  ws.cell(currentRow, 4, currentRow, 5).style(header2).style(alignRight);
  ws.cell(currentRow, 4).string('Grand Total');
  ws.cell(currentRow, 5).formula(`E${currentRow - 1} +  E${currentRow - 2}`).style(currencyStyle);

  // Warning
  currentRow += 2;
  ws.cell(currentRow, 1, currentRow, 5, true).string('Please notify us immediately if you are unable to ship as specified.').style(alignCenter);

  // Barflow branding
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true);
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true).string('Powered by BarFlow').style(alignCenter);
  ++currentRow;
  ws.cell(currentRow, 1, currentRow, 5, true).link('http://barflow.io').style(alignCenter);

  return wb;
}

export default { load, get, create, update, list, remove, getExport };
