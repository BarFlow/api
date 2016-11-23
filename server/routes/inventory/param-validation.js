import Joi from '../../helpers/customJoi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.objectId().trim().required(),
      product_id: Joi.objectId().trim().required(),
      supplier_id: Joi.objectId().trim(),
      supplier_product_code: Joi.string().trim().empty(''),
      par_level: Joi.number(),
      package_size: Joi.number(),
      count_as_full: Joi.number(),
      sale_unit_size: Joi.number(),
      cost_price: Joi.number(),
      sale_price: Joi.number()
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
      sale_unit_size: Joi.number().empty(''),
      cost_price: Joi.number().empty(''),
      sale_price: Joi.number().empty('')
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
      sale_unit_size: Joi.number().empty(''),
      cost_price: Joi.number().empty(''),
      sale_price: Joi.number().empty('')
    }))
  }
};
