import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import areaCtrl from '../../controllers/area';

// express-validation array of object BUG https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();	// eslint-disable-line new-cap

/** GET /areas - Returns associated areas for the user */
router.route('/')
  .get(areaCtrl.list)
  /** POST /areas - Creates a new area */
  .post(validate(paramValidation.create), auth.authorize('manager'), areaCtrl.create)
  /** PUT /areas - Creates a new area */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('manager'), areaCtrl.bulkUpdate);

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
