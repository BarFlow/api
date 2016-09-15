import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Auth APIs', () => {
  let user = {
    username: 'react',
    password: 'express'
  };

  describe('# POST /auth/login', () => {
    it('should log in a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/login')
        .send(user)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.username).to.equal(user.username);
          expect(res.body.token).to.be.a('string');
          user = res.body;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /auth/random-number', () => {
    it('should return a random number', (done) => {
      request(app)
        .get('/auth/random-number')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.user.username).to.equal(user.username);
          expect(res.body.num).to.be.a('number');
          done();
        })
        .catch(done);
    });
  });
});
