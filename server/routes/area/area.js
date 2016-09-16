import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import areaCtrl from '../../controllers/area';

const router = express.Router();	// eslint-disable-line new-cap

/** POST /areas - Creates a new area */
router.route('/')
  .post(validate(paramValidation.create), auth.authorize('manager'), areaCtrl.create);

/** GET /areas - Returns associated areas for the user */
router.route('/')
  .get(areaCtrl.list);

router.route('/:area_id')
  /** GET /areas/:area_id - Returns a area */
  .get(auth.authorize('staff'), areaCtrl.get)
  /** PUT /areas/:area_id - Updates a area */
  .put(validate(paramValidation.update), auth.authorize('manager'), areaCtrl.update)
  /** DELETE /areas/:area_id - Removes a area */
  .delete(auth.authorize('owner'), areaCtrl.remove);

// ensure access role for resource
router.param('area_id', areaCtrl.load);

export default router;
