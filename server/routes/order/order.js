import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import orderCtrl from '../../controllers/order';

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /orders - Returns all orders */
  .get(auth.authorize('staff'), orderCtrl.list)
  /** POST /orders - Creates a new order */
  .post(validate(paramValidation.create), auth.authorize('manager'), orderCtrl.create);

router.route('/:order_id')
  /** GET /orders/:order_id - Returns an order */
  .get(auth.authorize('staff'), orderCtrl.get)
  /** PUT /orders/:order_id - Updates an order */
  .put(validate(paramValidation.update), auth.authorize('manager'), orderCtrl.update)
  /** DELETE /orders/:order_id - Removes an order */
  .delete(auth.authorize('manager'), orderCtrl.remove);

router.route('/:order_id/export')
  /** GET /orders/:order_id - Returns an order */
  .get(auth.authorize('staff'), orderCtrl.getExport);

// Load resource to req object -> req.order
router.param('order_id', orderCtrl.load);

export default router;
