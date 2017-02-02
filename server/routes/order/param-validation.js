import Joi from '../../helpers/customJoi';

const createBody = {
  venue_id: Joi.objectId().trim().required(),
  supplier_id: Joi.objectId().trim().allow(null),
  items: Joi.array().items(Joi.object({
    inventory_item: Joi.object({
      _id: Joi.objectId().trim().required(),
      venue_id: Joi.objectId().trim(),
      product_id: Joi.object({ // we need for orders
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
        venue_id: Joi.objectId().trim()
      }),
      supplier_id: Joi.objectId().allow(null),
      supplier_product_code: Joi.string().trim().empty(''),
      par_level: Joi.number().empty(''),
      package_size: Joi.number().empty(''),
      count_as_full: Joi.number().empty(''),
      sale_unit_size: Joi.number().empty(''),
      cost_price: Joi.number().required(), // we need for orders
      sale_price: Joi.number().empty('')
    })
  })),
  other_items: Joi.array().items(Joi.object({
    description: Joi.string().trim().required(),
    price: Joi.number().required(),
    ammount: Joi.number().required()
  })),
  invoice_id: Joi.string().trim().empty(''),
  status: Joi.string().trim().empty(''),
  contact_tel: Joi.string().trim().empty(''),
  contact_email: Joi.string().trim().empty(''),
  delivery_address: Joi.string().trim().empty(''),
  req_delivery_date: Joi.string().trim().empty(''),
  delivery_node: Joi.string().trim().empty('')
};

export default {
  // POST /
  create: {
    body: Joi.alternatives().try(createBody, Joi.array().items(Joi.object(createBody)))
  },
  // PUT /:id
  update: {
    body: {
      items: Joi.array().items(Joi.object({
        inventory_item: Joi.object({
          _id: Joi.objectId().trim().required(),
          venue_id: Joi.objectId().trim(),
          product_id: Joi.object({ // we need for orders
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
            venue_id: Joi.objectId().trim()
          }),
          supplier_id: Joi.objectId().allow(null),
          supplier_product_code: Joi.string().trim().empty(''),
          par_level: Joi.number().empty(''),
          package_size: Joi.number().empty(''),
          count_as_full: Joi.number().empty(''),
          sale_unit_size: Joi.number().empty(''),
          cost_price: Joi.number().required(), // we need for orders
          sale_price: Joi.number().empty('')
        })
      })),
      other_items: Joi.array().items(Joi.object({
        description: Joi.string().trim().required(),
        price: Joi.number().required(),
        ammount: Joi.number().required()
      })),
      invoice_id: Joi.string().trim().empty(''),
      status: Joi.string().trim().empty(''),
      contact_tel: Joi.string().trim().empty(''),
      contact_email: Joi.string().trim().empty(''),
      delivery_address: Joi.string().trim().empty(''),
      req_delivery_date: Joi.string().trim().empty(''),
      delivery_node: Joi.string().trim().empty('')
    }
  }
};
