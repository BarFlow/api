import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Area Schema
 */
const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Venue'
  },
  order: {
    type: Number,
    required: true
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
 *  Set updated_at
*/
AreaSchema.pre('save', function AreaModelPreSave(next) {
  const area = this;

  area.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
AreaSchema.methods.toJSON = function AreaModelRemoveHash() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    name: obj.name,
    order: obj.order,
    venue_id: obj.venue_id
  };
};

/**
 * Statics
 */
AreaSchema.statics = {
  /**
   * Get area
   * @param {ObjectId} id - The objectId of area.
   * @returns {Promise<Area, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((area) => {
        if (area) {
          return area;
        }
        const err = new APIError('No such area exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List areas associated with the current user, in descending order of 'created_at' timestamp.
   * @param {number} skip - Number of areas to be skipped.
   * @param {number} limit - Limit number of areas to be returned.
   * @returns {Promise<Area[]>}
   */
  list(filters) {
    return this.find()
    .where(filters)
    .sort({ created_at: -1 })
    .execAsync();
  }

};

/**
 * @typedef Area
 */
export default mongoose.model('Area', AreaSchema);
