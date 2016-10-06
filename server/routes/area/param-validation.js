import Joi from 'joi';

export default {
  // POST /
  create: {
    body: {
      name: Joi.string().trim().required(),
      venue_id: Joi.string().trim().required(),
      order: Joi.number().integer()
    }
  },
  // PUT /:area_id
  update: {
    body: {
      name: Joi.string().trim(),
      order: Joi.number().integer()
    }
  },
  // PUT /
  bulkUpdate: {
    body: Joi.array().items(Joi.object({
      _id: Joi.string().trim().required(),
      name: Joi.string().trim(),
      order: Joi.number().integer(),
      venue_id: Joi.string().trim().required()
    }))
  }
};
