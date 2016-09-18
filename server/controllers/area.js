import httpStatus from 'http-status';
import Area from '../models/area';
import patchModel from '../helpers/patchModel';

/**
 * Load area and append to req.
 */
function load(req, res, next, id) {
  Area.get(id).then((area) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = area.venue_id; // eslint-disable-line no-param-reassign
    req.area = area; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get area
 * @returns {Area}
 */
function get(req, res) {
  return res.json(req.area);
}

/**
 * Create new area
 * @property {string} req.body.name - The name of area.
 * @property {string} req.body.order - The order of area.
 * @returns {Area}
 */
function create(req, res, next) {
  const area = new Area({
    name: req.body.name,
    order: 0,
    venue_id: req.body.venue_id
  });

  area.saveAsync()
    .then((savedArea) => res.status(httpStatus.CREATED).json(savedArea))
    .error((e) => next(e));
}

/**
 * Update existing area
 * @property {string} req.body.name - The name of area.
 * @property {string} req.body.order - The order of area.
 * @returns {Area}
 */
function update(req, res, next) {
  const area = req.area;

  // White listed params
  const whiteList = {
    name: req.body.name,
    order: req.body.order
  };

  patchModel(area, Area, whiteList);

  area.saveAsync()
    .then((savedArea) => res.json(savedArea))
    .error((e) => next(e));
}

/**
 * Bulk update areas
 * @property {array} req.body - An array of area objects to be updated.
 * @returns {Area}
 */
function bulkUpdate(req, res, next) {
  const areas = req.body.map(area => { // eslint-disable-line
    // White listed params
    return {
      _id: area._id,
      order: area.order,
      name: area.name,
      venue_id: area.venue_id
    };
  });
  Area.bulkUpdate(areas).then(() =>	res.status(httpStatus.ACCEPTED).send())
    .error((e) => next(e));
}

/**
 * Get area list.
 * @property {number} req.query.skip - Number of areas to be skipped.
 * @property {number} req.query.limit - Limit number of areas to be returned.
 * @returns {Area[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  if (!req.query.venue_id || venues.indexOf(req.query.venue_id) === -1) {
    req.query.venue_id = { $in: venues }; // eslint-disable-line
  }

  Area.list(req.query).then((areas) =>	res.json(areas))
    .error((e) => next(e));
}

/**
 * Delete area.
 * @returns {Area}
 */
function remove(req, res, next) {
  const area = req.area;

  area.removeAsync()
    .then((deletedArea) => res.json(deletedArea))
    .error((e) => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
