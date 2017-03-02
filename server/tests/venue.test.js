import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Venue APIs', () => {
  const user = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow'
  };

  const user2 = {
    name: 'BarFlow User',
    email: `${new Date().getTime()}-staff-user@barflow.com`,
    password: 'barflow'
  };

  const venue = {
    profile: {
      name: 'Demo Bar',
      email: 'demo@barflow.com'
    }
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

  describe('# POST /auth/signup', () => {
    it('should register a user2 and return a jwt token', (done) => {
      request(app)
        .post('/auth/signup')
        .send(user2)
        .expect(httpStatus.CREATED)
        .then(() => {
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
          expect(res.body.profile.name).to.equal('Demo Bar');
          expect(res.body.profile.email).to.equal('demo@barflow.com');
          expect(res.body.members[0].user).to.equal(user._id);
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

  describe('# GET /venues/:venue_id', () => {
    it('should get a venue', (done) => {
      request(app)
        .get(`/venues/${venue._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.profile.name).to.equal('Demo Bar');
          expect(res.body.profile.email).to.equal('demo@barflow.com');
          expect(res.body.members[0].user._id).to.equal(user._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /venues/:venue_id', () => {
    it('should update a venue', (done) => {
      request(app)
        .put(`/venues/${venue._id}`)
        .set(headers)
        .send({
          profile: {
            name: 'Demo Bar 2'
          }
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.profile.name).to.equal('Demo Bar 2');
          expect(res.body.profile.email).to.equal('demo@barflow.com');
          expect(res.body.members[0].user._id).to.equal(user._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /venues/:venue_id/members', () => {
    it('should add a member', (done) => {
      request(app)
        .post(`/venues/${venue._id}/members`)
        .set(headers)
        .send(user2)
        .expect(httpStatus.OK)
        .then((res) => {
          user2._id = res.body.members[1]._id;
          expect(res.body.members[1].user.email).to.equal(user2.email);
          expect(res.body.members[1].role).to.equal('staff');
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /venues/:venue_id/members/:member_id', () => {
    it('should update a member', (done) => {
      request(app)
        .put(`/venues/${venue._id}/members/${user2._id}`)
        .set(headers)
        .send({
          role: 'manager'
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.members[1].role).to.equal('manager');
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /venues/:venue_id/members/:member_id', () => {
    it('delete a member', (done) => {
      request(app)
        .delete(`/venues/${venue._id}/members/${user2._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /venues/:venue_id', () => {
    it('should update a venue', (done) => {
      request(app)
        .delete(`/venues/${venue._id}`)
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
