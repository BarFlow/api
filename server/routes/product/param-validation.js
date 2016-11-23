import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      name: Joi.string().trim().required(),
      type: Joi.string().trim().required(),
      category: Joi.string().trim().required(),
      sub_category: Joi.string().trim().empty(''),
      images: Joi.object({
        thumbnail: Joi.string().trim().required(),
        normal: Joi.string().trim().required(),
        original: Joi.string().trim()
      }),
      measurable: Joi.boolean(),
      measurable_from: Joi.number(),
      measurable_till: Joi.number(),
      capacity: Joi.number().integer(),
      venue_id: Joi.string().trim().required()
    }
  },
  // PUT /:id
  update: {
    body: {
      name: Joi.string().trim(),
      type: Joi.string().trim(),
      category: Joi.string().trim(),
      sub_category: Joi.string().trim().empty(''),
      images: Joi.object({
        thumbnail: Joi.string().trim(),
        normal: Joi.string().trim(),
        original: Joi.string().trim()
      }).empty(''),
      measurable: Joi.boolean(),
      measurable_from: Joi.number(),
      measurable_till: Joi.number(),
      capacity: Joi.number().integer(),
    }
  }
};
