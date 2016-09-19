import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import inventoryCtrl from '../../controllers/inventory';

// BUG: express-validation array of object https://github.com/AndrewKeig/express-validation/issues/36#event-751224940
validate.options({ contextRequest: true });

const router = express.Router();	// eslint-disable-line new-cap

router.route('/')
  /** GET /inventory - Returns inventory items associated with the user */
  .get(inventoryCtrl.list)
  /** POST /inventory - Creates a new inventory */
  .post(validate(paramValidation.create), auth.authorize('manager'), inventoryCtrl.create)
  /** PUT /inventory - Batch update inventory */
  .put(validate(paramValidation.bulkUpdate), auth.authorize('manager'), inventoryCtrl.bulkUpdate);

router.route('/:inventory_item_id')
  /** GET /inventory/:inventory_item_id - Returns an inventory item */
  .get(auth.authorize('staff'), inventoryCtrl.get)
  /** PUT /inventory/:inventory_item_id - Updates an inventory item */
  .put(validate(paramValidation.update), auth.authorize('manager'), inventoryCtrl.update)
  /** DELETE /inventory/:inventory_item_id - Removes an inventory item */
  .delete(auth.authorize('manager'), inventoryCtrl.remove);

// Load resource to req object -> req.inventory
router.param('inventory_item_id', inventoryCtrl.load);

export default router;
