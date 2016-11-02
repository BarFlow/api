import Joi from 'joi';

export default {
  // POST /
  create: {
    body: {
      name: Joi.string().trim().required(),
      email: Joi.string().trim().required(),
      address: Joi.string().trim(),
      tel: Joi.string().trim()
    }
  },
  // PUT /:id
  update: {
    body: {
      name: Joi.string().trim(),
      email: Joi.string().trim(),
      address: Joi.string().trim().empty(''),
      tel: Joi.string().trim().empty('')
    }
  }
};
