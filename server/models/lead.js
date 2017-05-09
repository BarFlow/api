import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Lead Schema
 */
const LeadSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    index: { unique: true }
  },
  company: {
    type: String
  },
  phone: {
    type: String
  },
  meta: {
    type: Object
  },
  status: {
    type: String // not contacted, pending, interested, not interested
  },
  source: String,
  comment: String,
  owner: String,
  followup: Date,
  hidden: {
    type: Boolean,
    default: false
  },
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
 *  Set updated_at before model gets saved.
*/
LeadSchema.pre('save', function LeadModelPreSave(next) {
  const type = this;

  type.updated_at = new Date();

  return next();
});

/**
 * Statics
 */
LeadSchema.statics = {
  /**
   * Get type
   * @param {ObjectId} id - The objectId of type.
   * @returns {Promise<Lead, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((type) => {
        if (type) {
          return type;
        }
        const err = new APIError('No such type exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List types associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of types to be skipped.
   * @param {number} limit - Limit number of types to be returned.
   * @returns {Promise<Lead[]>}
   */
  list(filters) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 30;
    delete filters.limit; // eslint-disable-line
    filters.hidden = { $ne: !filters.hidden };

    if (filters.due || filters.due !== undefined) {
      filters.followup = { $lte: new Date() };
      delete filters.due;
    }

    if (filters.name) {
      filters.name = new RegExp(filters.name, 'i');
    }

    if (filters.email) {
      filters.email = new RegExp(filters.email, 'i');
    }

    if (filters.company) {
      filters.company = new RegExp(filters.company, 'i');
    }

    if (filters.comment) {
      filters.comment = new RegExp(filters.comment, 'i');
    }

    return this.find(filters)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .execAsync();
  }

};

/**
 * @typedef Lead
 */
export default mongoose.model('Lead', LeadSchema);
