import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { expect } from 'chai';
import app from '../../index';

describe('## Placement APIs', () => {
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
          section.venue_id = res.body._id;
          product.venue_id = res.body._id;
          inventoryItem.venue_id = res.body._id;
          placement.venue_id = res.body._id;
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
          section.area_id = res.body._id;
          placement.area_id = res.body._id;
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
        .then(res => {
          section._id = res.body._id;
          placement.section_id = res.body._id;
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
        .then(res => {
          placement._id = res.body._id;
          expect(res.body.volume).to.equal(placement.volume);
          expect(res.body.order).to.equal(placement.order);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /placement', () => {
    it('should get list of placements', (done) => {
      request(app)
        .get('/placements')
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body[0].volume).to.equal(placement.volume);
          expect(res.body[0].order).to.equal(placement.order);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /placement/:placement_id', () => {
    it('should get the placement item', (done) => {
      request(app)
        .get(`/placements/${placement._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.volume).to.equal(placement.volume);
          expect(res.body.order).to.equal(placement.order);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /placement/:placement_id', () => {
    it('should update the placement item', (done) => {
      request(app)
        .put(`/placements/${placement._id}`)
        .set(headers)
        .send({
          volume: 999,
          updated_at: new Date()
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(placement._id);
          expect(res.body.volume).to.equal(999);
          expect(res.body.venue_id).to.equal(placement.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /placement/:placement_id', () => {
    it('should not update placement because of a new version conflict', (done) => {
      request(app)
        .put(`/placements/${placement._id}`)
        .set(headers)
        .send({
          volume: 989,
          updated_at: new Date('2015-09-19T18:26:57.268Z')
        })
        .expect(httpStatus.CONFLICT)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /placements/', () => {
    it('should batch update placements', (done) => {
      placement.volume = 111;
      placement.updated_at = new Date();
      request(app)
        .put('/placements/')
        .set(headers)
        .send([placement])
        .expect(httpStatus.ACCEPTED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /placements/', () => {
    it('should not update placement because of a new version conflict', (done) => {
      placement.volume = 13;
      placement.updated_at = new Date('2015-09-19T18:26:57.268Z');
      request(app)
        .put('/placements/')
        .set(headers)
        .send([placement])
        .expect(httpStatus.ACCEPTED)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /placement/:placement_id', () => {
    it('should get the placement with new name from first batch update', (done) => {
      request(app)
        .get(`/placements/${placement._id}`)
        .set(headers)
        .send()
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body._id).to.equal(placement._id);
          expect(res.body.volume).to.equal(111);
          expect(res.body.venue_id).to.equal(placement.venue_id);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /placement/:placement_id', () => {
    it('should remove the placement', (done) => {
      request(app)
        .delete(`/placements/${placement._id}`)
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
