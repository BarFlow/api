import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Product APIs', () => {
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
          expect(res.body.name).to.equal(product.name);
          expect(res.body.venue_id).to.equal(product.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /products', () => {
    it('should get list of products with matching partial name', (done) => {
      request(app)
        .get('/products?name=Abs')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0].name).to.equal(product.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /products/:product_id', () => {
    it('should get the product', (done) => {
      request(app)
        .get(`/products/${product._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(product._id);
          expect(res.body.name).to.equal(product.name);
          expect(res.body.venue_id).to.equal(product.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /products/:product_id', () => {
    it('should update the product', (done) => {
      request(app)
        .put(`/products/${product._id}`)
        .set(headers)
        .send({
          name: 'Belvedere'
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(product._id);
          expect(res.body.name).to.equal('Belvedere');
          expect(res.body.venue_id).to.equal(product.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /products/:product_id', () => {
    it('should remove the product', (done) => {
      request(app)
        .delete(`/products/${product._id}`)
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
