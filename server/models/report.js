import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Report Schema
 */
const ReportSchema = new mongoose.Schema({
  data: {
    type: Array,
    required: true
  },
  stats: {
    type: Object
  },
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Venue'
  },
  created_by: {
    type: Object
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
  const report = this;

  report.updated_at = new Date();

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
   * Get report
   * @param {ObjectId} id - The objectId of report.
   * @returns {Promise<Report, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((report) => {
        if (report) {
          return report;
        }
        const err = new APIError('No such report exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List reports associated with the current user, in ascending order of "order" attribute.
   * @returns {Promise<Report[]>}
   */
  list(filters, whiteList) {
    return this.find(whiteList)
    .select('created_at venue_id created_by stats')
    .where(filters)
    .sort({ created_at: -1 })
    .execAsync();
  },

};

/**
 * @typedef Report
 */
export default mongoose.model('Report', ReportSchema);
