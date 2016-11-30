import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import typeCtrl from '../../controllers/type';

// BUG: express-validation array of object https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /types - Returns types associated with the user */
  .get(typeCtrl.list)
  /** POST /types - Creates a new type */
  .post(validate(paramValidation.create), auth.authorize('admin'), typeCtrl.create)
  /** PUT /types - Batch update types */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('admin'), typeCtrl.bulkUpdate);

router.route('/:type_id')
  /** GET /types/:type_id - Returns an type */
  .get(typeCtrl.get)
  /** PUT /types/:type_id - Updates an type */
  .put(validate(paramValidation.update), auth.authorize('admin'), typeCtrl.update)
  /** DELETE /types/:type_id - Removes an type */
  .delete(auth.authorize('admin'), typeCtrl.remove);

// Load resource to req object -> req.type
router.param('type_id', typeCtrl.load);

export default router;
