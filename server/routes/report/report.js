import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import reportCtrl from '../../controllers/report';

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /reports - Returns all reports */
  .get(reportCtrl.list)
  /** POST /reports - Creates a new report */
  .post(validate(paramValidation.create), auth.authorize('manager'), reportCtrl.create);

router.route('/:report_id')
  /** GET /reports/:report_id - Returns an report */
  .get(reportCtrl.get)
  /** PUT /reports/:report_id - Updates an report */
  // .put(auth.authorize('manager'), reportCtrl.update)
  /** DELETE /reports/:report_id - Removes an report */
  .delete(auth.authorize('manager'), reportCtrl.remove);

router.route('/:report_id/export')
  /** GET /reports/:report_id - Returns an report */
  .get(reportCtrl.getExport);

// Load resource to req object -> req.report
router.param('report_id', reportCtrl.load);

export default router;
