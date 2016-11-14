import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Inventory APIs', () => {
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

  const inventoryItem = {
    par_level: 15,
    cost_price: 1.34,
    sale_unit_size: 10,
    sale_price: 20
  };

  const headers = {};

  describe('# POST /auth/signup', () => {
    it('should register a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/signup')
        .send(user)
        .expect(httpStatus.CREATED)
        .then(res => {
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
        .then(res => {
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
        .then(res => {
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
        .then(res => {
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
        .post('/inventory')
        .set(headers)
        .send(inventoryItem)
        .expect(httpStatus.CREATED)
        .then(res => {
          inventoryItem._id = res.body._id;
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

  describe('# GET /inventory', () => {
    it('should get list of inventory items', (done) => {
      request(app)
        .get('/inventory')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body[0].product_id).to.equal(inventoryItem.product_id);
          expect(res.body[0].cost_price).to.equal(inventoryItem.cost_price);
          expect(res.body[0].par_level).to.equal(inventoryItem.par_level);
          expect(res.body[0].sale_unit_size).to.equal(inventoryItem.sale_unit_size);
          expect(res.body[0].sale_price).to.equal(inventoryItem.sale_price);
          expect(res.body[0].venue_id).to.equal(inventoryItem.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /inventory/:inventory_id', () => {
    it('should get the inventory', (done) => {
      request(app)
        .get(`/inventory/${inventoryItem._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
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

  describe('# PUT /inventory/:inventory_id', () => {
    it('should update the inventory item', (done) => {
      request(app)
        .put(`/inventory/${inventoryItem._id}`)
        .set(headers)
        .send({
          sale_price: 999
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(inventoryItem._id);
          expect(res.body.sale_price).to.equal(999);
          expect(res.body.venue_id).to.equal(inventoryItem.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /inventory/', () => {
    it('should batch update inventorys', (done) => {
      inventoryItem.sale_price = 111;
      request(app)
        .put('/inventory/')
        .set(headers)
        .send([inventoryItem])
        .expect(httpStatus.ACCEPTED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /inventory/:inventory_id', () => {
    it('should get the inventory with new name from batch update', (done) => {
      request(app)
        .get(`/inventory/${inventoryItem._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(inventoryItem._id);
          expect(res.body.sale_price).to.equal(111);
          expect(res.body.venue_id).to.equal(inventoryItem.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /inventory/:inventory_id', () => {
    it('should remove the inventory', (done) => {
      request(app)
        .delete(`/inventory/${inventoryItem._id}`)
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
