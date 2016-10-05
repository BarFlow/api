import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

import Placement from './placement';

/**
 * Section Schema
 */
const SectionSchema = new mongoose.Schema({
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
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'Area'
  },
  order: {
    type: Number,
    required: true
  },
  placements: Array,
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
SectionSchema.pre('save', function SectionModelPreSave(next) {
  const section = this;

  section.updated_at = new Date();

  return next();
});

/**
 * Methods
 */
// Filter model metadata out of the response
SectionSchema.methods.toJSON = function SectionModelRemoveHash() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    name: obj.name,
    order: obj.order,
    venue_id: obj.venue_id,
    area_id: obj.area_id,
    placements: obj.placements
  };
};

/**
 * Statics
 */
SectionSchema.statics = {
  /**
   * Get section
   * @param {ObjectId} id - The objectId of section.
   * @returns {Promise<Section, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync().then((section) => {
        if (section) {
          return section;
        }
        const err = new APIError('No such section exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List sections associated with the current user, in ascending order of "order" attribute.
   * @param {number} skip - Number of sections to be skipped.
   * @param {number} limit - Limit number of sections to be returned.
   * @returns {Promise<Section[]>}
   */
  list(filters) {
    const skip = parseInt(filters.skip, 10) || 0;
    delete filters.skip; // eslint-disable-line
    const limit = parseInt(filters.limit, 10) || 0;
    delete filters.limit; // eslint-disable-line
    const populate = filters.populate || false;
    delete filters.populate; // eslint-disable-line
    let sectionsCache = [];
    return this.find()
    .where(filters)
    .sort({ order: 1 })
    .skip(skip)
    .limit(limit)
    .execAsync()
    .then(sections => {
      if (populate) {
        sectionsCache = sections;
        return Placement.list({
          populate: true,
          section_id: {
            $in: sections.map(section => section._id)
          }
        })
        .then(placements => {
          const populatedSections = sectionsCache.map(section => {
            // section.placements = []; // eslint-disable-line
            placements.forEach(placement => {
              if (placement.section_id.toString() == section._id.toString()) { //eslint-disable-line
                section.placements.push(placement);
              }
            });

            return section;
          });

          return populatedSections;
        });
      }

      return sections;
    });
  },

  /**
   * Bulk update sections.
   * @param {array<Section>} sections - List of arrea object to be updated.
   * @returns {Promise<Response, APIError>}
   */
  bulkUpdate(sections) {
    return new Promise((resolve, reject) => {
      const bulk = this.collection.initializeOrderedBulkOp();

      const whiteList = ['name', 'order'];

      for (let i = 0; i < sections.length; i++) {
        const payload = Object.keys(sections[i]).reduce((mem, key) => { // eslint-disable-line
          if (whiteList.indexOf(key) > -1) {
            mem[key] = sections[i][key]; // eslint-disable-line
          }
          return mem;
        }, {});
        payload.updated_at = new Date();

        bulk.find({
          _id: mongoose.Types.ObjectId(sections[i]._id), // eslint-disable-line
          venue_id: mongoose.Types.ObjectId(sections[i].venue_id) // eslint-disable-line
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
 * @typedef Section
 */
export default mongoose.model('Section', SectionSchema);
