import httpStatus from 'http-status';
import Inventory from '../models/inventory';
import patchModel from '../helpers/patchModel';
import APIError from '../helpers/APIError';

/**
 * Load inventoryItem and append to req.
 */
function load(req, res, next, id) {
  Inventory.get(id).then((inventoryItem) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = inventoryItem.venue_id; // eslint-disable-line no-param-reassign
    req.inventoryItem = inventoryItem; // eslint-disable-line no-param-reassign
    return next();
  }).catch(e => next(e));
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
  // Balcklisted params
  delete req.body._id; // eslint-disable-line
  delete req.body.history; // eslint-disable-line

  req.body.history = [{
    date: new Date(),
    payload: Object.assign({}, req.body),
    user_id: req.user._id
  }];
  Inventory.create(req.body)
    .then((savedInventory) => {
      // Populate models if query string is true and the request type is get
      if (req.query.populate === 'true') {
        return Inventory.populate(savedInventory, { path: 'product_id' });
      }

      return savedInventory;
    })
    .then(savedInventory => res.status(httpStatus.CREATED).json(savedInventory))
    .catch((e) => {
      next(e);
    });
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
  delete req.body.history; // eslint-disable-line

  inventoryItem.history.push({
    date: new Date(),
    payload: req.body,
    user_id: req.user._id
  });

  patchModel(inventoryItem, Inventory, req.body);

  inventoryItem.saveAsync().then(() => Inventory.get(inventoryItem._id))
    .then(savedInventory => res.json(savedInventory))
    .catch((e) => {
      if (e.code === 11000 &&
        e.errmsg.search(req.body.supplier_product_code) > -1) {
        // If the provided SKU number has been used
        // for and outher product already send back error
        const err = new APIError('The SKU number is already being used for another product.', httpStatus.BAD_REQUEST, true);
        return next(err);
      }
      next(e);
    });
}

/**
 * Bulk update inventoryItems
 * @property {array} req.body - An array of inventoryItem objects to be updated.
 * @returns {Inventory}
 */
function bulkUpdate(req, res, next) {
  const inventoryItems = req.body.map(inventoryItem => { // eslint-disable-line
    // Black listed params
    delete inventoryItem.__v; // eslint-disable-line
    delete inventoryItem.created_at; // eslint-disable-line

    return inventoryItem;
  });
  Inventory.bulkUpdate(inventoryItems).then(() => res.status(httpStatus.ACCEPTED).send())
    .catch(e => next(e));
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

  Inventory.list(req.query)
    .then(results =>
      res.header('X-Total-Count', results.count).json(results.items)
    )
    .catch(e => next(e));
}

/**
 * Delete inventoryItem.
 * @returns {Inventory}
 */
function remove(req, res, next) {
  const inventoryItem = req.inventoryItem;

  inventoryItem.removeAsync()
    .then(deletedInventory => res.json(deletedInventory))
    .catch(e => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
