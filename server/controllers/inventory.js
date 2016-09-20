import httpStatus from 'http-status';
import Inventory from '../models/inventory';
import patchModel from '../helpers/patchModel';

/**
 * Load inventoryItem and append to req.
 */
function load(req, res, next, id) {
  Inventory.get(id).then((inventoryItem) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = inventoryItem.venue_id; // eslint-disable-line no-param-reassign
    req.inventoryItem = inventoryItem; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get inventoryItem
 * @returns {Inventory}
 */
function get(req, res) {
  return res.json(req.inventoryItem);
}

/**
 * Create new inventoryItem
 * @property {string} req.body - The inventoryItem.
 * @returns {Inventory}
 */
function create(req, res, next) {
  const inventoryItem = new Inventory({
    venue_id: req.body.venue_id,
    product_id: req.body.product_id,
    supplier_id: req.body.supplier_id,
    supplier_product_code: req.body.supplier_product_code,
    stock_level: req.body.stock_level,
    par_level: req.body.par_level,
    wholesale_cost: req.body.wholesale_cost,
    sale_price: req.body.sale_price
  });

  inventoryItem.saveAsync()
    .then((savedInventory) => res.status(httpStatus.CREATED).json(savedInventory))
    .error((e) => next(e));
}

/**
 * Update existing inventoryItem
 * @property {string} req.body - The inventoryItem.
 * @returns {Inventory}
 */
function update(req, res, next) {
  const inventoryItem = req.inventoryItem;

  // Balcklisted params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  patchModel(inventoryItem, Inventory, req.body);

  inventoryItem.saveAsync()
    .then((savedInventory) => res.json(savedInventory))
    .error((e) => next(e));
}

/**
 * Bulk update inventoryItems
 * @property {array} req.body - An array of inventoryItem objects to be updated.
 * @returns {Inventory}
 */
function bulkUpdate(req, res, next) {
  const inventoryItems = req.body.map(inventoryItem => { // eslint-disable-line
    // Balcklisted params
    delete inventoryItem.created_at; // eslint-disable-line
    return inventoryItem;
  });
  Inventory.bulkUpdate(inventoryItems).then(() =>	res.status(httpStatus.ACCEPTED).send())
    .error((e) => next(e));
}

/**
 * Get inventoryItem list.
 * @property {number} req.query.skip - Number of inventoryItems to be skipped.
 * @property {number} req.query.limit - Limit number of inventoryItems to be returned.
 * @returns {Inventory[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  if (!req.query.venue_id || venues.indexOf(req.query.venue_id) === -1) {
    req.query.venue_id = { $in: venues }; // eslint-disable-line
  }

  Inventory.list(req.query).then((inventoryItems) =>	res.json(inventoryItems))
    .error((e) => next(e));
}

/**
 * Delete inventoryItem.
 * @returns {Inventory}
 */
function remove(req, res, next) {
  const inventoryItem = req.inventoryItem;

  inventoryItem.removeAsync()
    .then((deletedInventory) => res.json(deletedInventory))
    .error((e) => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
