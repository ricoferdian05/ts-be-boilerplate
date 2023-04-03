import request from 'supertest';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import { UserEnum, GeneralEnum, ResponsibilityEnum, IResponsibility } from '@definitions';
import { UserModel, ResponsibilityModel } from '@models';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { constructUserInternalFields, userInformation } from '@v1-tests/fixtures/user';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';

describe('User routes', () => {
  describe('POST /v1/users/internals', () => {
    const endpoint = '/v1/users/internals';

    const responsibilityFormattedId = 'RESP0001';
    const requestBody = {
      name: 'Admin One',
      email: 'dummyadmin@hzn.one',
      password: 'A@gmail.com',
      status: GeneralEnum.Status.ACTIVE,
      phone: '081234567890',
      responsibility: responsibilityFormattedId,
    };

    let responsibility: IResponsibility.IDataSchema;

    beforeEach(async () => {
      responsibility = await ResponsibilityModel.create({
        formattedId: responsibilityFormattedId,
        name: 'Admin',
        accessTypes: [ResponsibilityEnum.AccessType.CREATE],
        status: GeneralEnum.Status.ACTIVE,
        createdBy: userInformation,
      });
    });

    it(
      'sucessfully create new internal user and responds with 201',
      async () => {
        const { status, body } = await request(app).post(endpoint).set(Auth.adminAuthHeader()).send(requestBody);

        expectHaveSuccessMeta(body, 'Successfully created an internal user');
        expect(body).toHaveProperty('data', null);
        expect(status).toEqual(201);

        const newUser = await UserModel.findOne({ email: requestBody.email }).lean();
        expect(newUser.role).toEqual(UserEnum.Role.INTERNAL);
        expect(newUser.source).toEqual(UserEnum.UserSource.TMS);
        expect(newUser.name).toEqual(requestBody.name);
        expect(newUser.status).toEqual(requestBody.status);
        expect(newUser.phone).toEqual(requestBody.phone);
        expect(newUser.internal).toEqual(expect.any(Object));
        expect(newUser.internal.responsibility.toString()).toEqual(responsibility._id.toString());
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new internal user from Marketplace Delivery',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            userSource: UserEnum.UserSource['Marketplace Delivery'],
          });

        expectHaveSuccessMeta(body, 'Successfully created an internal user');
        expect(body).toHaveProperty('data', null);
        expect(status).toEqual(201);

        const newUser = await UserModel.findOne({ email: requestBody.email }).lean();
        expect(newUser.role).toEqual(UserEnum.Role.INTERNAL);
        expect(newUser.source).toEqual(UserEnum.UserSource['Marketplace Delivery']);
        expect(newUser.name).toEqual(requestBody.name);
        expect(newUser.status).toEqual(requestBody.status);
        expect(newUser.phone).toEqual(requestBody.phone);
        expect(newUser.internal).toEqual(expect.any(Object));
        expect(newUser.internal.responsibility.toString()).toEqual(responsibility._id.toString());
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
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
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            status: 'randomstatus',
          });

        expectHaveFailedMeta(body, '"status" must be one of [ACTIVE, INACTIVE]');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with responsibility is invalid',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            responsibility: 'randomresponsibility',
          });

        expectHaveFailedMeta(body, 'Responsibility "randomresponsibility" does not exist');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with duplicate email',
      async () => {
        await UserModel.create(
          constructUserInternalFields({
            email: requestBody.email,
          }),
        );

        const { status, body } = await request(app).post(endpoint).set(Auth.adminAuthHeader()).send(requestBody);

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
