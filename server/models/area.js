import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Section from './section';

/**
 * Area Schema
 */
const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Venue'
  },
  order: {
    type: Number,
    required: true
  },
  sections: Array,
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
AreaSchema.pre('save', function AreaModelPreSave(next) {
  const area = this;

  area.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
AreaSchema.methods.toJSON = function AreaModelRemoveHash() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    name: obj.name,
    order: obj.order,
    venue_id: obj.venue_id,
    sections: obj.sections.length < 1 ? undefined : obj.sections
  };
};

/**
 * Statics
 */
AreaSchema.statics = {
  /**
   * Get area
   * @param {ObjectId} id - The objectId of area.
   * @returns {Promise<Area, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((area) => {
        if (area) {
          return area;
        }
        const err = new APIError('No such area exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List areas associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of areas to be skipped.
   * @param {number} limit - Limit number of areas to be returned.
   * @returns {Promise<Area[]>}
   */
  list(filters) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 0;
    delete filters.limit; // eslint-disable-line
    const populate = filters.populate || false;
    delete filters.populate; // eslint-disable-line

    return this.find()
    .where(filters)
    .sort({ order: 1 })
    .skip(skip)
    .limit(limit)
    .execAsync()
    .then(areas => {
      if (!populate) {
        return areas;
      }

      let populatedAreas = areas;
      return Section.list({
        populate: true,
        area_id: {
          $in: areas.map(area => area._id)
        }
      })
      .then(sections => {
        populatedAreas = populatedAreas.map(area => {
          area.sections = []; // eslint-disable-line
          sections.forEach(section => {
            if (section.area_id.toString() == area._id.toString()) { //eslint-disable-line
              area.sections.push(section);
            }
          });

          return area;
        });

        return populatedAreas;
      });
    });
  },

  /**
   * Bulk update areas.
   * @param {array<Area>} areas - List of arrea object to be updated.
   * @returns {Promise<Response, APIError>}
   */
  bulkUpdate(areas) {
    return new Promise((resolve, reject) => {
      const bulk = this.collection.initializeOrderedBulkOp();

      const whiteList = ['name', 'order'];

      for (let i = 0; i < areas.length; i++) {
        const payload = Object.keys(areas[i]).reduce((mem, key) => { // eslint-disable-line
          if (whiteList.indexOf(key) > -1) {
            mem[key] = areas[i][key]; // eslint-disable-line
          }
          return mem;
        }, {});
        payload.updated_at = new Date();

        bulk.find({
          _id: mongoose.Types.ObjectId(areas[i]._id), // eslint-disable-line
          venue_id: mongoose.Types.ObjectId(areas[i].venue_id) // eslint-disable-line
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
 * @typedef Area
 */
export default mongoose.model('Area', AreaSchema);
