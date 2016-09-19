import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Inventory Schema
 */
const InventorySchema = new mongoose.Schema({
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Venue'
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Product'
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Supplier'
  },
  supplier_product_code: {
    type: Number
  },
  stock_level: {
    type: Number
  },
  par_level: {
    type: Number
  },
  wholesale_cost: {
    type: Number
  },
  sale_price: {
    type: Number
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

InventorySchema.index({ venue_id: 1, product_id: 1 }, { unique: true });

/**
 *  Set updated_at before model gets saved.
*/
InventorySchema.pre('save', function InventoryModelPreSave(next) {
  const inventoryItem = this;

  inventoryItem.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
InventorySchema.methods.toJSON = function InventoryModelRemoveHash() {
  const obj = this.toObject();
  delete obj.created_at;
  delete obj.updated_at;
  delete obj.__v;

  return obj;
};

/**
 * Statics
 */
InventorySchema.statics = {
  /**
   * Get inventoryItem with associated product
   * @param {ObjectId} id - The objectId of inventoryItem.
   * @returns {Promise<Inventory, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('product_id',
      'name type category sub_category images capacity measurable measurable_from measurable_till')
      .execAsync().then((inventoryItem) => {
        if (inventoryItem) {
          return inventoryItem;
        }
        const err = new APIError('No such inventory item exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List inventoryItems associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of inventoryItems to be skipped.
   * @param {number} limit - Limit number of inventoryItems to be returned.
   * @returns {Promise<Inventory[]>}
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
   * Bulk update inventoryItems.
   * @param {array<Inventory>} inventoryItems - List of arrea object to be updated.
   * @returns {Promise<Response, APIError>}
   */
  bulkUpdate(inventoryItems) {
    return new Promise((resolve, reject) => {
      const bulk = this.collection.initializeOrderedBulkOp();

      for (let i = 0; i < inventoryItems.length; i++) {
        // Model id is only used as filter, not to be updated
        const id = inventoryItems[i]._id;
        delete inventoryItems[i]._id; // eslint-disable-line

        // We are using venue_id as a search filter to prevent malicious updates
        const venueId = inventoryItems[i].venue_id;
        delete inventoryItems[i].venue_id; // eslint-disable-line

        bulk.find({
          _id: mongoose.Types.ObjectId(id), // eslint-disable-line
          venue_id: mongoose.Types.ObjectId(venueId) // eslint-disable-line
        }).updateOne({
          $set: inventoryItems[i]
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
 * @typedef Inventory
 */
export default mongoose.model('Inventory', InventorySchema);
