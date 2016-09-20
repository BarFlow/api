import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Type Schema
 */
const TypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  images: {
    thumbnail: String,
    normal: String,
    original: String
  },
  measurable_from: Number,
  measurable_till: Number,
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Type'
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
TypeSchema.pre('save', function TypeModelPreSave(next) {
  const type = this;

  type.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
TypeSchema.methods.toJSON = function TypeModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.created_at;
  delete obj.updated_at;

  return obj;
};

/**
 * Statics
 */
TypeSchema.statics = {
  /**
   * Get type
   * @param {ObjectId} id - The objectId of type.
   * @returns {Promise<Type, APIError>}
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
   * @returns {Promise<Type[]>}
   */
  list(filters) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 0;
    delete filters.limit; // eslint-disable-line
    return this.find()
    .where(filters)
    .sort({ created_at: 1 })
    .skip(skip)
    .limit(limit)
    .execAsync();
  },

  /**
   * Bulk update types.
   * @param {array<Type>} types - List of arrea object to be updated.
   * @returns {Promise<Response, APIError>}
   */
  bulkUpdate(types) {
    return new Promise((resolve, reject) => {
      const bulk = this.collection.initializeOrderedBulkOp();

      for (let i = 0; i < types.length; i++) {
        // Model id is only used as filter, not to be updated
        const id = types[i]._id;
        delete types[i]._id; // eslint-disable-line

        // Set current time for updated_at
        types[i].updated_at = new Date(); // eslint-disable-line

        bulk.find({
          _id: mongoose.Types.ObjectId(id) // eslint-disable-line
        }).updateOne({
          $set: types[i]
        });
      }
      bulk.execute((err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }

};

/**
 * @typedef Type
 */
export default mongoose.model('Type', TypeSchema);
