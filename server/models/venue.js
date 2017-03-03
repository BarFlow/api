import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Venue Schema
 */
const VenueSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: false
  },
  profile: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'The value of path {PATH} ({VALUE}) is not a valid email address.'] // eslint-disable-line
    },
    tel: String,
    address: String,
    type: {
      type: String,
      default: 'restaurant'
    },
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        index: { unique: true },
        required: true,
        ref: 'User'
      },
      role: {
        type: String,
        default: 'staff'
      },
      created_at: {
        type: Date,
        default: Date.now
      },
      updated_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  invited: [
    {
      email: {
        type: String,
        index: { unique: true },
        required: true,
      },
      role: {
        type: String,
        default: 'staff'
      },
      created_at: {
        type: Date,
        default: Date.now
      },
      updated_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

/**
 * Password hashing before save
 */
VenueSchema.pre('save', function VenueModelPreSave(next) {
  const venue = this;

  // Set updated_at
  venue.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
 // Check user relationship with the venue
VenueSchema.methods.getRole = function VenueModelGetRole(userId) {
  const venue = this;
  const me = venue.members.find(m => m.user._id.toString() === userId.toString());
  return !me ? false : me.role;
};

// Filter model metadata out of the response
VenueSchema.methods.toJSON = function VenueModelRemoveHash() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    active: obj.active,
    profile: obj.profile,
    members: obj.members,
    invited: obj.invited,
    role: obj.role
  };
};

/**
 * Statics
 */
VenueSchema.statics = {
  /**
   * Get venue
   * @param {ObjectId} id - The objectId of venue.
   * @returns {Promise<Venue, APIError>}
   */
  get(id) {
    return this.findById(id).populate('members.user', '_id name email')
      .execAsync().then((venue) => {
        if (venue) {
          return venue;
        }
        const err = new APIError('No such venue exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List venues associated with the current user, in descending order of 'created_at' timestamp.
   * @param {number} skip - Number of venues to be skipped.
   * @param {number} limit - Limit number of venues to be returned.
   * @returns {Promise<Venue[]>}
   */
  list(userId) {
    return this.find({ 'members.user': userId })
      .populate('members.user', '_id name email')
      .sort({ created_at: -1 })
      .execAsync()
      .then(venues => venues.map((venue) => {
        venue.role = venue.getRole(userId); // eslint-disable-line
        return venue;
      }));
  }

};

/**
 * @typedef Venue
 */
export default mongoose.model('Venue', VenueSchema);
