import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Supplier Schema
 */
const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  tel: {
    type: String,
  },
  account_number: {
    type: String,
  },
  approved: {
    type: Boolean,
    default: false
  },
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Venue'
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
SupplierSchema.pre('save', function SupplierModelPreSave(next) {
  const supplier = this;

  supplier.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
SupplierSchema.methods.toJSON = function SupplierModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.approved;
  delete obj.created_at;
  delete obj.updated_at;

  return obj;
};

/**
 * Statics
 */
SupplierSchema.statics = {
  /**
   * Get supplier
   * @param {ObjectId} id - The objectId of supplier.
   * @returns {Promise<Supplier, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((supplier) => {
        if (supplier) {
          return supplier;
        }
        const err = new APIError('No such supplier exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List suppliers associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of suppliers to be skipped.
   * @param {number} limit - Limit number of suppliers to be returned.
   * @returns {Promise<Supplier[]>}
   */
  list(filters, whiteList) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 30;
    delete filters.limit; // eslint-disable-line
    const name = filters.name;
    delete filters.name; // eslint-disable-line

    const query = this.find(whiteList);
    query.where(filters);

    if (name) {
      query.where({ name: new RegExp(`^${name}`, 'i') });
    }

    query.sort({ order: 1 })
    .skip(skip)
    .limit(limit);

    return query.execAsync()
    .then((suppliers) =>
      query.limit().skip().count().execAsync()
      .then((count) => { // eslint-disable-line
        return { suppliers, count };
      })
    );
  },

};

/**
 * @typedef Supplier
 */
export default mongoose.model('Supplier', SupplierSchema);
