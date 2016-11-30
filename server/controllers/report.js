import httpStatus from 'http-status';
import Report from '../models/report';
import Placement from '../models/placement';
import patchModel from '../helpers/patchModel';

/**
 * Load report and append to req.
 */
function load(req, res, next, id) {
  if (id === 'live') {
    return next();
  }
  Report.get(id).then((report) => {
    // !!! This is used by auth.authorize this MUST be set for any resource
    req.venueId = report.venue_id; // eslint-disable-line no-param-reassign
    req.report = report; // eslint-disable-line no-param-reassign
    return next();
  }).error((e) => next(e));
}

/**
 * Get report
 * @returns {Report}
 */
function get(req, res) {
  const venues = Object.keys(req.user.roles);
  const whiteList = req.query.venue_id ? { venue_id: req.query.venue_id } : { venue_id : { $in: venues }}; // eslint-disable-line
  if (req.params.report_id === 'live') {
    return generateReport(whiteList).then(report => res.json(report));
  }
  return res.json(req.report);
}

function generateReport(filters) {
  return Placement.find(filters)
  .populate({
    path: 'section_id area_id',
    select: 'name'
  })
  .populate({
    path: 'inventory_item_id',
    select: '-__v -updated_at -created_at',
    populate: {
      path: 'product_id',
      select: '-__v -updated_at -created_at',
    }
  })
  .execAsync()
  .then(results =>
    results.filter(item => item.inventory_item_id && item.area_id && item.section_id)
    .reduce((mem, item) => {
      item = item.toObject(); //eslint-disable-line
      if (!mem[item.inventory_item_id._id]) {
        mem[item.inventory_item_id._id] = item.inventory_item_id; // eslint-disable-line
        mem[item.inventory_item_id._id].areas = {}; // eslint-disable-line
        mem[item.inventory_item_id._id].volume = 0; // eslint-disable-line
      }
      if (!mem[item.inventory_item_id._id].areas[item.area_id._id]) {
        mem[item.inventory_item_id._id].areas[item.area_id._id] = item.area_id; //eslint-disable-line
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections = {}; //eslint-disable-line
        mem[item.inventory_item_id._id].areas[item.area_id._id].volume = 0; //eslint-disable-line
      }
      if (!mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id]) {
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id] = item.section_id; //eslint-disable-line
        mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id].volume = 0; //eslint-disable-line
      }

      mem[item.inventory_item_id._id].volume += item.volume; //eslint-disable-line
      mem[item.inventory_item_id._id].areas[item.area_id._id].volume += item.volume; //eslint-disable-line
      mem[item.inventory_item_id._id].areas[item.area_id._id].sections[item.section_id._id].volume += item.volume; //eslint-disable-line
      return mem;
    }, {})
  )
  .then(results => {
    const report = Object.keys(results).map(itemId => {
      results[itemId].areas = Object.keys(results[itemId].areas).map(areaId => { //eslint-disable-line
        results[itemId].areas[areaId].sections = Object.keys(results[itemId].areas[areaId].sections) //eslint-disable-line
        .map(sectionId =>
          results[itemId].areas[areaId].sections[sectionId]
        );
        return results[itemId].areas[areaId];
      });
      return results[itemId];
    });
    return report;
  });
}

/**
 * Create new report
 * @property {string} req.body.name - The name of report.
 * @property {string} req.body.order - The order of report.
 * @returns {Report}
 */
function create(req, res, next) {
  generateReport({ venue_id: req.body.venue_id }).then(reportData => {
    const report = new Report({
      venue_id: req.body.venue_id,
      data: reportData
    });

    report.saveAsync()
    .then((savedReport) => res.status(httpStatus.CREATED).json(savedReport))
    .error((e) => next(e));
  });
}

/**
 * Update existing report
 * @property {string} req.body.name - The name of report.
 * @property {string} req.body.order - The order of report.
 * @returns {Report}
 */
function update(req, res, next) {
  const report = req.report;

  // Blacklist params
  delete req.body._id; // eslint-disable-line
  delete req.body.venue_id; // eslint-disable-line
  delete req.body.created_at; // eslint-disable-line

  // Let admins approve a report to make it available to all users
  if (!req.user.admin) delete req.body.approved; // eslint-disable-line

  patchModel(report, Report, req.body);

  report.saveAsync()
    .then((savedReport) => res.json(savedReport))
    .error((e) => next(e));
}

/**
 * Get report list.
 * @property {number} req.query.skip - Number of reports to be skipped.
 * @property {number} req.query.limit - Limit number of reports to be returned.
 * @returns {Report[]}
 */
function list(req, res, next) {
  const venues = Object.keys(req.user.roles);
  const whiteList = { venue_id : { $in: venues }}; // eslint-disable-line

  Report.list(req.query, whiteList)
    .then((results) =>	res.json(results))
    .error((e) => next(e));
}

/**
 * Delete report.
 * @returns {Report}
 */
function remove(req, res, next) {
  const report = req.report;

  report.removeAsync()
    .then((deletedReport) => res.json(deletedReport))
    .error((e) => next(e));
}

export default { load, get, create, update, list, remove };
