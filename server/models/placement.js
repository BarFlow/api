import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Placement Schema
 */
const PlacementSchema = new mongoose.Schema({
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Venue'
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Area'
  },
  section_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Section'
  },
  inventory_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Inventory'
  },
  volume: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
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
PlacementSchema.pre('save', function PlacementModelPreSave(next) {
  const placement = this;

  placement.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
PlacementSchema.methods.toJSON = function PlacementModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.created_at;

  return obj;
};

/**
 * Statics
 */
PlacementSchema.statics = {
  /**
   * Get placement
   * @param {ObjectId} id - The objectId of placement.
   * @returns {Promise<Placement, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((placement) => {
        if (placement) {
          return placement;
        }
        const err = new APIError('No such placement exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List placements associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of placements to be skipped.
   * @param {number} limit - Limit number of placements to be returned.
   * @returns {Promise<Placement[]>}
   */
  list(filters) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 0;
    delete filters.limit; // eslint-disable-line
    return this.find()
    .where(filters)
    .sort({ order: 1 })
    .skip(skip)
    .limit(limit)
    .execAsync();
  },

  /**
   * Bulk update placements.
   * @param {array<Placement>} placements - List of arrea object to be updated.
   * @returns {Promise<Response, APIError>}
   */
  bulkUpdate(placements) {
    return new Promise((resolve, reject) => {
      const bulk = this.collection.initializeOrderedBulkOp();

      for (let i = 0; i < placements.length; i++) {
        // Model id is only used as filter, not to be updated
        const id = placements[i]._id;
        delete placements[i]._id; // eslint-disable-line

        // We are using venue_id as a search filter to prevent malicious updates
        const venueId = placements[i].venue_id;
        delete placements[i].venue_id; // eslint-disable-line

        // Store updated_at to only update old versions
        const updatedAt = new Date(placements[i].updated_at); // eslint-disable-line
        delete placements[i].updated_at; // eslint-disable-line

        // Set current time for updated_at
        placements[i].updated_at = new Date(); // eslint-disable-line

        bulk.find({
          _id: mongoose.Types.ObjectId(id), // eslint-disable-line
          venue_id: mongoose.Types.ObjectId(venueId), // eslint-disable-line
          updated_at: { $lte: updatedAt },
        }).updateOne({
          $set: placements[i]
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
 * @typedef Placement
 */
export default mongoose.model('Placement', PlacementSchema);
