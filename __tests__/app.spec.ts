import app from '@server/app';
import httpStatus from 'http-status';
import request from 'supertest';

describe('GET /', () => {
  it('responds with code 200', async () => {
    await request(app).get('/').expect(httpStatus.OK);
  });
});

describe('Unknown API Request', () => {
  it('responds with code 404', async () => {
    await request(app).get('/test').expect(httpStatus.NOT_FOUND);
  });
});
