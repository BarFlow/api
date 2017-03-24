import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      email: Joi.string().trim().required(),
      company: Joi.string().trim()
    }
  },
  // PUT /:id
  update: {
    body: {
      email: Joi.string().trim(),
      company: Joi.string().trim().empty('')
    }
  }
};
