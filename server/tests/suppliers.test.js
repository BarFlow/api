import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Supplier APIs', () => {
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

  const supplier = {
    name: 'Supplier Name',
    email: 'email@cim.com'
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
          supplier.venue_id = res.body._id;
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

  describe('# POST /suppliers', () => {
    it('should create an supplier', (done) => {
      request(app)
        .post('/suppliers')
        .set(headers)
        .send(supplier)
        .expect(httpStatus.CREATED)
        .then(res => {
          supplier._id = res.body._id;
          expect(res.body.name).to.equal(supplier.name);
          expect(res.body.venue_id).to.equal(supplier.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /suppliers', () => {
    it('should get list of suppliers with matching partial name', (done) => {
      request(app)
        .get('/suppliers?name=su')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body[0]._id).to.equal(supplier._id);
          expect(res.body[0].name).to.equal(supplier.name);
          expect(res.body[0].venue_id).to.equal(supplier.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /suppliers/:supplier_id', () => {
    it('should get the supplier', (done) => {
      request(app)
        .get(`/suppliers/${supplier._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(supplier._id);
          expect(res.body.name).to.equal(supplier.name);
          expect(res.body.venue_id).to.equal(supplier.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /suppliers/:supplier_id', () => {
    it('should update the supplier', (done) => {
      request(app)
        .put(`/suppliers/${supplier._id}`)
        .set(headers)
        .send({
          name: 'Belvedere'
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(supplier._id);
          expect(res.body.name).to.equal('Belvedere');
          expect(res.body.venue_id).to.equal(supplier.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /suppliers/:supplier_id', () => {
    it('should remove the supplier', (done) => {
      request(app)
        .delete(`/suppliers/${supplier._id}`)
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
