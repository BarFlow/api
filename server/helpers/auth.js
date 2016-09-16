import expressJwt from 'express-jwt';
import httpStatus from 'http-status';
import APIError from './APIError';
import config from '../../config/env';

const authenticate = expressJwt({ secret: config.jwtSecret });

const getAuthorityLevel = (role) => {
  let authority = 0;
  switch (role) {
    case 'staff':
      authority = 1;
      break;
    case 'manager':
      authority = 2;
      break;
    case 'owner':
      authority = 3;
      break;
    default:
      authority = 0;
  }
  return authority;
};

const authorize = (role) =>
  (req, res, next) => {
    // Let admins do their job
    if (req.user.admin) return next();

    // Set venue id based on request method
    if (req.method === 'POST') {
      req.venueId = req.body.venue_id; // eslint-disable-line
    }

    // Set error message based on method
    const err = new APIError(`Resource method: ${req.method} is forbidden`, httpStatus.FORBIDDEN);

    // Return error if current user not a member of the venue
    if (!req.user.roles || !req.user.roles[req.venueId]) return next(err);

    // Translate roles to numbers
    const minAuthority = getAuthorityLevel(role);
    const userAuthority = getAuthorityLevel(req.user.roles[req.venueId]);

    // If user authority level is too low return error
    if (userAuthority < minAuthority) return next(err);

    // All is well, let's keep movin'
    next();
  };

export default { authenticate, authorize };
