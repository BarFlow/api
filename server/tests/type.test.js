import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

import User from '../models/user';

describe('## Type APIs', () => {
  const user = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow',
    admin: true
  };

  const type = {
    title: 'Beverage'
  };

  const headers = {};

  it('should insert an admin user', (done) => {
    const userModel = new User(user);

    userModel.saveAsync().then(() => {
      done();
    }).error(done);
  });

  describe('# POST /auth/login', () => {
    it('should login admin user to get jwt token', (done) => {
      request(app)
        .post('/auth/login')
        .send(user)
        .expect(httpStatus.OK)
        .then(res => {
          user._id = res.body.user._id;
          headers.Authorization = `Bearer ${res.body.token}`;
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /types', () => {
    it('should create an type', (done) => {
      request(app)
        .post('/types')
        .set(headers)
        .send(type)
        .expect(httpStatus.CREATED)
        .then(res => {
          type._id = res.body._id;
          expect(res.body.title).to.equal(type.title);
          expect(res.body.type_id).to.equal(type.type_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /types', () => {
    it('should get list of types', (done) => {
      request(app)
        .get('/types')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body[0]._id).to.equal(type._id);
          expect(res.body[0].title).to.equal(type.title);
          expect(res.body[0].type_id).to.equal(type.type_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /types/:type_id', () => {
    it('should get the type', (done) => {
      request(app)
        .get(`/types/${type._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(type._id);
          expect(res.body.title).to.equal(type.title);
          expect(res.body.type_id).to.equal(type.type_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /types/:type_id', () => {
    it('should update the type', (done) => {
      request(app)
        .put(`/types/${type._id}`)
        .set(headers)
        .send({
          title: 'Wine'
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(type._id);
          expect(res.body.title).to.equal('Wine');
          expect(res.body.type_id).to.equal(type.type_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /types/', () => {
    it('should batch update types', (done) => {
      type.title = 'Rose';
      request(app)
        .put('/types/')
        .set(headers)
        .send([type])
        .expect(httpStatus.ACCEPTED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /types/:type_id', () => {
    it('should get the type with new name from batch update', (done) => {
      request(app)
        .get(`/types/${type._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(type._id);
          expect(res.body.title).to.equal('Rose');
          expect(res.body.type_id).to.equal(type.type_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /types/:type_id', () => {
    it('should remove the type', (done) => {
      request(app)
        .delete(`/types/${type._id}`)
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
