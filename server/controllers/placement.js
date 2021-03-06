import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Placement from '../models/placement';
import Inventory from '../models/inventory';
import patchModel from '../helpers/patchModel';

/**
 * Load placement and append to req.
 */
function load(req, res, next, id) {
  // Populate model if query string is true and the request type is get
  const populate = req.query.populate === 'true' && req.method === 'GET';

  // Get document by id
  Placement.get(id, populate).then((placement) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = placement.venue_id; // eslint-disable-line no-param-reassign
    req.placement = placement; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get placement
 * @returns {Placement}
 */
function get(req, res) {
  return res.json(req.placement);
}

/**
 * Create new placement
 * @property {string} req.body.name - The name of placement.
 * @property {string} req.body.order - The order of placement.
 * @returns {Placement}
 */
function create(req, res, next) {
  const err = new APIError('Either inventory_item_id or product_id is required.',
  httpStatus.BAD_REQUEST, true);
  // Required params missing from request body
  if (!req.body.inventory_item_id && !req.body.product_id) {
    return next(err);
  }

  // inventory_item_id is missing but product_id is given
  if (!req.body.inventory_item_id && req.body.product_id) {
    return Inventory.create(req.body)
    .then(inventoryItem => {
      req.body.inventory_item_id = inventoryItem._id; // eslint-disable-line
      saveModel(req, res, next);
    });
  }

  saveModel(req, res, next);
}

function saveModel(req, res, next) {
  const placement = new Placement({
    venue_id: req.body.venue_id,
    area_id: req.body.area_id,
    section_id: req.body.section_id,
    inventory_item_id: req.body.inventory_item_id,
    volume: req.body.volume || 0,
    order: req.body.order || 0
  });

  placement.saveAsync()
    .then((savedPlacement) => {
      // Populate models if query string is true and the request type is get
      if (req.query.populate === 'true') {
        return Placement.populate(savedPlacement,
          { path: 'inventory_item_id',
          populate: {
            path: 'product_id'
          } });
      }

      return savedPlacement;
    })
    .then(savedPlacement => res.status(httpStatus.CREATED).json(savedPlacement))
    .error((e) => next(e));
}

/**
 * Update existing placement
 * @property {string} req.body.name - The name of placement.
 * @property {string} req.body.order - The order of placement.
 * @returns {Placement}
 */
function update(req, res, next) {
  const placement = req.placement;

  const err = new APIError('Conflict, the resource has a newer version on the server already.',
  httpStatus.CONFLICT, true);

  if (new Date(placement.updated_at) > new Date(req.body.updated_at)) return next(err);

  // White listed params
  const whiteList = {
    volume: req.body.volume,
    order: req.body.order,
    updated_at: req.body.updated_at
  };

  patchModel(placement, Placement, whiteList);

  placement.saveAsync()
    .then((savedPlacement) => res.json(savedPlacement))
    .error((e) => next(e));
}

/**
 * Bulk update placements
 * @property {array} req.body - An array of placement objects to be updated.
 * @returns {Placement}
 */
function bulkUpdate(req, res, next) {
  Placement.bulkUpdate(req.body).then(() =>	res.status(httpStatus.ACCEPTED).send())
    .error((e) => next(e));
}

/**
 * Get placement list.
 * @property {number} req.query.skip - Number of placements to be skipped.
 * @property {number} req.query.limit - Limit number of placements to be returned.
 * @returns {Placement[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  if (!req.query.venue_id || venues.indexOf(req.query.venue_id) === -1) {
    req.query.venue_id = { $in: venues }; // eslint-disable-line
  }

  // Populate models if query string is true and the request type is get
  req.query.populate = req.query.populate === 'true' && req.method === 'GET'; // eslint-disable-line

  Placement.list(req.query).then((placements) =>	res.json(placements))
    .error((e) => next(e));
}

/**
 * Delete placement.
 * @returns {Placement}
 */
function remove(req, res, next) {
  const placement = req.placement;

  placement.removeAsync()
    .then((deletedPlacement) => res.json(deletedPlacement))
    .error((e) => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
