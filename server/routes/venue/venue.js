import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import venueCtrl from '../../controllers/venue';
import placementCtrl from '../../controllers/placement';
import reportCtrl from '../../controllers/report';

const router = express.Router();  // eslint-disable-line new-cap

/** POST /venues - Creates a new venue */
router.route('/')
  .post(validate(paramValidation.create), venueCtrl.create);

/** GET /venues - Returns associated venues for the user */
router.route('/')
  .get(auth.authorize('staff'), venueCtrl.list);

router.route('/:venue_id')
  /** GET /venues/:venue_id - Returns a venue */
  .get(auth.authorize('staff'), venueCtrl.get)
  /** PUT /venues/:venue_id - Updates a venue */
  .put(validate(paramValidation.update), auth.authorize('owner'), venueCtrl.update)
  /** DELETE /venues/:venue_id - Removes a venue */
  .delete(auth.authorize('owner'), venueCtrl.remove);

/** POST /venues/members - Creates a new member for venue */
router.route('/:venue_id/members')
  .post(validate(paramValidation.addMember), auth.authorize('owner'), venueCtrl.addMember);

/** POST /venues - Removes member from venue */
router.route('/:venue_id/members/:member_id')
  .put(validate(paramValidation.updateMember), auth.authorize('owner'), venueCtrl.updateMember)
  .delete(auth.authorize('owner'), venueCtrl.removeMember);

/** POST /venues.reports - Saves stock report for venue */
router.route('/:venue_id/reports')
  .post(auth.authorize('manager'), (req, res, next) => {
    req.body.venue_id = req.venueId;
    next();
  }, reportCtrl.create);

/** POST /venues/reports/reset - Resets placement volumes to 0 */
router.route('/:venue_id/reports/reset')
  .post(auth.authorize('manager'), (req, res, next) => {
    req.body.venue_id = req.venueId;
    next();
  }, placementCtrl.resetPlacementVolumes);

// ensure access role for resource
router.param('venue_id', venueCtrl.load);

export default router;
