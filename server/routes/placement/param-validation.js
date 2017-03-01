import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: Joi.alternatives().try({
      venue_id: Joi.string().trim().required(),
      area_id: Joi.string().trim().required(),
      section_id: Joi.string().trim().required(),
      inventory_item_id: Joi.string().trim(),
      volume: Joi.number(),
      order: Joi.number().integer()
    }, Joi.array().items(Joi.object({
      venue_id: Joi.string().trim().required(),
      area_id: Joi.string().trim().required(),
      section_id: Joi.string().trim().required(),
      inventory_item_id: Joi.string().trim(),
      volume: Joi.number(),
      order: Joi.number().integer()
    })))
  },
  // PUT /:area_id
  update: {
    body: {
      volume: Joi.number(),
      order: Joi.number().integer(),
      updated_at: Joi.date().required()
    }
  },
  // PUT /
  bulkUpdate: {
    body: Joi.array().items(Joi.object({
      _id: Joi.string().trim().required(),
      volume: Joi.number(),
      order: Joi.number().integer(),
      venue_id: Joi.string().trim().required(),
      updated_at: Joi.date().required()
    }))
  },
  // PUT /:area_id
  reset: {
    body: {
      venue_id: Joi.string().trim().required()
    }
  },
};
