import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import productCtrl from '../../controllers/product';

const router = express.Router();	// eslint-disable-line new-cap

router.route('/')
  /** GET /products - Returns all products */
  .get(productCtrl.list)
  /** POST /products - Creates a new product */
  .post(validate(paramValidation.create), auth.authorize('manager'), productCtrl.create);

router.route('/:product_id')
  /** GET /products/:product_id - Returns an product */
  .get(productCtrl.get)
  /** PUT /products/:product_id - Updates an product */
  .put(validate(paramValidation.update), auth.authorize('manager'), productCtrl.update)
  /** DELETE /products/:product_id - Removes an product */
  .delete(auth.authorize('owner'), productCtrl.remove);

// Load resource to req object -> req.product
router.param('product_id', productCtrl.load);

export default router;
