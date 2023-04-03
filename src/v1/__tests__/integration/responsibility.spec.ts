import request from 'supertest';
import { ResponsibilityModel } from '@models';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import { expectHaveSuccessMeta, expectHaveFailedMeta, expectToHaveInvalidObjectIdParam } from '@tests/helper/general';
import { testRegexSearch } from '@tests/helper/regex';
import { GeneralEnum, ResponsibilityEnum } from '@server/definitions';

describe('Responsibilities routes', () => {
  const postPayload = {
    name: 'admin',
    accessTypes: [ResponsibilityEnum.AccessType.CREATE],
    status: GeneralEnum.Status.ACTIVE,
  };

  describe('POST /v1/responsibilities', () => {
    const endpoint = '/v1/responsibilities';

    it('responds with 200 and responsibility added', async () => {
      const { status, body } = await request(app).post(endpoint).set(Auth.adminAuthHeader()).send(postPayload);

      expectHaveSuccessMeta(body, 'Successfully created a new responsibility');
      expect(body).toHaveProperty('data', null);

      expect(status).toEqual(200);
      expect(await ResponsibilityModel.countDocuments({})).toEqual(1);
    });

    it('responds with 400 if a mandatory field [name] is not given', async () => {
      const { status, body } = await request(app)
        .post(endpoint)
        .set(Auth.adminAuthHeader())
        .send({
          ...postPayload,
          name: undefined,
        });

      expect(status).toEqual(400);
      expectHaveFailedMeta(body, '"name" is required');
    });

    it('responds with 400 if a mandatory field [accessTypes] is not given', async () => {
      const { status, body } = await request(app)
        .post(endpoint)
        .set(Auth.adminAuthHeader())
        .send({
          ...postPayload,
          accessTypes: undefined,
        });

      expect(status).toEqual(400);
      expectHaveFailedMeta(body, '"accessTypes" is required');
    });

    it('responds with 400 if a mandatory field [status] is not given', async () => {
      const { status, body } = await request(app)
        .post(endpoint)
        .set(Auth.adminAuthHeader())
        .send({
          ...postPayload,
          status: undefined,
        });

      expect(status).toEqual(400);
      expectHaveFailedMeta(body, '"status" is required');
    });
  });

  describe('GET /v1/responsibilities/:formattedResponsibilityId', () => {
    const endpoint = '/v1/responsibilities';

    beforeEach(async () => {
      await request(app).post(endpoint).set(Auth.adminAuthHeader()).send(postPayload);
    });

    it('responds with 200 and detail responsibility', async () => {
      const responsibilityId = 'RESP0001';
      const { status, body } = await request(app)
        .get(endpoint + '/' + responsibilityId)
        .set(Auth.adminAuthHeader());

      expect(status).toEqual(200);

      expectHaveSuccessMeta(body, 'Successfully get a responsibility');

      expect(body).toHaveProperty('data', expect.any(Object));
      expect(body.data).toHaveProperty('formattedId', responsibilityId);
    });

    it('responds with 404 and responsibility id not found', async () => {
      const responsibilityId = 'NOT-FOUND';

      const { status, body } = await request(app)
        .get(endpoint + '/' + responsibilityId)
        .set(Auth.adminAuthHeader());

      expect(status).toEqual(404);

      expectHaveFailedMeta(body, `Responsibility Id \"${responsibilityId}\" not found`);
    });
  });

  describe('GET /v1/responsibilities', () => {
    const endpoint = '/v1/responsibilities';

    beforeEach(async () => {
      await ResponsibilityModel.insertMany([
        {
          formattedId: 'RESP0001',
          name: 'admin',
          accessTypes: [ResponsibilityEnum.AccessType.CREATE],
          status: GeneralEnum.Status.ACTIVE,
          createdAt: '1641216732',
          createdBy: {
            userId: '61cad6a8cb39694efde0a99a',
            email: 'dummy@example.com',
            name: 'Dummy',
          },
        },
        {
          formattedId: 'RESP0002',
          name: 'user',
          accessTypes: [ResponsibilityEnum.AccessType.UPDATE],
          status: GeneralEnum.Status.ACTIVE,
          createdAt: '1641216732',
          createdBy: {
            userId: '61cad6a8cb39694efde0a99a',
            email: 'dummy@example.com',
            name: 'Dummy',
          },
        },
        {
          formattedId: 'RESP0001',
          name: 'developer',
          accessTypes: [ResponsibilityEnum.AccessType.DELETE],
          status: GeneralEnum.Status.INACTIVE,
          createdAt: '1641216732',
          createdBy: {
            userId: '61cad6a8cb39694efde0a99a',
            email: 'dummy@example.com',
            name: 'Dummy',
          },
        },
      ]);
    });

    testRegexSearch((search: string) => request(app).get(endpoint).set(Auth.adminAuthHeader()).query({ search }));

    it('responds with 200 and list of all responsibilities with no query', async () => {
      const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader());

      expect(status).toEqual(200);

      expectHaveSuccessMeta(body, 'Successfully get responsibility.');

      expect(body).toHaveProperty('data', expect.any(Object));
      expect(body.data.totalFilteredData).toEqual(3);
    });

    it('responds with 200 and list of all responsibilities with full query', async () => {
      const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
        search: 'admin',
        accessType: ResponsibilityEnum.AccessType.CREATE,
        status: GeneralEnum.Status.ACTIVE,
        page: 1,
        limit: 10,
      });

      expect(status).toEqual(200);

      expectHaveSuccessMeta(body, 'Successfully get responsibility.');

      expect(body).toHaveProperty('data', expect.any(Object));
      expect(body.data.totalFilteredData).toEqual(1);
    });

    it('responds with 400 if accessType it is not in accordance with', async () => {
      const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
        search: 'admin',
        accessType: 'CREATED',
        status: GeneralEnum.Status.ACTIVE,
        page: 1,
        limit: 10,
      });

      expect(status).toEqual(400);

      expectHaveFailedMeta(body, '"accessType" must be one of [CREATE, UPDATE, READ, DELETE]');
    });

    it('responds with 404 if responsibilities not found', async () => {
      const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
        search: 'creator',
        accessType: ResponsibilityEnum.AccessType.CREATE,
        status: GeneralEnum.Status.ACTIVE,
        page: 1,
        limit: 10,
      });

      expect(status).toEqual(404);

      expectHaveFailedMeta(body, 'No responsibility matched.');
    });
  });

  describe('PUT /v1/responsibilities/:responsibilityId', () => {
    const endpoint = '/v1/responsibilities';
    let putAllPayload = {
      name: 'updated admin',
      accessTypes: [ResponsibilityEnum.AccessType.CREATE],
      status: GeneralEnum.Status.INACTIVE,
    };

    beforeEach(async () => {
      await request(app).post(endpoint).set(Auth.adminAuthHeader()).send(postPayload);
    });

    it('responds with 200 and all field responsibility updated', async () => {
      const responsibility = await ResponsibilityModel.findOne().sort({ created_at: -1 });
      const responsibilityId = String(responsibility._id);

      const { status, body } = await request(app)
        .put(endpoint + '/' + responsibilityId)
        .set(Auth.adminAuthHeader())
        .send(putAllPayload);

      expectHaveSuccessMeta(body, 'Successfully modified a responsibility');
      expect(body).toHaveProperty('data', null);

      expect(status).toEqual(200);

      const updatedResponsibility = await ResponsibilityModel.findById(responsibilityId);
      expect(updatedResponsibility.name).toEqual(putAllPayload.name);
      expect(updatedResponsibility.accessTypes).toEqual(putAllPayload.accessTypes);
      expect(updatedResponsibility.status).toEqual(putAllPayload.status);
    });

    it('responds with 400 if ObjectId failed to cast for value', async () => {
      const responsibilityId = '61d3fb442c5ww62fcf812681';

      const { status, body } = await request(app)
        .put(endpoint + '/' + responsibilityId)
        .set(Auth.adminAuthHeader())
        .send(putAllPayload);

      expectToHaveInvalidObjectIdParam(body, 'responsiblityId');
      expect(status).toEqual(400);
    });

    it('responds with 404 if ObjectId not found on database', async () => {
      const responsibilityId = '61d3fb442c52262fcf812681';

      const { status, body } = await request(app)
        .put(endpoint + '/' + responsibilityId)
        .set(Auth.adminAuthHeader())
        .send(putAllPayload);

      expectHaveFailedMeta(body, `Responsibility _id "${responsibilityId}" not found`);
      expect(status).toEqual(404);
    });
  });
});
