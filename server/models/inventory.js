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
    type: String
  },
  par_level: {
    type: Number
  },
  cost_price: {
    type: Number
  },
  sale_price: {
    type: Number
  },
  sale_unit_size: {
    type: Number
  },
  package_size: {
    type: Number
  },
  count_as_full: {
    type: Number
  },
  measurable: {
    type: Boolean
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
      '-__v -updated_at -created_at')
      .execAsync().then((inventoryItem) => {
        if (inventoryItem) {
          return inventoryItem;
        }
        const err = new APIError('No such inventory item exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  create(data) {
    return new Promise((resolve, reject) => {
      const inventoryItem = new this(data);
      inventoryItem.saveAsync()
        .then((savedInventory) => resolve(savedInventory))
        .error((e) => {
          // If the product has been added to the venue already, ignore the request and
          // send back the original model
          if (e.code === 11000) {
            return this.findOne({
              venue_id: data.venue_id,
              product_id: data.product_id
            })
            .execAsync()
            .then((inventory) => resolve(inventory));
          }

          // If any other error occurs forward it
          reject(e);
        });
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
    const limit = parseInt(filters.limit, 10) || 30;
    delete filters.limit; // eslint-disable-line
    const populate = filters.populate || false;
    delete filters.populate; // eslint-disable-line
    const product = filters.product || {};
    delete filters.product; // eslint-disable-line
    const query = this.find(filters);
    if (populate) {
      if (product.name) {
        product.name = new RegExp(product.name, 'i') // eslint-disable-line
      }
      return query.populate({
        path: 'product_id',
        select: '-__v -updated_at -created_at',
        match: product
      })
      .execAsync()
      .then(items =>
        items.filter(item => item.product_id !== null)
        .sort((a, b) => {
          const nameA = a.product_id.name.toUpperCase();
          const nameB = b.product_id.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        })
        .splice(skip, limit)
      );
    }
    return query
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

        // Set current time for updated_at
        inventoryItems[i].updated_at = new Date(); // eslint-disable-line

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
