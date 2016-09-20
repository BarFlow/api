import Joi from 'joi';

export default {
  // POST /
  create: {
    body: {
      body: {
        title: Joi.string().trim().required(),
        description: Joi.string().trim(),
        images: Joi.object({
          thumbnail: Joi.string().trim().required(),
          normal: Joi.string().trim().required(),
          original: Joi.string().trim()
        }),
        measurable_from: Joi.number(),
        measurable_till: Joi.number()
      }
    }
  },
  // PUT /:area_id
  update: {
    body: {
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      images: Joi.object({
        thumbnail: Joi.string().trim(),
        normal: Joi.string().trim(),
        original: Joi.string().trim()
      }),
      measurable_from: Joi.number(),
      measurable_till: Joi.number()
    }
  },
  // PUT /
  bulkUpdate: {
    body: Joi.array().items(Joi.object({
      _id: Joi.string().trim().required(),
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      images: Joi.object({
        thumbnail: Joi.string().trim(),
        normal: Joi.string().trim(),
        original: Joi.string().trim()
      }),
      measurable_from: Joi.number(),
      measurable_till: Joi.number()
    }))
  }
};
