import express from 'express';
import validate from 'express-validation';
import auth from '../../helpers/auth';
import paramValidation from './param-validation';
import supplierCtrl from '../../controllers/supplier';

const router = express.Router();  // eslint-disable-line new-cap

router.route('/')
  /** GET /suppliers - Returns all suppliers */
  .get(supplierCtrl.list)
  /** POST /suppliers - Creates a new supplier */
  .post(validate(paramValidation.create), auth.authorize('manager'), supplierCtrl.create);

router.route('/:supplier_id')
  /** GET /suppliers/:supplier_id - Returns an supplier */
  .get(supplierCtrl.get)
  /** PUT /suppliers/:supplier_id - Updates an supplier */
  .put(validate(paramValidation.update), auth.authorize('manager'), supplierCtrl.update)
  /** DELETE /suppliers/:supplier_id - Removes an supplier */
  .delete(auth.authorize('manager'), supplierCtrl.remove);

// Load resource to req object -> req.supplier
router.param('supplier_id', supplierCtrl.load);

export default router;
