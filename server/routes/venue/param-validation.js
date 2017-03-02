import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      profile: {
        name: Joi.string().trim().required(),
        email: Joi.string().trim().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).required(), // eslint-disable-line
        tel: Joi.string().trim(),
        address: Joi.string().trim(),
        type: Joi.string().trim()
      }
    }
  },
  // PUT /:venue_id
  update: {
    body: {
      profile: {
        name: Joi.string().trim(),
        email: Joi.string().trim().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),  // eslint-disable-line
        tel: Joi.string().trim().empty(''),
        address: Joi.string().trim().empty(''),
        type: Joi.string().trim().empty('')
      }
    }
  },
  addMember: {
    body: {
      email: Joi.string().trim().required(),
      role: Joi.string().trim().valid('staff', 'manager', 'owner')
    }
  },
  updateMember: {
    body: {
      role: Joi.string().trim().valid('staff', 'manager', 'owner').required()
    }
  }
};
