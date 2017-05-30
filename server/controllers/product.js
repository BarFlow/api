import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Product from '../models/product';
import patchModel from '../helpers/patchModel';

/**
 * Load product and append to req.
 */
function load(req, res, next, id) {
  Product.get(id).then((product) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = product.venue_id; // eslint-disable-line no-param-reassign
    req.product = product; // eslint-disable-line no-param-reassign
    return next();
  }).error(e => next(e));
}

/**
 * Get product
 * @returns {Product}
 */
function get(req, res) {
  return res.json(req.product);
}

/**
 * Create new product
 * @property {string} req.body.name - The name of product.
 * @property {string} req.body.order - The order of product.
 * @returns {Product}
 */
function create(req, res, next) {
  const product = new Product({
    name: req.body.name,
    type: req.body.type,
    category: req.body.category,
    sub_category: req.body.sub_category || 'other',
    images: req.body.images,
    measurable: req.body.measurable,
    measurable_from: req.body.measurable_from,
    measurable_till: req.body.measurable_till,
    capacity: req.body.capacity,
    measure_unit: req.body.measure_unit,
    venue_id: req.body.venue_id,
    parent_id: req.body.parent_id,
    approved: req.user.admin
  });

  product.saveAsync()
    .then(savedProduct => res.status(httpStatus.CREATED).json(savedProduct))
    .error(e => next(e));
}

/**
 * Update existing product
 * @property {string} req.body.name - The name of product.
 * @property {string} req.body.order - The order of product.
 * @returns {Product}
 */
function update(req, res, next) {
  const product = req.product;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  // Let admins approve a product to make it available to all users
  if (!req.user.admin) delete req.body.approved; // eslint-disable-line

  if (req.body.sub_category === '') {
    req.body.sub_category = 'other';
  }

  patchModel(product, Product, req.body);

  product.saveAsync()
    .then(savedProduct => res.json(savedProduct))
    .error(e => next(e));
}

/**
 * Get product list.
 * @property {number} req.query.skip - Number of products to be skipped.
 * @property {number} req.query.limit - Limit number of products to be returned.
 * @returns {Product[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  const whiteList = { $or : [{ venue_id : { $in: venues }}, {approved: true}] }; // eslint-disable-line

  Product.list(req.query, whiteList)
    .then(results => res.header('X-Total-Count', results.count).json(results.products))
    .error(e => next(e));
}

/**
 * Delete product.
 * @returns {Product}
 */
function remove(req, res, next) {
  const product = req.product;
  const err = new APIError(
    `Method: ${req.method} is forbidden for this resource`,
    httpStatus.FORBIDDEN, true);

  if (product.approved && !req.user.admin) {
    return next(err);
  }

  product.removeAsync()
    .then(deletedProduct => res.json(deletedProduct))
    .error(e => next(e));
}

export default { load, get, create, update, list, remove };
