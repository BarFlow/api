import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Reports APIs', () => {
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

  const section = {
    name: 'Speed Rail'
  };

  const product = {
    name: 'Absolut',
    type: 'beverage',
    category: 'vodka',
    measurable: true,
    measurable_from: 0.1234,
    measurable_till: 0.98764
  };

  const product2 = {
    name: 'Bbsolut2',
    type: 'beverage',
    category: 'vodka',
    measurable: true,
    measurable_from: 0.1234,
    measurable_till: 0.98764
  };

  const inventoryItem = {
    stock_level: 1.34,
    par_level: 15,
    wholesale_cost: 10,
    sale_price: 25
  };

  const placement = {
    volume: 1.23,
    order: 111
  };

  const placement2 = {
    volume: 9.23,
    order: 999
  };

  const report = {};

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
          area.venue_id = res.body._id;
          section.venue_id = res.body._id;
          product.venue_id = res.body._id;
          product2.venue_id = res.body._id;
          inventoryItem.venue_id = res.body._id;
          placement.venue_id = res.body._id;
          placement2.venue_id = res.body._id;
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

  describe('# POST /areas', () => {
    it('should create an area', (done) => {
      request(app)
        .post('/areas')
        .set(headers)
        .send(area)
        .expect(httpStatus.CREATED)
        .then((res) => {
          area._id = res.body._id;
          section.area_id = res.body._id;
          placement.area_id = res.body._id;
          placement2.area_id = res.body._id;
          done();
        })
        .catch(done);
    });
  });


  describe('# POST /sections', () => {
    it('should create a section', (done) => {
      request(app)
        .post('/sections')
        .set(headers)
        .send(section)
        .expect(httpStatus.CREATED)
        .then((res) => {
          section._id = res.body._id;
          placement.section_id = res.body._id;
          placement2.section_id = res.body._id;
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
        .then((res) => {
          inventoryItem._id = res.body._id;
          placement.inventory_item_id = res.body._id;
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /placement', () => {
    it('should create an placement item', (done) => {
      request(app)
        .post('/placements')
        .set(headers)
        .send(placement)
        .expect(httpStatus.CREATED)
        .then((res) => {
          placement._id = res.body._id;
          expect(res.body.volume).to.equal(placement.volume);
          expect(res.body.order).to.equal(placement.order);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports/live', () => {
    it('should get live report data', (done) => {
      request(app)
        .get('/reports/live')
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.data[0].volume).to.equal(placement.volume);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports/live', () => {
    it('should get live report data', (done) => {
      request(app)
        .get(`/reports/live?venue_id=${venue._id}`)
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.data[0].volume).to.equal(placement.volume);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /reports', () => {
    it('should create an report item', (done) => {
      request(app)
        .post('/reports')
        .set(headers)
        .send({
          venue_id: venue._id
        })
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body._id).to.be.a('string');
          report._id = res.body._id;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /placements', () => {
    it('should return placements with volume set to 0', (done) => {
      request(app)
        .get('/placements')
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0].volume).to.equal(0);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports', () => {
    it('should get list of reports', (done) => {
      request(app)
        .get(`/reports?venue_id=${venue._id}`)
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0].venue_id).to.equal(venue._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports', () => {
    it('should get list of reports', (done) => {
      request(app)
        .get('/reports')
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body[0].venue_id).to.equal(venue._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports/:report_id', () => {
    it('should get a report item', (done) => {
      request(app)
        .get(`/reports/${report._id}`)
        .set(headers)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body._id).to.equal(report._id);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /reports/:report_id/export', () => {
    it('should get an export of the report', (done) => {
      request(app)
        .get(`/reports/${report._id}/export`)
        .set(headers)
        .expect(httpStatus.OK)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /report/:report_id', () => {
    it('should remove the placement', (done) => {
      request(app)
        .delete(`/reports/${report._id}`)
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
