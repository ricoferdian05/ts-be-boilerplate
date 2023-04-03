import request from 'supertest';

import app from '@server/app';
import { GeneralEnum, IUser, ResponsibilityEnum, UserEnum } from '@definitions';
import {
  constructUserCustomerFields,
  constructUserDriverFields,
  constructUserInternalFields,
  constructUserServiceProviderFields,
  constructUserSPEmployeeFields,
} from '@v1-tests/fixtures/user';
import { UserModel, accessTypes, ResponsibilityModel } from '@models';
import { hashPassword } from '@utils/password';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { Types } from 'mongoose';
import { constructResponsibilityFields } from '../../fixtures/responsibility';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';

const TEST_TIMEOUT_MS = 5000;

describe('Auth routes', () => {
  describe('POST /v1/login', () => {
    const loginEndpoint = '/v1/login';

    let hashedPassword: string;

    const loginRequestBody = {
      email: 'sample-email@hzn.one',
      password: 'Password!123',
    };

    beforeEach(async () => {
      hashedPassword = await hashPassword(loginRequestBody.password);
    });

    it(
      'responds with 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            password: undefined,
          });

        expectHaveFailedMeta(body, '"password" is required');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds 401 if login with wrong password',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            password: '@HZN.one123',
          });

        expectHaveFailedMeta(body, "Email and password doesn't match");
        expect(status).toEqual(401);
      },
      TEST_TIMEOUT_MS,
    );

    describe('when service provider user logins', () => {
      it(
        'login with service provider that not verified',
        async () => {
          await UserModel.create(
            constructUserServiceProviderFields({
              formattedId: 'IDN0002',
              email: loginRequestBody.email,
              password: hashedPassword,
              status: GeneralEnum.Status.INACTIVE,
            }),
          );

          const { status, body } = await request(app).post(loginEndpoint).send(loginRequestBody);

          expectHaveFailedMeta(body, "Email and password doesn't match");
          expect(status).toEqual(401);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'successfully login with service provider',
        async () => {
          await UserModel.create(
            constructUserServiceProviderFields({
              email: loginRequestBody.email,
              password: hashedPassword,
              formattedId: 'IDN0002',
            }),
          );

          const { status, body } = await request(app).post(loginEndpoint).send(loginRequestBody);

          expectHaveSuccessMeta(body, 'Successfully logged in');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'successfully login with uppercase email service provider ',
        async () => {
          await UserModel.create(
            constructUserServiceProviderFields({
              email: loginRequestBody.email,
              password: hashedPassword,
              formattedId: 'IDN0002',
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              email: loginRequestBody.email.toUpperCase(),
            });

          expectHaveSuccessMeta(body, 'Successfully logged in');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('when internal user logins', () => {
      it(
        'successfully login with internal',
        async () => {
          const responsibilityId = new Types.ObjectId();
          await Promise.all([
            await UserModel.create(
              constructUserInternalFields({
                email: loginRequestBody.email,
                password: hashedPassword,
                internal: {
                  responsibility: responsibilityId,
                },
              }),
            ),
            await ResponsibilityModel.create(constructResponsibilityFields({ _id: responsibilityId })),
          ]);

          const { status, body } = await request(app).post(loginEndpoint).send(loginRequestBody);

          expectHaveSuccessMeta(body, 'Successfully logged in');
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'successfully login with internal even from different user source',
        async () => {
          const responsibilityId = new Types.ObjectId();
          await Promise.all([
            await UserModel.create(
              constructUserInternalFields({
                email: loginRequestBody.email,
                password: hashedPassword,
                internal: {
                  responsibility: responsibilityId,
                },
                source: UserEnum.UserSource.TMS,
              }),
            ),
            await ResponsibilityModel.create(constructResponsibilityFields({ _id: responsibilityId })),
          ]);

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              userSource: UserEnum.UserSource['Marketplace Delivery'],
            });

          expectHaveSuccessMeta(body, 'Successfully logged in');
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('when customer user logins', () => {
      let serviceProvider: IUser.IDataSchema;

      beforeEach(async () => {
        serviceProvider = await UserModel.create(constructUserServiceProviderFields());
      }, TEST_TIMEOUT_MS);

      it(
        'successfully login with approved customer',
        async () => {
          await UserModel.create(
            constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
              email: loginRequestBody.email,
              password: hashedPassword,
              parents: [
                {
                  user: serviceProvider._id,
                  approvalStatus: UserEnum.ApprovalStatus.APPROVED,
                  approvalStatusAt: getCurrentUnixTimestamp(),
                },
              ],
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              serviceProviderSlug: serviceProvider.slug,
            });

          expectHaveSuccessMeta(body, 'Successfully logged in');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'login with rejected customer',
        async () => {
          await UserModel.create(
            constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
              email: loginRequestBody.email,
              password: hashedPassword,
              parents: [
                {
                  user: serviceProvider._id,
                  approvalStatus: UserEnum.ApprovalStatus.REJECTED,
                },
              ],
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              serviceProviderSlug: serviceProvider.slug,
            });

          expectHaveFailedMeta(body, "Email and password doesn't match");

          expect(status).toEqual(401);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'successfully login with Marketplace Delivery customer without service provider slug',
        async () => {
          await UserModel.create(
            constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
              email: loginRequestBody.email,
              password: hashedPassword,
              parents: [],
              source: UserEnum.UserSource['Marketplace Delivery'],
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              userSource: UserEnum.UserSource['Marketplace Delivery'],
            });

          expectHaveSuccessMeta(body, 'Successfully logged in');
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Marketplace Delivery customer cannot login to TMS',
        async () => {
          await UserModel.create(
            constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
              email: loginRequestBody.email,
              password: hashedPassword,
              parents: [],
              source: UserEnum.UserSource['Marketplace Delivery'],
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              userSource: UserEnum.UserSource.TMS,
            });

          expectHaveFailedMeta(body, "Email and password doesn't match");
          expect(status).toEqual(401);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'TMS customer cannot login to Marketplace Delivery',
        async () => {
          await UserModel.create(
            constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
              email: loginRequestBody.email,
              password: hashedPassword,
              parents: [
                {
                  user: serviceProvider._id,
                  approvalStatus: UserEnum.ApprovalStatus.APPROVED,
                  approvalStatusAt: getCurrentUnixTimestamp(),
                },
              ],
              source: UserEnum.UserSource.TMS,
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              userSource: UserEnum.UserSource['Marketplace Delivery'],
              serviceProviderSlug: serviceProvider.slug,
            });

          expectHaveFailedMeta(body, "Email and password doesn't match");
          expect(status).toEqual(401);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('when service provider employee user logins', () => {
      it(
        'login with SP employee ADMIN',
        async () => {
          await UserModel.create(
            constructUserSPEmployeeFields({
              email: loginRequestBody.email,
              password: hashedPassword,
              SPEmployee: { accessTypes },
            }),
          );

          const { status, body } = await request(app).post(loginEndpoint).send(loginRequestBody);

          expectHaveSuccessMeta(body, 'Successfully logged in');
          expect(body.data.SPEmployee).toEqual(expect.any(Object));
          expect(body.data.SPEmployee.responsibility.name).toEqual(UserEnum.SPEmployeeResponsibility.ADMIN);
          expect(body.data.SPEmployee.responsibility.accessTypes.length).toEqual(accessTypes.length);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'login with SP employee VIEWER',
        async () => {
          await UserModel.create(
            constructUserSPEmployeeFields({
              email: loginRequestBody.email,
              password: hashedPassword,
              SPEmployee: { accessTypes: [ResponsibilityEnum.AccessType.READ] },
            }),
          );

          const { status, body } = await request(app).post(loginEndpoint).send(loginRequestBody);

          expectHaveSuccessMeta(body, 'Successfully logged in');
          expect(body.data.SPEmployee).toEqual(expect.any(Object));
          expect(body.data.SPEmployee.responsibility.name).toEqual(UserEnum.SPEmployeeResponsibility.VIEWER);
          expect(body.data.SPEmployee.responsibility.accessTypes[0]).toEqual(ResponsibilityEnum.AccessType.READ);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('when driver user logins', () => {
      it(
        'fails to login with driver user',
        async () => {
          await UserModel.create(
            constructUserDriverFields({
              email: loginRequestBody.email, // normally DRIVER user does not have an email
            }),
          );

          const { status, body } = await request(app)
            .post(loginEndpoint)
            .send({
              ...loginRequestBody,
              userSource: UserEnum.UserSource.TMS,
            });

          expectHaveFailedMeta(body, "Email and password doesn't match");
          expect(status).toEqual(401);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });
});
