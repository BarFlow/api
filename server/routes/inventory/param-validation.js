import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.objectId().trim().required(),
      product_id: Joi.objectId().trim().required(),
      supplier_id: Joi.objectId().trim().allow(null),
      supplier_product_code: Joi.string().trim().empty(''),
      par_level: Joi.number(),
      package_size: Joi.number(),
      count_as_full: Joi.number(),
      cost_price: Joi.number(),
      count_by: Joi.string()
    }
  },
  // PUT /:area_id
  update: {
    body: {
      product_id: Joi.objectId().trim(),
      supplier_id: Joi.objectId().allow(null),
      supplier_product_code: Joi.string().trim().empty(''),
      par_level: Joi.number().empty(''),
      package_size: Joi.number().empty(''),
      count_as_full: Joi.number().empty(''),
      cost_price: Joi.number().empty(''),
      count_by: Joi.string().empty('')
    }
  },
  // PUT /
  bulkUpdate: {
    body: Joi.array().items(Joi.object({
      _id: Joi.objectId().trim().required(),
      venue_id: Joi.objectId().trim().required(),
      product_id: Joi.objectId().trim(),
      supplier_id: Joi.objectId().allow(null),
      supplier_product_code: Joi.string().trim().empty(''),
      par_level: Joi.number().empty(''),
      package_size: Joi.number().empty(''),
      count_as_full: Joi.number().empty(''),
      cost_price: Joi.number().empty(''),
      count_by: Joi.string().empty('')
    }))
  }
};
