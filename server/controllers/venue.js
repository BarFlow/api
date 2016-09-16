import httpStatus from 'http-status';
import Venue from '../models/venue';
import patchModel from '../helpers/patchModel';

/**
 * Load venue and append to req.
 */
function load(req, res, next, id) {
  // !!! This is used by auth.authorize this MUST be set for any resource
  req.venueId = id; // eslint-disable-line no-param-reassign

  Venue.get(id).then((venue) => {
    req.venue = venue; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get venue
 * @returns {Venue}
 */
function get(req, res) {
  return res.json(req.venue);
}

/**
 * Create new venue
 * @property {string} req.body.venuename - The venuename of venue.
 * @property {string} req.body.mobileNumber - The mobileNumber of venue.
 * @returns {Venue}
 */
function create(req, res, next) {
  const venue = new Venue({
    profile: req.body.profile,
    members: [{
      user_id: req.user._id,
      type: 'owner'
    }]
  });

  venue.saveAsync()
    .then((savedVenue) => res.status(httpStatus.CREATED).json(savedVenue))
    .error((e) => next(e));
}

/**
 * Update existing venue
 * @property {string} req.body.venuename - The venuename of venue.
 * @property {string} req.body.mobileNumber - The mobileNumber of venue.
 * @returns {Venue}
 */
function update(req, res, next) {
  const venue = req.venue;

  const whiteList = {
    profile: req.body.profile
  };

  patchModel(venue, Venue, whiteList);

  venue.saveAsync()
    .then((savedVenue) => res.json(savedVenue))
    .error((e) => next(e));
}

/**
 * Get venue list.
 * @property {number} req.query.skip - Number of venues to be skipped.
 * @property {number} req.query.limit - Limit number of venues to be returned.
 * @returns {Venue[]}
 */
function list(req, res, next) {
  Venue.list(req.user._id).then((venues) =>	res.json(venues))
    .error((e) => next(e));
}

/**
 * Delete venue.
 * @returns {Venue}
 */
function remove(req, res, next) {
  const venue = req.venue;

  venue.removeAsync()
    .then((deletedVenue) => res.json(deletedVenue))
    .error((e) => next(e));
}

export default { load, get, create, update, list, remove };
