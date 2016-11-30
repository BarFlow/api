import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Report Schema
 */
const ReportSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true
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
ReportSchema.pre('save', function ReportModelPreSave(next) {
  const supplier = this;

  supplier.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
ReportSchema.methods.toJSON = function ReportModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.updated_at;

  return obj;
};

/**
 * Statics
 */
ReportSchema.statics = {
  /**
   * Get supplier
   * @param {ObjectId} id - The objectId of supplier.
   * @returns {Promise<Report, APIError>}
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
   * @returns {Promise<Report[]>}
   */
  list(filters, whiteList) {
    return this.find(whiteList)
    .select('created_at venue_id')
    .where(filters)
    .sort({ created_at: -1 })
    .execAsync();
  },

};

/**
 * @typedef Report
 */
export default mongoose.model('Report', ReportSchema);
