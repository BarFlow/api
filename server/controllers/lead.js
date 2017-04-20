import httpStatus from 'http-status';
import Lead from '../models/lead';
import patchModel from '../helpers/patchModel';
import sendEmail from '../helpers/email';

/**
 * Load lead and append to req.
 */
function load(req, res, next, id) {
  Lead.get(id).then((lead) => {
    req.lead = lead; // eslint-disable-line no-param-reassign
    return next();
  }).error(e => next(e));
}

/**
 * Get lead
 * @returns {Lead}
 */
function get(req, res) {
  return res.json(req.lead);
}

/**
 * Create new lead
 * @property {string} req.body.name - The name of lead.
 * @property {string} req.body.order - The order of lead.
 * @returns {Lead}
 */
function create(req, res, next) {
  const lead = new Lead(req.body);

  // User confirm email
  if (!req.body.silent) {
    sendEmail('sales@barflow.io', 'New Lead', 'lead-created', req.body);
  }

  lead.saveAsync()
    .then(savedLead => res.status(httpStatus.CREATED).json(savedLead))
    .error(e => next(e));
}

/**
 * Update existing lead
 * @property {string} req.body.name - The name of lead.
 * @property {string} req.body.order - The order of lead.
 * @returns {Lead}
 */
function update(req, res, next) {
  const lead = req.lead;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  patchModel(lead, Lead, req.body);

  lead.saveAsync()
    .then(savedLead => res.json(savedLead))
    .error(e => next(e));
}

/**
 * Get lead list.
 * @property {number} req.query.skip - Number of leads to be skipped.
 * @property {number} req.query.limit - Limit number of leads to be returned.
 * @returns {Lead[]}
 */
function list(req, res, next) {
  Lead.list(req.query)
    .then(results => res.json(results))
    .error(e => next(e));
}

/**
 * Delete lead.
 * @returns {Lead}
 */
function remove(req, res, next) {
  const lead = req.lead;

  lead.removeAsync()
    .then(deletedLead => res.json(deletedLead))
    .error(e => next(e));
}

export default { load, get, create, update, list, remove };
