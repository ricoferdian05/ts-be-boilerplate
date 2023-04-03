import request from 'supertest';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import { UserEnum, GeneralEnum } from '@definitions';
import { UserModel } from '@models';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { constructUserServiceProviderFields, serviceProviderId } from '@v1-tests/fixtures/user';

describe('User routes', () => {
  describe('POST /v1/users/employees', () => {
    const endpoint = '/v1/users/employees';
    const requestBody = {
      name: 'Playstore Tester John Ridwan',
      email: 'johnWick@gmail.com',
      password: '123qwe123QWE!2',
      phone: '6281234567890',
      status: 'ACTIVE',
      responsibility: 'ADMIN',
    };

    beforeEach(async () => {
      await UserModel.create(
        constructUserServiceProviderFields({
          _id: serviceProviderId,
          name: 'First Service Provider Options',
          slug: 'TEST-1234',
          phone: '01234567121',
          email: 'user1@serviceprovider.com',
          formattedId: 'IDN0001',
          status: GeneralEnum.Status.ACTIVE,
          company: {
            name: 'First Service Provider Company',
            email: 'sp-one-inc@gmail.com',
            taxId: '123256708',
            businessLicense: '123456711',
          },
        }),
      );
    });

    it(
      'sucessfully create new SP Employee user and responds with 201 as ADMIN',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send(requestBody);

        expectHaveSuccessMeta(body, 'Successfully created a service provider employee');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);

        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE }).lean();
        expect(user.name).toEqual(requestBody.name);
        expect(user.email).toEqual(requestBody.email.toLowerCase());
        expect(user.phone).toEqual(requestBody.phone);
        expect(user.status).toEqual(requestBody.status);
        expect(user.SPEmployee.accessTypes).toEqual(['CREATE', 'READ', 'UPDATE']);
        expect(user).toHaveProperty('resetPasswordToken', expect.any(String));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new SP Employee user and responds with 201 as VIEWER',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({ ...requestBody, responsibility: 'VIEWER' });

        expectHaveSuccessMeta(body, 'Successfully created a service provider employee');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);

        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE }).lean();
        expect(user.name).toEqual(requestBody.name);
        expect(user.email).toEqual(requestBody.email.toLowerCase());
        expect(user.phone).toEqual(requestBody.phone);
        expect(user.status).toEqual(requestBody.status);
        expect(user.SPEmployee.accessTypes).toEqual(['READ']);
        expect(user).toHaveProperty('resetPasswordToken', expect.any(String));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new SP employee user and responds with 201 and custom formatted Id',
      async () => {
        const formattedId = 'ABC111';
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({ ...requestBody, formattedId: formattedId });

        expectHaveSuccessMeta(body, 'Successfully created a service provider employee');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);

        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE }).lean();
        expect(user.formattedId).toContain(formattedId);
        expect(user.name).toEqual(requestBody.name);
        expect(user.email).toEqual(requestBody.email.toLowerCase());
        expect(user.phone).toEqual(requestBody.phone);
        expect(user.status).toEqual(requestBody.status);
        expect(user.SPEmployee.accessTypes).toEqual(['CREATE', 'READ', 'UPDATE']);
        expect(user).toHaveProperty('resetPasswordToken', expect.any(String));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({
            ...requestBody,
            name: undefined,
          });

        expectHaveFailedMeta(body, '"name" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if given status is not valid',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({
            ...requestBody,
            status: 'randomstatus',
          });

        expectHaveFailedMeta(body, '"status" must be one of [ACTIVE, INACTIVE]');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
