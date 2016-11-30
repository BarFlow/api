import httpStatus from 'http-status';
import Supplier from '../models/supplier';
import patchModel from '../helpers/patchModel';

/**
 * Load supplier and append to req.
 */
function load(req, res, next, id) {
  Supplier.get(id).then((supplier) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = supplier.venue_id; // eslint-disable-line no-param-reassign
    req.supplier = supplier; // eslint-disable-line no-param-reassign
    return next();
  }).error(e => next(e));
}

/**
 * Get supplier
 * @returns {Supplier}
 */
function get(req, res) {
  return res.json(req.supplier);
}

/**
 * Create new supplier
 * @property {string} req.body.name - The name of supplier.
 * @property {string} req.body.order - The order of supplier.
 * @returns {Supplier}
 */
function create(req, res, next) {
  const supplier = new Supplier({
    name: req.body.name,
    address: req.body.address,
    email: req.body.email,
    tel: req.body.tel,
    venue_id: req.body.venue_id
  });

  supplier.saveAsync()
    .then(savedSupplier => res.status(httpStatus.CREATED).json(savedSupplier))
    .error(e => next(e));
}

/**
 * Update existing supplier
 * @property {string} req.body.name - The name of supplier.
 * @property {string} req.body.order - The order of supplier.
 * @returns {Supplier}
 */
function update(req, res, next) {
  const supplier = req.supplier;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  // Let admins approve a supplier to make it available to all users
  if (!req.user.admin) delete req.body.approved; // eslint-disable-line

  patchModel(supplier, Supplier, req.body);

  supplier.saveAsync()
    .then(savedSupplier => res.json(savedSupplier))
    .error(e => next(e));
}

/**
 * Get supplier list.
 * @property {number} req.query.skip - Number of suppliers to be skipped.
 * @property {number} req.query.limit - Limit number of suppliers to be returned.
 * @returns {Supplier[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  const whiteList = { $or : [{ venue_id : { $in: venues }}, {approved: true}] }; // eslint-disable-line

  Supplier.list(req.query, whiteList)
    .then(results => res.header('X-Total-Count', results.count).json(results.suppliers))
    .error(e => next(e));
}

/**
 * Delete supplier.
 * @returns {Supplier}
 */
function remove(req, res, next) {
  const supplier = req.supplier;

  supplier.removeAsync()
    .then(deletedSupplier => res.json(deletedSupplier))
    .error(e => next(e));
}

export default { load, get, create, update, list, remove };
