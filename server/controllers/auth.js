import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import Promise from 'bluebird';
import APIError from '../helpers/APIError';
import User from '../models/user';
import Venue from '../models/venue';
import Lead from '../models/lead';
import sendEmail from '../helpers/email';

const config = require('../../config/env');

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  const err = new APIError('Authentication error: wrong email address or password.', httpStatus.UNAUTHORIZED, true);
  // Find user by email adderss
  User.findOne({ email: req.body.email })
    .then((user) => {
      // If user not found return error
      if (!user) return next(err);

      // Compare given password with the model
      return user.comparePassword(req.body.password)
        .then((match) => {
          // If password dosen't match return error
          if (!match) return Promise.reject(err);

          // Save lead
          if (req.body.lead) {
            Lead.create({
              email: req.body.lead,
              source: 'app'
            });
          }

          // Get list of venues for user
          return Venue.list(user._id);
        })
        .then((venues) => {
          // Pluck venue data
          const roles = venues.reduce((normalized, venue)  => { // eslint-disable-line
            normalized[venue.id] = venue.role; // eslint-disable-line
            return normalized;
          }, {});

          // Create JWT
          return jwt.sign({
            _id: user._id,
            admin: user.admin,
            confirmed: user.confirmed,
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
    .catch(e => next(e));
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

  const roles = {};

  // Save user to database
  user.saveAsync()
    .then(savedUser =>
      Venue.find({ invited: { $elemMatch: { email: user.email } } })
        .then(venues =>
          Promise.all(venues.map((venue) => {
            // Add invited user to members
            const invited = venue.invited.find(item => item.email === user.email).toObject();
            invited.user = savedUser._id;
            invited.updated_at = new Date();
            venue.members.push(invited);
            roles[venue._id] = invited.role;
            // Removing user from array
            venue.invited = venue.invited.filter(item => item.email !== user.email);

            return venue.saveAsync();
          }))
        )
        .then(() => savedUser)
    )
    .then((savedUser) => {
      // Succesfully saved, creating token
      const token = jwt.sign({
        _id: user._id,
        admin: user.admin,
        confirmed: user.confirmed,
        roles
      }, config.jwtSecret, { expiresIn: '7d' });

      // User confirm email
      sendEmail(user.email, 'Welcome to BarFlow!', 'user-signup', { name: user.name.split(' ')[0] });

      // Admin notif
      sendEmail(
        'sales@barflow.io',
        'New user registration',
        'admin-user-signup',
        {
          user,
          invited: Object.keys(roles).length ? 'true' : 'false'
        });

      // Composing response object
      return {
        user: savedUser,
        token
      };
    })
    // Sending response back to client
    .then(savedUser => res.status(httpStatus.CREATED).json(savedUser))
    // If any error happens forward it to middleware
    .error((e) => {
      if (e.code === 11000) {
        return next(new APIError('The e-mail address you entered is already registered.', httpStatus.BAD_REQUEST, true));
      }
      next(e);
    });
}

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function refreshToken(req, res, next) {
  let payload = {};
  // Get list of venues for user
  User.findById(req.user._id).execAsync()
  .then(user =>
    Venue.list(user._id)
      .then((venues) => {
        // Pluck venue data
        const roles = venues.reduce((normalized, venue)  => { // eslint-disable-line
          normalized[venue.id] = venue.role; // eslint-disable-line
          return normalized;
        }, {});

        payload = {
          _id: user._id,
          admin: user.admin,
          confirmed: user.confirmed,
          roles: roles || {}
        };

        // Create JWT
        return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
      })
    )
    .then((token) => {
      // Successful login, sending response back to client
      res.json({
        token,
        payload
      });
    })
    .catch(e => next(e));
}

function getSelf(req, res, next) {
  User.findById(req.user._id).execAsync()
    .then((user) => {
      delete user.password;
      return res.json(user);
    })
    .catch(e => next(e));
}

function updateSelf(req, res, next) {
  User.findById(req.user._id).execAsync()
    .then(user => user.comparePassword(req.body.current_password)
    .then((match) => {
      // Wrong password is given
      if (!match) {
        return Promise.reject(new APIError('Invalid current password.', httpStatus.BAD_REQUEST, true));
      }

      // All is well update user data
      if (req.body.name) {
        user.name = req.body.name;
      }
      if (req.body.email) {
        user.email = req.body.email;
      }
      if (req.body.password) {
        user.password = req.body.password;
      }

      return user.save();
    }))
    .then(user => res.json(user))
    .catch(e => next(e));
}

function deleteSelf(req, res, next) {
  User.findByIdAndRemove(req.user._id).execAsync()
    .then(() => {
      res.json(req.user);
      next();
    })
    .catch(e => next(e));
}

export default { login, signup, refreshToken, getSelf, updateSelf, deleteSelf };
