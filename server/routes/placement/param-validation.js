import Joi from 'joi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.string().trim().required(),
      area_id: Joi.string().trim().required(),
      section_id: Joi.string().trim().required(),
      inventory_item_id: Joi.string().trim(),
      volume: Joi.number(),
      order: Joi.number().integer()
    }
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
  }
};
