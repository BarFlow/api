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
   * @param {Boolean} populate - Populate data if given.
   * @returns {Promise<Placement, APIError>}
   */
  get(id, populate = false) {
    const query = this.findById(id);
    if (populate) {
      query.populate({
        path: 'inventory_item_id',
        populate: {
          path: 'product_id'
        }
      });
    }
    return query.execAsync().then((placement) => {
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
    const populate = filters.populate || false;
    delete filters.populate; // eslint-disable-line
    const query = this.find()
    .where(filters);
    if (populate) {
      query.populate({
        path: 'inventory_item_id',
        select: '-__v -updated_at -created_at',
        populate: {
          path: 'product_id',
          select: '-__v -updated_at -created_at',
        }
      });
    }
    return query.sort({ order: 1 })
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

      const whiteList = ['volume', 'order', 'updated_at'];

      for (let i = 0; i < placements.length; i++) {
        const payload = Object.keys(placements[i]).reduce((mem, key) => { // eslint-disable-line
          if (whiteList.indexOf(key) > -1) {
            mem[key] = placements[i][key]; // eslint-disable-line
          }
          return mem;
        }, {});

        bulk.find({
          _id: mongoose.Types.ObjectId(placements[i]._id), // eslint-disable-line
          venue_id: mongoose.Types.ObjectId(placements[i].venue_id), // eslint-disable-line
          updated_at: { $lte: new Date(placements[i].updated_at) },
        }).updateOne({
          $set: payload
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
