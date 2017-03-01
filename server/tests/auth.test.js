import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Auth APIs', () => {
  const user = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow'
  };

  const userLead = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow',
    lead: 'aa@aaa.aa'
  };

  const headers = {};

  describe('# POST /auth/signup', () => {
    it('should register a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/signup')
        .send(user)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.user.email).to.equal(user.email);
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should log in a user and return a jwt token', (done) => {
      request(app)
        .post('/auth/login')
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          headers.Authorization = `Bearer ${res.body.token}`;
          expect(res.body.user._id).to.be.a('string');
          expect(res.body.user.email).to.equal(user.email);
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should log in a user with lead email and return a jwt token', (done) => {
      request(app)
        .post('/auth/login')
        .send(userLead)
        .expect(httpStatus.OK)
        .then((res) => {
          headers.Authorization = `Bearer ${res.body.token}`;
          expect(res.body.user._id).to.be.a('string');
          expect(res.body.user.email).to.equal(user.email);
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should not log in with wrong password', (done) => {
      const payload = Object.assign({}, user, { password: 'foo' });

      request(app)
        .post('/auth/login')
        .send(payload)
        .expect(httpStatus.UNAUTHORIZED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should not log in with wrong email', (done) => {
      const payload = Object.assign({}, user, { email: 'foo@bar.com' });

      request(app)
        .post('/auth/login')
        .send(payload)
        .expect(httpStatus.UNAUTHORIZED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /auth/refreshToken', () => {
    it('should receive a fresh token', (done) => {
      request(app)
        .get('/auth/refreshToken')
        .set(headers)
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /auth/me', () => {
    it('should return the current user', (done) => {
      request(app)
        .get('/auth/me')
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.name).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /auth/me', () => {
    it('should update user profile', (done) => {
      request(app)
        .put('/auth/me')
        .set(headers)
        .send({
          name: 'new name',
          email: 'new@email.com',
          password: 'newpass',
          old_password: user.password,
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.name).to.equal('new name');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should login with the updated password', (done) => {
      request(app)
        .post('/auth/login')
        .set(headers)
        .send({
          name: 'new name',
          email: 'new@email.com',
          password: 'newpass',
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /auth/me', () => {
    it('should delete the current user', (done) => {
      request(app)
        .delete('/auth/me')
        .set(headers)
        .expect(httpStatus.OK)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });
});
