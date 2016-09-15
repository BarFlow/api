import expressJwt from 'express-jwt';
import config from '../../config/env';

export default expressJwt({ secret: config.jwtSecret });
