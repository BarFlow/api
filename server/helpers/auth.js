import expressJwt from 'express-jwt';
import httpStatus from 'http-status';
import APIError from './APIError';
import config from '../../config/env';

const authenticate = expressJwt({
  secret: config.jwtSecret,
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

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

const authorize = role =>
  (req, res, next) => {
    // Set error message based on method
    const err = new APIError(
      `Method: ${req.method} is forbidden for this resource`,
      httpStatus.FORBIDDEN, true);

    // Let admins do their job
    if (req.user.admin) return next();

    // Endpoint is only for admins
    if (role === 'admin' && !req.user.admin) return next(err);

    // Sore venue ids that needs to be validated against user token
    const venueIds = [];

    // Get all possible venue ids from a request
    // venue_id from Request body
    if (Array.isArray(req.body)) {
      req.body.forEach((obj) => {
        if (obj.venue_id) {
          venueIds.push(obj.venue_id);
        }
      });
    } else if (req.body.venue_id) {
      venueIds.push(req.body.venue_id);
    }
    // venue_id from url param
    if (req.params.venue_id) {
      venueIds.push(req.params.venue_id);
    }
    // venue_id from query string
    if (req.query.venue_id) {
      venueIds.push(req.query.venue_id);
    }
    // venue_id from loaded resource is
    if (req.venueId) {
      venueIds.push(req.venueId);
    }

    venueIds.forEach((id) => {
      // Return error if current user not a member of the venue
      if (!req.user.roles || !req.user.roles[id]) return next(err);

      // Translate roles to numbers
      const minAuthority = getAuthorityLevel(role);
      const userAuthority = getAuthorityLevel(req.user.roles[id]);

      // If user authority level is too low return error
      if (userAuthority < minAuthority) return next(err);
    });

    // All is well, let's keep movin'
    next();
  };

export default { authenticate, authorize };
