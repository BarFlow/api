import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Section APIs', () => {
  const user = {
    name: 'SectionFlow User',
    email: `${new Date().getTime()}-user@barflow.com`,
    password: 'barflow'
  };

  const venue = {
    profile: {
      name: 'Demo Bar',
      email: 'demo@barflow.com'
    }
  };

  const fakeObjectId = '57dab064e2db20623d828a5c';

  const section = {
    name: 'Main Section',
    area_id: fakeObjectId
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
          section.venue_id = res.body._id;
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

  describe('# POST /sections', () => {
    it('should create an section', (done) => {
      request(app)
        .post('/sections')
        .set(headers)
        .send(section)
        .expect(httpStatus.CREATED)
        .then((res) => {
          section._id = res.body._id;
          expect(res.body.name).to.equal('Main Section');
          expect(res.body.venue_id).to.equal(section.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /sections', () => {
    it('should get list of sections', (done) => {
      request(app)
        .get('/sections')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0]._id).to.equal(section._id);
          expect(res.body[0].name).to.equal('Main Section');
          expect(res.body[0].venue_id).to.equal(section.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /sections/:section_id', () => {
    it('should get the section', (done) => {
      request(app)
        .get(`/sections/${section._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(section._id);
          expect(res.body.name).to.equal('Main Section');
          expect(res.body.venue_id).to.equal(section.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /sections/:section_id', () => {
    it('should update the section', (done) => {
      request(app)
        .put(`/sections/${section._id}`)
        .set(headers)
        .send({
          name: 'Patio Section'
        })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(section._id);
          expect(res.body.name).to.equal('Patio Section');
          expect(res.body.venue_id).to.equal(section.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /sections/', () => {
    it('should batch update sections', (done) => {
      section.name = 'Patio Section Batch';
      request(app)
        .put('/sections/')
        .set(headers)
        .send([section])
        .expect(httpStatus.ACCEPTED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /sections/:section_id', () => {
    it('should get the section with new name from batch update', (done) => {
      request(app)
        .get(`/sections/${section._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(section._id);
          expect(res.body.name).to.equal('Patio Section Batch');
          expect(res.body.venue_id).to.equal(section.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /sections/:section_id', () => {
    it('should remove the section', (done) => {
      request(app)
        .delete(`/sections/${section._id}`)
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
