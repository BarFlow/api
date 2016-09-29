import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Placement from '../models/placement';
import patchModel from '../helpers/patchModel';

/**
 * Load placement and append to req.
 */
function load(req, res, next, id) {
  Placement.get(id, req.query.populate).then((placement) => {
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
  const placement = new Placement({
    venue_id: req.body.venue_id,
    area_id: req.body.area_id,
    section_id: req.body.section_id,
    inventory_item_id: req.body.inventory_item_id,
    volume: req.body.volume || 0,
    order: req.body.order || 0
  });

  placement.saveAsync()
    .then((savedPlacement) => res.status(httpStatus.CREATED).json(savedPlacement))
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
    order: req.body.order
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
