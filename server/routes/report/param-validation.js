import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.objectId().trim().required()
    }
  },
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
