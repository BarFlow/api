import httpStatus from 'http-status';
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

export default { load, get, create, update, list, remove };
