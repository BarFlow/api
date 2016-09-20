import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import sectionCtrl from '../../controllers/section';

// BUG: express-validation array of object https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();	// eslint-disable-line new-cap

router.route('/')
  /** GET /sections - Returns sections associated with the user */
  .get(sectionCtrl.list)
  /** POST /sections - Creates a new section */
  .post(validate(paramValidation.create), auth.authorize('manager'), sectionCtrl.create)
  /** PUT /sections - Batch update sections */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('manager'), sectionCtrl.bulkUpdate);

router.route('/:section_id')
  /** GET /sections/:section_id - Returns an section */
  .get(auth.authorize('staff'), sectionCtrl.get)
  /** PUT /sections/:section_id - Updates an section */
  .put(validate(paramValidation.update), auth.authorize('manager'), sectionCtrl.update)
  /** DELETE /sections/:section_id - Removes an section */
  .delete(auth.authorize('owner'), sectionCtrl.remove);

// Load resource to req object -> req.section
router.param('section_id', sectionCtrl.load);

export default router;
