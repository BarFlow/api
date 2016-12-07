import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Product Schema
 */
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    index: true,
    default: 'beverage'
  },
  category: {
    type: String,
    index: true,
  },
  sub_category: {
    type: String,
    default: 'other',
    index: true
  },
  images: {
    thumbnail: String,
    normal: String,
    original: String
  },
  measurable: Boolean,
  measurable_from: Number,
  measurable_till: Number,
  capacity: Number,
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

ProductSchema.index({ name: 'text' }, { category: 'text' }, { sub_category: 'text' });

/**
 *  Set updated_at before model gets saved.
*/
ProductSchema.pre('save', function ProductModelPreSave(next) {
  const product = this;

  product.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
ProductSchema.methods.toJSON = function ProductModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.approved;
  delete obj.created_at;
  delete obj.updated_at;
  delete obj.sku;

  return obj;
};

/**
 * Statics
 */
ProductSchema.statics = {
  /**
   * Get product
   * @param {ObjectId} id - The objectId of product.
   * @returns {Promise<Product, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((product) => {
        if (product) {
          return product;
        }
        const err = new APIError('No such product exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List products associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of products to be skipped.
   * @param {number} limit - Limit number of products to be returned.
   * @returns {Promise<Product[]>}
   */
  list(filters, whiteList) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 100;
    delete filters.limit; // eslint-disable-line
    const name = filters.name;
    delete filters.name; // eslint-disable-line

    const find = name ?
    Object.assign(filters, whiteList, {
      $or: [
        { name: new RegExp(name, 'i') },
        {
          $text: {
            $search: name
          },
        }
      ],
    }) : {};

    const query = this.find(find, { score: { $meta: 'textScore' } });

    if (name) {
      query.sort({ score: { $meta: 'textScore' }, name: 1 });
    } else {
      query.sort({ name: 1 });
    }
    query.skip(skip);
    query.limit(limit);

    return query.execAsync()
    .then(products =>
      query.limit().skip().count().execAsync()
      .then((count) => { // eslint-disable-line
        return { products, count };
      })
    );
  },

};

/**
 * @typedef Product
 */
export default mongoose.model('Product', ProductSchema);
