import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.objectId().trim().required()
    }
  },
  usage: {
    query: {
      venue_id: Joi.objectId().trim().required(),
      open: Joi.objectId().trim().required(),
      close: Joi.objectId().trim().required()
    }
  }
  // PUT /:id
  // update: {
  //   body: {
  //     name: Joi.string().trim(),
  //     email: Joi.string().trim().empty(''),
  //     address: Joi.string().trim().empty(''),
  //     tel: Joi.string().trim().empty('')
  //   }
  // }
};
