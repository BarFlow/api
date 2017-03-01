import express from 'express';
import validate from 'express-validation';
import paramValidation from './param-validation';
import authCtrl from '../../controllers/auth';
import auth from '../../helpers/auth';

const router = express.Router();  // eslint-disable-line new-cap

/** POST /auth/signup - Registering a new user */
router.route('/signup')
  .post(validate(paramValidation.signup), authCtrl.signup);

/** POST /auth/login - Returns token if a matching email and password is found */
router.route('/login')
  .post(validate(paramValidation.login), authCtrl.login);

/** POST /auth/refreshToken - Returns new token */
router.route('/refreshToken')
  .get(auth.authenticate, authCtrl.refreshToken);

/** POST /auth/refreshToken - Returns new token */
router.route('/me')
  .get(auth.authenticate, authCtrl.getSelf)
  .put(validate(paramValidation.update), auth.authenticate, authCtrl.updateSelf)
  .delete(auth.authenticate, authCtrl.deleteSelf);

export default router;
