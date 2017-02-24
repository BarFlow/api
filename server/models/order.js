import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import User from './user';
import Venue from './venue';
import APIError from '../helpers/APIError';

/**
 * Order Schema
 */
const OrderSchema = new mongoose.Schema({
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Venue'
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: 'Supplier'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invoice_id: String,
  items: [],
  other_items: [],
  total_invoice_value: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'delivered']
  },
  venue_name: String,
  placed_by: String,
  contact_tel: String,
  contact_email: String,
  delivery_address: String,
  req_delivery_date: {
    type: Date,
    default: Date.now
  },
  delivery_note: String,
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
OrderSchema.pre('save', function OrderModelPreSave(next) {
  this.updated_at = new Date();

  Promise.all([User.get(this.created_by), Venue.get(this.venue_id)])
    .then(([user, venue]) => {
      this.venue_name = this.venue_name || venue.profile.name;
      this.placed_by = this.placed_by || user.name;
      this.contact_tel = this.contact_tel || venue.profile.tel;
      this.contact_email = this.contact_email || user.email;
      this.delivery_address = this.delivery_address || venue.profile.address;

      const itemsSubtotal = this.items.reduce((mem, item) => {
        mem += item.inventory_item.cost_price * item.ammount;
        return mem;
      }, 0);

      const otherItemsSubtotal = this.other_items.reduce((mem, item) => {
        mem += item.price * item.ammount;
        return mem;
      }, 0);

      this.total_invoice_value = (itemsSubtotal + otherItemsSubtotal) * 1.2;
      return next();
    })
    .catch(e => next(e));
});

/**
 * Methods
 */
// Filter model metadata out of the response
OrderSchema.methods.toJSON = function OrderModelRemoveHash() {
  const obj = this.toObject();
  delete obj.__v;

  return obj;
};

/**
 * Statics
 */
OrderSchema.statics = {
  /**
   * Get order
   * @param {ObjectId} id - The objectId of order.
   * @returns {Promise<Order, APIError>}
   */
  get(id, populate = false) {
    const query = this.findById(id);
    if (populate) {
      query.populate({
        path: 'supplier_id'
      });
    }
    return query.execAsync().then((order) => {
      if (order) {
        return order;
      }
      const err = new APIError('No such order exists!', httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List orders associated with the current user, in ascending order of "order" attribute.
   * @returns {Promise<Order[]>}
   */
  list(filters, whiteList) {
    const populate = filters.populate;
    delete filters.populate;
    const query = this.find(whiteList)
    .select('-items -other_items')
    .where(filters)
    .sort({ created_at: -1 });

    if (populate) {
      query.populate({
        path: 'supplier_id'
      });
    }

    return query.execAsync();
  },

};

/**
 * @typedef Order
 */
export default mongoose.model('Order', OrderSchema);
