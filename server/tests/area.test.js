import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Area APIs', () => {
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

  const area = {
    name: 'Main Bar'
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
          area.venue_id = res.body._id;
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

  describe('# POST /areas', () => {
    it('should create an area', (done) => {
      request(app)
        .post('/areas')
        .set(headers)
        .send(area)
        .expect(httpStatus.CREATED)
        .then(res => {
          area._id = res.body._id;
          expect(res.body.name).to.equal('Main Bar');
          expect(res.body.venue_id).to.equal(area.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /areas', () => {
    it('should get list of areas', (done) => {
      request(app)
        .get('/areas')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body[0]._id).to.equal(area._id);
          expect(res.body[0].name).to.equal('Main Bar');
          expect(res.body[0].venue_id).to.equal(area.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /areas/:area_id', () => {
    it('should get the area', (done) => {
      request(app)
        .get(`/areas/${area._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(area._id);
          expect(res.body.name).to.equal('Main Bar');
          expect(res.body.venue_id).to.equal(area.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /areas/:area_id', () => {
    it('should update the area', (done) => {
      request(app)
        .put(`/areas/${area._id}`)
        .set(headers)
        .send({
          name: 'Patio Bar'
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(area._id);
          expect(res.body.name).to.equal('Patio Bar');
          expect(res.body.venue_id).to.equal(area.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /areas/:area_id', () => {
    it('should remove the area', (done) => {
      request(app)
        .delete(`/areas/${area._id}`)
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
