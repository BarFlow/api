import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import leadCtrl from '../../controllers/lead';

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /leads - Returns all leads */
  .get(auth.authenticate, auth.authorize('admin'), leadCtrl.list)
  /** POST /leads - Creates a new lead */
  .post(validate(paramValidation.create), leadCtrl.create);

router.route('/:lead_id')
  /** GET /leads/:lead_id - Returns an lead */
  .get(auth.authenticate, auth.authorize('admin'), leadCtrl.get)
  /** PUT /leads/:lead_id - Updates an lead */
  .put(validate(paramValidation.update), auth.authenticate, auth.authorize('admin'), leadCtrl.update)
  /** DELETE /leads/:lead_id - Removes an lead */
  .delete(auth.authenticate, auth.authorize('admin'), leadCtrl.remove);

// Load resource to req object -> req.lead
router.param('lead_id', leadCtrl.load);

export default router;
