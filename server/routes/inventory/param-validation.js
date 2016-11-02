import Joi from 'joi';

export default {
  // POST /
  create: {
    body: {
      venue_id: Joi.string().trim().required(),
      product_id: Joi.string().trim().required(),
      supplier_id: Joi.string().trim(),
      supplier_product_code: Joi.string().trim().empty(''),
      stock_level: Joi.number(),
      par_level: Joi.number(),
      wholesale_cost: Joi.number(),
      sale_price: Joi.number()
    }
  },
  // PUT /:area_id
  update: {
    body: {
      product_id: Joi.string().trim(),
      supplier_id: Joi.string().trim(),
      supplier_product_code: Joi.string().trim().empty(''),
      stock_level: Joi.number(),
      par_level: Joi.number(),
      wholesale_cost: Joi.number(),
      sale_price: Joi.number()
    }
  },
  // PUT /
  bulkUpdate: {
    body: Joi.array().items(Joi.object({
      _id: Joi.string().trim().required(),
      venue_id: Joi.string().trim().required(),
      product_id: Joi.string().trim(),
      supplier_id: Joi.string().trim(),
      supplier_product_code: Joi.string().trim().empty(''),
      stock_level: Joi.number(),
      par_level: Joi.number(),
      wholesale_cost: Joi.number(),
      sale_price: Joi.number()
    }))
  }
};
