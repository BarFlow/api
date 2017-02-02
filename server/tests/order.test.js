import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Order APIs', () => {
  const user = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow'
  };

  const venue = {
    profile: {
      name: 'Demo Bar',
      email: 'demo@barflow.com'
    }
  };

  const product = {
    name: 'Absolut',
    type: 'beverage',
    category: 'vodka',
    measurable: true,
    measurable_from: 0.1234,
    measurable_till: 0.98764
  };

  let inventoryItem = {
    par_level: 15,
    cost_price: 1,
    sale_unit_size: 10,
    sale_price: 20
  };

  let order = {};

  const headers = {};

  describe('# POST /auth/signup', () => {
    it('should register a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/signup')
        .send(user)
        .expect(httpStatus.CREATED)
        .then((res) => {
          user._id = res.body.user._id;
          headers.Authorization = `Bearer ${res.body.token}`;
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /venues', () => {
    it('should create a venue', (done) => {
      request(app)
        .post('/venues')
        .set(headers)
        .send(venue)
        .expect(httpStatus.CREATED)
        .then((res) => {
          venue._id = res.body._id;
          product.venue_id = res.body._id;
          inventoryItem.venue_id = res.body._id;
          expect(res.body.profile.name).to.equal('Demo Bar');
          expect(res.body.profile.email).to.equal('demo@barflow.com');
          expect(res.body.members[0].user_id).to.equal(user._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should login a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/login')
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          headers.Authorization = `Bearer ${res.body.token}`;
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /products', () => {
    it('should create an product', (done) => {
      request(app)
        .post('/products')
        .set(headers)
        .send(product)
        .expect(httpStatus.CREATED)
        .then((res) => {
          product._id = res.body._id;
          inventoryItem.product_id = res.body._id;
          expect(res.body.name).to.equal(product.name);
          expect(res.body.venue_id).to.equal(product.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /inventory', () => {
    it('should create an inventory', (done) => {
      request(app)
        .post('/inventory?populate=true')
        .set(headers)
        .send(inventoryItem)
        .expect(httpStatus.CREATED)
        .then((res) => {
          inventoryItem = res.body;
          expect(res.body.product_id).to.equal(inventoryItem.product_id);
          expect(res.body.cost_price).to.equal(inventoryItem.cost_price);
          expect(res.body.par_level).to.equal(inventoryItem.par_level);
          expect(res.body.sale_unit_size).to.equal(inventoryItem.sale_unit_size);
          expect(res.body.sale_price).to.equal(inventoryItem.sale_price);
          expect(res.body.venue_id).to.equal(inventoryItem.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /orders', () => {
    it('should create an order', (done) => {
      order = {
        venue_id: venue._id,
        items: [
          {
            inventory_item: inventoryItem,
            ammount: 1
          }
        ]
      };
      request(app)
        .post('/orders')
        .set(headers)
        .send(order)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.placed_by).to.equal(user.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /orders', () => {
    order = {
      venue_id: venue._id,
      items: [
        {
          inventory_item: inventoryItem,
          ammount: 1
        }
      ]
    };
    it('should create two orders', (done) => {
      request(app)
        .post('/orders')
        .set(headers)
        .send([order, order])
        .expect(httpStatus.CREATED)
        .then((res) => {
          order._id = res.body[1]._id;
          expect(res.body[1].placed_by).to.equal(user.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /order', () => {
    it('should get list of order items', (done) => {
      request(app)
        .get('/orders')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0].placed_by).to.equal(user.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /orders/:orders_id', () => {
    it('should get the order', (done) => {
      request(app)
        .get(`/orders/${order._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.placed_by).to.equal(user.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /orders/57fd42f6acbc0b2e46e69e25', () => {
    it('should not found order', (done) => {
      request(app)
        .get('/orders/57fd42f6acbc0b2e46e69e25')
        .set(headers)
        .send()
        .expect(httpStatus.NOT_FOUND)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /orders/:orders_id', () => {
    it('should update the order item', (done) => {
      request(app)
        .put(`/orders/${order._id}`)
        .set(headers)
        .send({
          placed_by: 'pepe'
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.placed_by).to.equal('pepe');
          done();
        })
        .catch(done);
    });
  });


  describe('# DELETE /orders/:orders_id', () => {
    it('should remove the order', (done) => {
      request(app)
        .delete(`/orders/${order._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });
});
