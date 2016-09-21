import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import User from '../models/user';
import Venue from '../models/venue';
import Promise from 'bluebird';

const config = require('../../config/env');

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
  // Find user by email adderss
  User.findOne({ email: req.body.email })
    .then(user => {
      // If user not found return error
      if (!user) return next(err);

      // Compare given password with the model
      return user.comparePassword(req.body.password)
        .then(match => {
          // If password dosen't match return error
          if (!match) return Promise.reject(err);

          // Get list of venues for user
          return Venue.list(user._id);
        })
        .then(venues => {
          // Pluck venue data
          const roles = venues.reduce((normalized, venue)  => { // eslint-disable-line
            normalized[venue.id] = venue.role; // eslint-disable-line
            return normalized;
          }, {});

          // Create JWT
          return jwt.sign({
            _id: user._id,
            admin: user.admin,
            roles: roles || {}
          }, config.jwtSecret, { expiresIn: '7d' });
        })
        .then((token) => {
          // Successful login, sending response back to client
          res.json({
            token,
            user
          });
        });
    })
    .catch((e) => next(e));
}

/**
 * Create new user
 * @property {string} req.body.name - The name of user.
 * @property {string} req.body.email - The email address of user.
 * @property {string} req.body.password - The password of user.
 * @returns {User}
 */
function signup(req, res, next) {
  // Creating new model instance
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  // Save user to database
  user.saveAsync()
    .then((savedUser) => {
      // Succesfully saved, creating token
      const token = jwt.sign({
        _id: user._id,
        email: user.email,
        admin: user.admin,
        roles: {}
      }, config.jwtSecret, { expiresIn: '7d' });

      // Composing response object
      return {
        user: savedUser,
        token
      };
    })
    // Sending response back to client
    .then((savedUser) => res.status(httpStatus.CREATED).json(savedUser))
    // If any error happens forward it to middleware
    .error((e) => next(e));
}

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function refreshToken(req, res, next) {
  const user = req.user;
  let payload = {};
  // Get list of venues for user
  Venue.list(user._id)
    .then(venues => {
      // Pluck venue data
      const roles = venues.reduce((normalized, venue)  => { // eslint-disable-line
        normalized[venue.id] = venue.role; // eslint-disable-line
        return normalized;
      }, {});

      payload = {
        _id: user._id,
        admin: user.admin,
        roles: roles || {}
      };

      // Create JWT
      return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    })
    .then((token) => {
      // Successful login, sending response back to client
      res.json({
        token,
        payload
      });
    })
    .catch((e) => next(e));
}

export default { login, signup, refreshToken };
