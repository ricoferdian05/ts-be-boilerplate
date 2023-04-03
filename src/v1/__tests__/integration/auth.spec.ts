import request from 'supertest';
import slug from 'slug';

import app from '@server/app';
import { GeneralEnum, ICity, ICountry, IProvince, IUser, ResponsibilityEnum, UserEnum } from '@definitions';
import { Auth } from '@v1-tests/fixtures/auth';
import { driverId, userInformation } from '@v1-tests/fixtures/user';
import { UserModel, ResponsibilityModel, CountryModel, CityModel, ProvinceModel, accessTypes } from '@models';
import { hashPassword, isMatchingPassword } from '@utils/password';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { Types } from 'mongoose';

const TEST_TIMEOUT_MS = 5000;

const DUMMY_PASSWORD = 'A@hzn.one';
const DUMMY_EMAIL_INTERNAL = 'dummyadmin@hzn.one';
const DUMMY_EMAIL_PROVIDER = 'provider@hzn.one';
const DUMMY_EMAIL_PROVIDER_INACTIVE = 'providerinactive@hzn.one';
const DUMMY_EMAIL_CUSTOMER_APPROVED = 'customer-approved@hzn.one';
const DUMMY_EMAIL_CUSTOMER_REJECTED = 'customer-rejected@hzn.one';
const DUMMY_EMAIL_SP_EMPLOYEE_ADMIN = 'sp-employee-active@hzn.one';
const DUMMY_EMAIL_SP_EMPLOYEE_VIEWER = 'sp-employee-inactive@hzn.one';

let user, userServiceProvider: IUser.IDataSchema;
let country: ICountry.IDataSchema;
let city: ICity.IDataSchema;
let province: IProvince.IDataSchema;

describe('Auth routes', () => {
  beforeEach(async () => {
    const provinceId = new Types.ObjectId();
    const countryId = new Types.ObjectId();

    const hashedPassword = await hashPassword(DUMMY_PASSWORD);
    const responsibilty = await ResponsibilityModel.create({
      formattedId: 'RESP0010',
      name: 'Admin',
      accessTypes: [ResponsibilityEnum.AccessType.CREATE],
      status: GeneralEnum.Status.ACTIVE,
      createdBy: userInformation,
    });

    [user, country, province, city] = await Promise.all([
      UserModel.create({
        name: 'Admin One',
        formattedId: 'ADM0011',
        email: DUMMY_EMAIL_INTERNAL,
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        phone: '081234567830',
        role: UserEnum.Role.INTERNAL,
        internal: {
          responsibility: responsibilty.id,
        },
        createdBy: userInformation,
        verifiedAt: 123,
      }),
      CountryModel.create({
        _id: countryId,
        name: 'Indonesia',
        code: 'ID',
        currencyIds: [],
        createdBy: userInformation,
      }),
      ProvinceModel.create({
        _id: provinceId,
        name: 'Banten',
        country: countryId,
        geoJsonId: 123,
        postalCodes: [],
      }),
      CityModel.create({
        name: 'Tangerang',
        province: provinceId,
        geoJsonId: 123,
        postalCodes: ['15100'],
      }),
    ]);

    userServiceProvider = await UserModel.create({
      name: 'Provider One Active',
      slug: slug('Service Provider One Inc.'),
      email: DUMMY_EMAIL_PROVIDER,
      password: hashedPassword,
      status: GeneralEnum.Status.ACTIVE,
      phone: '081234567810',
      role: UserEnum.Role.SERVICE_PROVIDER,
      type: UserEnum.UserType.COMPANY,
      formattedId: 'IDN0001',
      company: {
        name: 'Service Provider One Inc.',
        email: 'sp-one-inc@gmail.com',
        phone: '089123456789',
        taxType: UserEnum.TaxType.PKP,
        taxId: '123456600',
        businessLicense: '123456101',
        businessLicenseType: UserEnum.BusinessLicenseType.NIB,
        country: {
          id: country.id,
          name: country.name,
          code: country.code,
        },
        province: {
          id: province.id,
          name: province.name,
        },
        city: {
          id: city.id,
          name: city.name,
        },
        serviceTypes: GeneralEnum.ServiceType.LTL,
      },
      createdBy: userInformation,
      verifiedAt: 123,
    });

    await UserModel.insertMany([
      {
        name: 'Provider One InActive',
        slug: slug('Service Provider Inactive Inc.'),
        formattedId: 'IDN0004',
        email: DUMMY_EMAIL_PROVIDER_INACTIVE,
        password: hashedPassword,
        status: GeneralEnum.Status.INACTIVE,
        phone: '081234567810',
        role: UserEnum.Role.SERVICE_PROVIDER,
        type: UserEnum.UserType.COMPANY,
        company: {
          name: 'Service Provider Inactive Inc.',
          email: 'sp-one-inactive-inc@gmail.com',
          phone: '089123456789',
          taxType: UserEnum.TaxType.PKP,
          taxId: '123456701',
          businessLicense: '113456702',
          businessLicenseType: UserEnum.BusinessLicenseType.NIB,
          country: {
            id: country.id,
            name: country.name,
            code: country.code,
          },
          province: {
            id: province.id,
            name: province.name,
          },
          city: {
            id: city.id,
            name: city.name,
          },
          serviceTypes: GeneralEnum.ServiceType.LTL,
        },
        createdBy: userInformation,
        verifiedAt: 123,
      },
      {
        parents: [
          {
            user: userServiceProvider.id,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: 123,
          },
        ],
        name: 'Customer One Approved',
        formattedId: 'CSR0004',
        email: DUMMY_EMAIL_CUSTOMER_APPROVED,
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        phone: '081234567810',
        role: UserEnum.Role.CUSTOMER,
        type: UserEnum.UserType.INDIVIDUAL,
        createdBy: userInformation,
        verifiedAt: 123,
      },
      {
        _id: driverId,
        parents: [
          {
            user: userServiceProvider.id,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: 123,
          },
        ],
        name: 'Driver One',
        phone: '081214567810',
        formattedId: 'IDN0001-WKR000001',
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        role: UserEnum.Role.DRIVER,
        pin: '123456',
        driver: {
          nationalId: '12813361776211',
          address: 'jl test',
          dateOfBirth: '1996-12-01',
          bloodType: UserEnum.BloodType.A,
          employeeType: UserEnum.EmployeeType.Own,
          outsourcedCompany: 'PT asdfasf',
          licenseType: UserEnum.DriverLicenseType.B2,
          licenseExpiryDate: '2027-01-12',
          driverLicenseId: '1234666111223172',
        },
        createdBy: userInformation,
        verifiedAt: 123,
      },
      {
        parents: [
          {
            user: userServiceProvider.id,
            approvalStatus: UserEnum.ApprovalStatus.REJECTED,
            approvalStatusAt: 123,
          },
        ],
        name: 'Customer One Rejected',
        formattedId: 'CSR0005',
        email: DUMMY_EMAIL_CUSTOMER_REJECTED,
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        phone: '081234567810',
        role: UserEnum.Role.CUSTOMER,
        type: UserEnum.UserType.INDIVIDUAL,
        createdBy: userInformation,
        verifiedAt: 123,
      },
      {
        parents: [
          {
            user: userServiceProvider.id,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: 123,
          },
        ],
        name: 'SP Employee ADMIN',
        formattedId: `${userServiceProvider.formattedId}-ADN0001`,
        email: DUMMY_EMAIL_SP_EMPLOYEE_ADMIN,
        SPEmployee: {
          accessTypes: accessTypes,
        },
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        phone: '081234567111',
        role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
        createdBy: userInformation,
        verifiedAt: 123,
      },
      {
        parents: [
          {
            user: userServiceProvider.id,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: 123,
          },
        ],
        name: 'SP Employee VIEWER',
        formattedId: `${userServiceProvider.formattedId}-ADN0002`,
        email: DUMMY_EMAIL_SP_EMPLOYEE_VIEWER,
        SPEmployee: {
          accessTypes: [ResponsibilityEnum.AccessType.READ],
        },
        password: hashedPassword,
        status: GeneralEnum.Status.ACTIVE,
        phone: '081234567112',
        role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
        createdBy: userInformation,
        verifiedAt: 123,
      },
    ]);
  });

  describe('POST /v1/login', () => {
    const loginEndpoint = '/v1/login';

    const loginRequestBody = {
      email: DUMMY_EMAIL_INTERNAL,
      password: DUMMY_PASSWORD,
    };

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
      'login with wrong password',
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

    it(
      'login with service provider that not verified',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_PROVIDER_INACTIVE,
          });

        expectHaveFailedMeta(body, "Email and password doesn't match");

        expect(status).toEqual(401);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'successfully login with service provider',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_PROVIDER,
          });

        expectHaveSuccessMeta(body, 'Successfully logged in');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'successfully login with uppercase email service provider ',
      async () => {
        await UserModel.ensureIndexes();

        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_PROVIDER.toUpperCase(),
          });

        expectHaveSuccessMeta(body, 'Successfully logged in');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'successfully login with internal',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .set(Auth.adminAuthHeader())
          .send(loginRequestBody);

        expectHaveSuccessMeta(body, 'Successfully logged in');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'successfully login with approved customer',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_CUSTOMER_APPROVED,
            serviceProviderSlug: userServiceProvider.slug,
          });

        expectHaveSuccessMeta(body, 'Successfully logged in');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'login with rejected customer',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_CUSTOMER_REJECTED,
            serviceProviderSlug: userServiceProvider.slug,
          });

        expectHaveFailedMeta(body, "Email and password doesn't match");

        expect(status).toEqual(401);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'login with SP employee ADMIN',
      async () => {
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_SP_EMPLOYEE_ADMIN,
          });

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
        const { status, body } = await request(app)
          .post(loginEndpoint)
          .send({
            ...loginRequestBody,
            email: DUMMY_EMAIL_SP_EMPLOYEE_VIEWER,
          });

        expectHaveSuccessMeta(body, 'Successfully logged in');
        expect(body.data.SPEmployee).toEqual(expect.any(Object));
        expect(body.data.SPEmployee.responsibility.name).toEqual(UserEnum.SPEmployeeResponsibility.VIEWER);
        expect(body.data.SPEmployee.responsibility.accessTypes[0]).toEqual(ResponsibilityEnum.AccessType.READ);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('POST /v1/exchange-token', () => {
    const exchangeTokenEndpoint = '/v1/exchange-token';

    it(
      'responds with 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app).post(exchangeTokenEndpoint).send({
          firebaseTokenId: undefined,
        });

        expectHaveFailedMeta(body, '"firebaseTokenId" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a firebase token id is wrong',
      async () => {
        const { status, body } = await request(app).post(exchangeTokenEndpoint).send({
          firebaseTokenId: '0',
        });

        expectHaveFailedMeta(body, 'Invalid firebase token');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 if a firebase token id is correct and hasPin',
      async () => {
        const { status, body } = await request(app).post(exchangeTokenEndpoint).send({
          firebaseTokenId: '123',
        });

        expectHaveSuccessMeta(body, 'Successfully exchanged token');

        expect(status).toEqual(200);
        expect(body.data).toHaveProperty('role', UserEnum.Role.DRIVER);
        expect(body.data).toHaveProperty('name', 'Driver One');
        expect(body.data).toHaveProperty('hasPin', true);
        expect(body.data).toHaveProperty('phone', '081214567810');
        expect(body.data).toHaveProperty('formattedId', 'IDN0001-WKR000001');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 if a firebase token id is correct and hasPin is false',
      async () => {
        await UserModel.updateOne({ _id: driverId }, { $unset: { pin: '' } });

        const { status, body } = await request(app).post(exchangeTokenEndpoint).send({
          firebaseTokenId: '123',
        });

        expectHaveSuccessMeta(body, 'Successfully exchanged token');

        expect(status).toEqual(200);
        expect(body.data).toHaveProperty('role', UserEnum.Role.DRIVER);
        expect(body.data).toHaveProperty('name', 'Driver One');
        expect(body.data).toHaveProperty('hasPin', false);
        expect(body.data).toHaveProperty('phone', '081214567810');
        expect(body.data).toHaveProperty('formattedId', 'IDN0001-WKR000001');
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('POST /v1/reset-password/emails', () => {
    const endpoint = '/v1/reset-password/emails';

    it(
      'returns 200 and successfully request reset password if email belongs to a user',
      async () => {
        const { status, body } = await request(app).post(endpoint).send({
          email: user.email,
        });

        expectHaveSuccessMeta(body, 'Successfully request reset password.');
        expect(body.data).toBeNull();
        expect(status).toEqual(200);

        const resetUser = await UserModel.findById(user._id, 'resetPasswordToken').lean();
        expect(resetUser.resetPasswordToken).toEqual(expect.any(String));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 200 and does nothing if email does not belong to a user',
      async () => {
        const { status, body } = await request(app).post(endpoint).send({
          email: 'randomperson@email.com',
        });

        expectHaveSuccessMeta(body, 'Successfully request reset password.');
        expect(body.data).toBeNull();
        expect(status).toEqual(200);

        const usersWithResetPasswordTokenCount = await UserModel.countDocuments({
          resetPasswordToken: { $exists: true },
        });
        expect(usersWithResetPasswordTokenCount).toEqual(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 400 if email field is not given',
      async () => {
        const { status, body } = await request(app).post(endpoint);

        expectHaveFailedMeta(body, '"email" is required');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('PATCH /v1/reset-password', () => {
    const endpoint = '/v1/reset-password';
    const token = 'randomtoken';
    const password = 'New-password1';

    it(
      'returns 200 and password successfully changed',
      async () => {
        await user.updateOne({ resetPasswordToken: token });

        const { status, body } = await request(app).patch(endpoint).send({ token, password });

        expectHaveSuccessMeta(body, 'Successfully reset password');
        expect(body.data).toBeNull();
        expect(status).toEqual(200);

        const resetUser = await UserModel.findById(user._id).lean();
        expect(await isMatchingPassword(password, resetUser.password)).toBe(true);
        expect(resetUser.resetPasswordToken).toBeUndefined();
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app).patch(endpoint).send({ password });

        expectHaveFailedMeta(body, '"token" is required');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 404 if token does not match any user',
      async () => {
        await user.updateOne({ resetPasswordToken: `not${token}` });

        const { status, body } = await request(app).patch(endpoint).send({ token, password });

        expectHaveFailedMeta(body, 'Token not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 404 if user has not requested for a password reset',
      async () => {
        // when user has not request for a password reset, the token should not be in the database
        const { status, body } = await request(app).patch(endpoint).send({ token, password });

        expectHaveFailedMeta(body, 'Token not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
