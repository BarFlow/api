import httpStatus from 'http-status';
import Section from '../models/section';
import patchModel from '../helpers/patchModel';

/**
 * Load section and append to req.
 */
function load(req, res, next, id) {
  Section.get(id).then((section) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = section.venue_id; // eslint-disable-line no-param-reassign
    req.section = section; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get section
 * @returns {Section}
 */
function get(req, res) {
  return res.json(req.section);
}

/**
 * Create new section
 * @property {string} req.body.name - The name of section.
 * @property {string} req.body.order - The order of section.
 * @returns {Section}
 */
function create(req, res, next) {
  const section = new Section({
    name: req.body.name,
    order: req.body.order || 0,
    venue_id: req.body.venue_id,
    area_id: req.body.area_id
  });

  section.saveAsync()
    .then((savedSection) => res.status(httpStatus.CREATED).json(savedSection))
    .error((e) => next(e));
}

/**
 * Update existing section
 * @property {string} req.body.name - The name of section.
 * @property {string} req.body.order - The order of section.
 * @returns {Section}
 */
function update(req, res, next) {
  const section = req.section;

  // White listed params
  const whiteList = {
    name: req.body.name,
    order: req.body.order
  };

  patchModel(section, Section, whiteList);

  section.saveAsync()
    .then((savedSection) => res.json(savedSection))
    .error((e) => next(e));
}

/**
 * Bulk update sections
 * @property {array} req.body - An array of section objects to be updated.
 * @returns {Section}
 */
function bulkUpdate(req, res, next) {
  const sections = req.body.map(section => { // eslint-disable-line
    // Black listed params
    delete section.__v; // eslint-disable-line
    delete section.created_at; // eslint-disable-line

    return section;
  });
  Section.bulkUpdate(sections).then(() =>	res.status(httpStatus.ACCEPTED).send())
    .error((e) => next(e));
}

/**
 * Get section list.
 * @property {number} req.query.skip - Number of sections to be skipped.
 * @property {number} req.query.limit - Limit number of sections to be returned.
 * @returns {Section[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  if (!req.query.venue_id || venues.indexOf(req.query.venue_id) === -1) {
    req.query.venue_id = { $in: venues }; // eslint-disable-line
  }

  Section.list(req.query).then((sections) =>	res.json(sections))
    .error((e) => next(e));
}

/**
 * Delete section.
 * @returns {Section}
 */
function remove(req, res, next) {
  const section = req.section;

  section.removeAsync()
    .then((deletedSection) => res.json(deletedSection))
    .error((e) => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
