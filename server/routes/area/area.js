import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import areaCtrl from '../../controllers/area';

// BUG: express-validation array of object https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /areas - Returns areas associated with the user */
  .get(auth.authorize('staff'), areaCtrl.list)
  /** POST /areas - Creates a new area */
  .post(validate(paramValidation.create), auth.authorize('manager'), areaCtrl.create)
  /** PUT /areas - Batch update areas */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('manager'), areaCtrl.bulkUpdate);

router.route('/:area_id')
  /** GET /areas/:area_id - Returns an area */
  .get(auth.authorize('staff'), areaCtrl.get)
  /** PUT /areas/:area_id - Updates an area */
  .put(validate(paramValidation.update), auth.authorize('manager'), areaCtrl.update)
  /** DELETE /areas/:area_id - Removes an area */
  .delete(auth.authorize('manager'), areaCtrl.remove);

// Load resource to req object -> req.area
router.param('area_id', areaCtrl.load);

export default router;
