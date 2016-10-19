import httpStatus from 'http-status';
import Type from '../models/type';
import patchModel from '../helpers/patchModel';

/**
 * Load type and append to req.
 */
function load(req, res, next, id) {
  Type.get(id).then((type) => {
    req.type = type; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get type
 * @returns {Type}
 */
function get(req, res) {
  return res.json(req.type);
}

/**
 * Create new type
 * @property {string} req.body.name - The name of type.
 * @property {string} req.body.order - The order of type.
 * @returns {Type}
 */
function create(req, res, next) {
  const type = new Type(req.body);

  type.saveAsync()
    .then((savedType) => res.status(httpStatus.CREATED).json(savedType))
    .error((e) => next(e));
}

/**
 * Update existing type
 * @property {string} req.body.name - The name of type.
 * @property {string} req.body.order - The order of type.
 * @returns {Type}
 */
function update(req, res, next) {
  const type = req.type;

  patchModel(type, Type, req.body);

  type.saveAsync()
    .then((savedType) => res.json(savedType))
    .error((e) => next(e));
}

/**
 * Bulk update types
 * @property {array} req.body - An array of type objects to be updated.
 * @returns {Type}
 */
function bulkUpdate(req, res, next) {
  const types = req.body;

  Type.bulkUpdate(types).then(() =>	res.status(httpStatus.ACCEPTED).send())
    .error((e) => next(e));
}

/**
 * Get type list.
 * @property {number} req.query.skip - Number of types to be skipped.
 * @property {number} req.query.limit - Limit number of types to be returned.
 * @returns {Type[]}
 */
function list(req, res, next) {
  // If parent_id is falsy set it to null, so we only get top level elements
  if (req.query.parent_id === '' || req.query.parent_id === 'null') req.query.parent_id = null; // eslint-disable-line

  Type.list(req.query).then((types) =>	res.json(types.map(type => {
    const typeJson = type.toJSON();
    const capitalizedTitle = typeJson.title.charAt(0).toUpperCase() + typeJson.title.slice(1);
    typeJson.images = typeJson.images || {
      thumbnail: `http://placehold.it/150x150/6D6D72/fff?text=${capitalizedTitle}`,
      normal: `http://placehold.it/455x855/6D6D72/fff?text=${capitalizedTitle}`
    };
    typeJson.measurable_from = typeJson.measurable_from || 0.1;
    typeJson.measurable_till = typeJson.measurable_till || 0.8;
    return typeJson;
  })))
    .error((e) => next(e));
}

/**
 * Delete type.
 * @returns {Type}
 */
function remove(req, res, next) {
  const type = req.type;

  type.removeAsync()
    .then((deletedType) => res.json(deletedType))
    .error((e) => next(e));
}

export default { load, get, create, update, bulkUpdate, list, remove };
