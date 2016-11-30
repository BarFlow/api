import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import placementCtrl from '../../controllers/placement';

// BUG: express-validation array of object https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /placements - Returns placements associated with the user */
  .get(placementCtrl.list)
  /** POST /placements - Creates a new placement */
  .post(validate(paramValidation.create), auth.authorize('manager'), placementCtrl.create)
  /** PUT /placements - Batch update placements */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('staff'), placementCtrl.bulkUpdate);

router.route('/:placement_id')
  /** GET /placements/:placement_id - Returns an placement */
  .get(auth.authorize('staff'), placementCtrl.get)
  /** PUT /placements/:placement_id - Updates an placement */
  .put(validate(paramValidation.update), auth.authorize('staff'), placementCtrl.update)
  /** DELETE /placements/:placement_id - Removes an placement */
  .delete(auth.authorize('manager'), placementCtrl.remove);

// Load resource to req object -> req.placement
router.param('placement_id', placementCtrl.load);

export default router;
