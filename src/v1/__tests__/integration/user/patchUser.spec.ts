import slug from 'slug';
import request from 'supertest';
import { Types } from 'mongoose';

import app from '@server/app';
import { sendEmail } from '@config/mail';
import { Auth, serviceProviderTokenData } from '@v1-tests/fixtures/auth';
import { ICountry, IResponsibility, IProvince, ICity, GeneralEnum } from '@definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { UserModel, ResponsibilityModel, CountryModel, ProvinceModel, CityModel, CustomerGroupModel } from '@models';
import { hashPassword, isMatchingPassword } from '@server/utils/password';
import { expectHaveFailedMeta, expectHaveSuccessMeta, expectToHaveInvalidObjectIdParam } from '@tests/helper/general';
import {
  customerCompanyId,
  customerIndividualId,
  driverId,
  SPEmployeeId,
  internalId,
  serviceProviderId,
  userInformation,
} from '@v1-tests/fixtures/user';
import httpStatus from 'http-status';
import { constructCustomerGroupFields } from '@v1-tests/fixtures/customer-group';

const TEST_TIMEOUT_MS = 5000;

let responsibility: IResponsibility.IDataSchema;
let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;

jest.mock('@config/mail'); // mocked to enable test with toHaveBeenCalled()

describe('User routes', () => {
  beforeEach(async () => {
    const provinceId = new Types.ObjectId();
    const countryId = new Types.ObjectId();

    [responsibility, country, province, city] = await Promise.all([
      ResponsibilityModel.create({
        formattedId: 'RESP0001',
        name: 'Admin',
        accessTypes: ['CREATE'],
        status: 'ACTIVE',
        createdBy: userInformation,
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
  });

  describe('PATCH /v1/users/:userId', () => {
    const endpoint = (userId) => `/v1/users/${userId}`;
    const customerCompanySecondId = new Types.ObjectId();

    const companyDocument = {
      businessLicenseType: 'SIUP',
      businessLicense: '123456789',
    };
    const taxInformation = {
      taxType: 'NON-PKP',
      taxId: '12345678',
    };

    beforeEach(async () => {
      await UserModel.insertMany([
        {
          _id: internalId,
          formattedId: 'ADM0001',
          name: 'First Admin',
          email: 'internalone@hzn.one',
          password: await hashPassword('A@hzn.one123'),
          status: 'ACTIVE',
          phone: '081234567890',
          role: 'INTERNAL',
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          _id: serviceProviderId.toString(),
          name: 'First Provider',
          slug: slug('Service Provider One Inc.'),
          email: 'user@serviceprovider.com',
          password: 'randomstring',
          status: 'INACTIVE',
          phone: '081234567810',
          role: 'SERVICE_PROVIDER',
          type: 'COMPANY',
          formattedId: 'IDN0001',
          company: {
            name: 'Service Provider One Inc.',
            email: 'company@serviceprovider.com',
            phone: '089123456789',
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
            serviceTypes: [GeneralEnum.ServiceType.LTL],
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: customerCompanyId.toString(),
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'PENDING',
            },
          ],
          name: 'First Company Customer',
          email: 'user@company-customer.com',
          password: 'randomstring',
          status: 'ACTIVE',
          phone: '081234567810',
          role: 'CUSTOMER',
          type: 'COMPANY',
          formattedId: 'CSR0001',
          company: {
            name: 'Service Provider One Inc.',
            email: 'admin@company-customer.com',
            phone: '089123456789',
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
            serviceTypes: [GeneralEnum.ServiceType.LTL],
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: customerIndividualId.toString(),
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'First Individual Customer',
          email: 'user@individual-customer.com',
          password: 'randomstring',
          status: 'ACTIVE',
          phone: '081234567810',
          role: 'CUSTOMER',
          type: 'INDIVIDUAL',
          formattedId: 'CSR0002',
          individual: {
            country: {
              id: country.id,
              code: country.code,
              name: country.name,
            },
            province: {
              id: province.id,
              name: province.name,
            },
            city: {
              id: city.id,
              name: city.name,
            },
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: driverId,
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'John',
          email: 'driver@gmail.com',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: 'DRIVER',
          formattedId: 'WKR00100',
          driver: {
            nationalId: '12343333',
            address: 'jl keluar',
            dateOfBirth: '1996-11-01',
            bloodType: 'A',
            employeeType: 'Own',
            licenseType: 'B2',
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: '1234567890123456',
            isAvailable: false,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          _id: SPEmployeeId,
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'John Wick',
          email: 'spemployee@gmail.com',
          password: 'password',
          status: 'ACTIVE',
          phone: '08123456222',
          role: 'SERVICE_PROVIDER_EMPLOYEE',
          SPEmployee: {
            accessTypes: ['READ'],
          },
          formattedId: 'IDN0003-ABC2111',
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          _id: customerCompanySecondId,
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'PENDING',
            },
          ],
          name: 'Second Company Customer',
          email: 'user@second-company-customer.com',
          password: 'randomstring',
          status: 'INACTIVE',
          phone: '081234567222',
          role: 'CUSTOMER',
          type: 'COMPANY',
          formattedId: 'CSR0005',
          company: {
            name: 'Service Provider Second Inc.',
            email: 'admin@second-company-customer.com',
            phone: '089123456769',
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
            serviceTypes: [GeneralEnum.ServiceType.LTL],
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
      ]);
    });

    it(
      "responds with 200 and updates user's password",
      async () => {
        const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({
          oldPassword: 'A@hzn.one123',
          newPassword: 'A@hzn.one123new',
        });

        expectHaveSuccessMeta(body, 'Successfully modified a user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const user = await UserModel.findOne({ _id: internalId }).lean();
        expect(await isMatchingPassword('A@hzn.one123new', user.password)).toEqual(true);
        expect(user.updatedAt).toEqual(expect.any(Number));
        expect(user).toHaveProperty('updatedBy', expect.any(Object));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 if user id is invalid',
      async () => {
        const randomUserId = new Types.ObjectId();

        const { status, body } = await request(app).patch(endpoint(randomUserId)).set(Auth.adminAuthHeader()).send({
          status: 'INACTIVE',
        });

        expectHaveFailedMeta(body, 'User not found');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 if user id was deleted',
      async () => {
        // soft delete the user first
        await UserModel.updateOne({ _id: internalId }, { deletedAt: getCurrentUnixTimestamp() });

        const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({
          status: 'INACTIVE',
        });

        expectHaveFailedMeta(body, 'User not found');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if user id is not a valid object id',
      async () => {
        const randomUserId = 'randomid';

        const { status, body } = await request(app).patch(endpoint(randomUserId)).set(Auth.adminAuthHeader()).send({
          status: 'INACTIVE',
        });

        expectToHaveInvalidObjectIdParam(body, 'userId');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if body is empty',
      async () => {
        const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({});

        expectHaveFailedMeta(body, '"body" must have at least 1 key');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if new email is not unique',
      async () => {
        const email = 'newinternal@hzn.one';
        await UserModel.create({
          formattedId: 'ADM0002',
          name: 'First Admin',
          email,
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: 'INTERNAL',
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        });

        const { status, body } = await request(app)
          .patch(endpoint(internalId))
          .set(Auth.adminAuthHeader())
          .send({ email });

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if old password does not match',
      async () => {
        const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({
          oldPassword: 'A@hzn.one123a',
          newPassword: 'A@hzn.one123new',
        });

        expectHaveFailedMeta(body, 'Password does not match');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    describe('edits an internal user', () => {
      it(
        'Successfully edit internal by internal account',
        async () => {
          const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({
            status: 'INACTIVE',
            name: 'Internal User Updated',
            email: 'newemail@hzn.one',
            phone: '081123334444',
          });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(httpStatus.OK);

          const user = await UserModel.findOne({ _id: internalId }).lean();
          expect(user.status).toEqual('INACTIVE');
          expect(user.name).toEqual('Internal User Updated');
          expect(user.updatedAt).toEqual(expect.any(Number));
          expect(user).toHaveProperty('updatedBy', expect.any(Object));
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully modified property inside object like internal.responsibility with form-data',
        async () => {
          const responsibility = await ResponsibilityModel.create({
            formattedId: 'RESP0002',
            name: 'Admin',
            accessTypes: ['CREATE'],
            status: 'ACTIVE',
            createdBy: userInformation,
          });

          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.adminAuthHeader())
            .field('internal[responsibility]', 'RESP0002');

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          const user = await UserModel.findById(internalId).lean();
          expect(user.internal.responsibility.toString()).toEqual(responsibility.id);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit internal by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              status: 'ACTIVE',
              name: 'Internal User Updated',
            });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit internal by driver account',
        async () => {
          const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.driverAuthHeader()).send({
            status: 'ACTIVE',
            name: 'Internal User Updated',
          });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit internal by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.customerCompanyAuthHeader())
            .send({
              status: 'ACTIVE',
              name: 'Internal User Updated',
            });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "responds with 200 and updates user's internal information",
        async () => {
          const newReponsibility = await ResponsibilityModel.create({
            formattedId: 'RESP0002',
            name: 'Admin',
            accessTypes: ['CREATE'],
            status: 'ACTIVE',
            createdBy: userInformation,
          });

          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.adminAuthHeader())
            .send({
              internal: {
                responsibility: 'RESP0002',
              },
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(200);

          const user = await UserModel.findById(internalId).lean();
          expect(user.internal).toHaveProperty('responsibility', newReponsibility._id);
          expect(user.internal).toHaveProperty('updatedAt', expect.any(Number));
          expect(user.internal).toHaveProperty('updatedBy', expect.any(Object));
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 with empty internal',
        async () => {
          const { status, body } = await request(app).patch(endpoint(internalId)).set(Auth.adminAuthHeader()).send({
            internal: {},
          });

          expectHaveFailedMeta(body, '"responsibility" is required');

          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 with non-existent responsibility id',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.adminAuthHeader())
            .send({
              internal: {
                responsibility: 'RESP0002',
              },
            });

          expectHaveFailedMeta(body, 'Responsibility "RESP0002" does not exist');

          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 with deleted responsibility',
        async () => {
          // create a deleted responsibility first
          await ResponsibilityModel.create({
            formattedId: 'RESP0002',
            name: 'Admin',
            accessTypes: ['CREATE'],
            status: 'ACTIVE',
            createdBy: userInformation,
            deletedAt: getCurrentUnixTimestamp(),
          });

          const { status, body } = await request(app)
            .patch(endpoint(internalId))
            .set(Auth.adminAuthHeader())
            .send({
              internal: {
                responsibility: 'RESP0002',
              },
            });

          expectHaveFailedMeta(body, 'Responsibility "RESP0002" does not exist');

          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('edits a service provider user', () => {
      it(
        'Successfully edit service provider by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              name: 'Service Provider User Updated',
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(status).toEqual(httpStatus.OK);

          const user = await UserModel.findOne({ _id: serviceProviderId }).lean();
          expect(user.name).toEqual('Service Provider User Updated');
          expect(user.updatedAt).toEqual(expect.any(Number));
          expect(user).toHaveProperty('updatedBy', expect.any(Object));
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Successfully edit service provider by internal account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              status: 'INACTIVE',
              name: 'Service Provider User Updated',
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(status).toEqual(httpStatus.OK);

          const user = await UserModel.findOne({ _id: serviceProviderId }).lean();
          expect(user.status).toEqual('INACTIVE');
          expect(user.name).toEqual('Service Provider User Updated');
          expect(user.updatedAt).toEqual(expect.any(Number));
          expect(user).toHaveProperty('updatedBy', expect.any(Object));
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 when send invalid postal code',
        async () => {
          const companyBody = {
            name: 'New Service Provider Name',
            email: 'contact@serviceprovider.com',
            phone: '081234567890',
            postalCode: '15810',
            address: 'Jl. Khayangan No. 9',
            countryId: country.id,
            provinceId: province.id,
            cityId: city.id,
            ...companyDocument,
            ...taxInformation,
            serviceTypes: [GeneralEnum.ServiceType.FTL, GeneralEnum.ServiceType.LTL],
          };

          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({ company: companyBody });

          expectHaveFailedMeta(body, 'Invalid postal code');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully modified property inside object like company.address with form-data',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .field('company[address]', 'new address')
            .field('company[taxType]', 'PKP')
            .field('company[taxId]', '222222222')
            .field('company[businessLicense]', '111111111')
            .field('company[businessLicenseType]', 'SIUP');

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          const user = await UserModel.findById(serviceProviderId).lean();
          expect(user.company.address).toEqual('new address');
          expect(user.company.taxType).toEqual('PKP');
          expect(user.company.taxId).toEqual('222222222');
          expect(user.company.businessLicense).toEqual('111111111');
          expect(user.company.businessLicenseType).toEqual('SIUP');
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "responds with 200 and updates user's company information",
        async () => {
          const companyBody = {
            name: 'New Service Provider Name',
            email: 'contact@serviceprovider.com',
            phone: '081234567890',
            postalCode: '15110',
            address: 'Jl. Khayangan No. 9',
            countryId: country.id,
            provinceId: province.id,
            cityId: city.id,
            ...companyDocument,
            ...taxInformation,
            serviceTypes: [GeneralEnum.ServiceType.FTL, GeneralEnum.ServiceType.LTL],
          };

          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({ company: companyBody });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          expect(sendEmail).not.toHaveBeenCalled();

          const user = await UserModel.findById(serviceProviderId).lean();
          expect(user.company.name).toEqual(companyBody.name);
          expect(user.slug).toEqual(slug(companyBody.name)); // company's name is changed, therefore the slug is changed too
          expect(user.company.email).toEqual(companyBody.email);
          expect(user.company.phone).toEqual(companyBody.phone);
          expect(user.company.postalCode).toEqual(companyBody.postalCode);
          expect(user.company.address).toEqual(companyBody.address);
          expect(user.company.country.id.toString()).toEqual(country.id.toString());
          expect(user.company.country.name).toEqual(country.name);
          expect(user.company.province.name).toEqual(province.name);
          expect(user.company.city.name).toEqual(city.name);
          expect(user.company.businessLicenseType).toEqual(companyBody.businessLicenseType);
          expect(user.company.businessLicense).toEqual(companyBody.businessLicense);
          expect(user.company.taxType).toEqual(companyBody.taxType);
          expect(user.company.taxId).toEqual(companyBody.taxId);
          expect(user.company.serviceTypes).toEqual(companyBody.serviceTypes);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sends approval email when status is updated from INACTIVE to ACTIVE',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({ status: 'ACTIVE' });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(status).toEqual(200);

          expect(sendEmail).toHaveBeenCalled();
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Successfully edit service provider community code by internal account',
        async () => {
          const companyBody = {
            name: 'New Service Provider Name',
            email: 'contact@serviceprovider.com',
            phone: '081234567890',
            postalCode: '15110',
            address: 'Jl. Khayangan No. 9',
            countryId: country.id,
            provinceId: province.id,
            cityId: city.id,
            communityCode: 'sp4',
            ...companyDocument,
            ...taxInformation,
            serviceTypes: [GeneralEnum.ServiceType.FTL, GeneralEnum.ServiceType.LTL],
          };

          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              status: 'ACTIVE',
              company: companyBody,
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(httpStatus.OK);

          expect(sendEmail).toHaveBeenCalled();

          const user = await UserModel.findById(serviceProviderId).lean();
          expect(user.company.name).toEqual(companyBody.name);
          expect(user.slug).toEqual(slug(companyBody.name)); // company's name is changed, therefore the slug is changed too
          expect(user.company.email).toEqual(companyBody.email);
          expect(user.company.phone).toEqual(companyBody.phone);
          expect(user.company.postalCode).toEqual(companyBody.postalCode);
          expect(user.company.address).toEqual(companyBody.address);
          expect(user.company.country.id.toString()).toEqual(country.id.toString());
          expect(user.company.country.name).toEqual(country.name);
          expect(user.company.province.name).toEqual(province.name);
          expect(user.company.city.name).toEqual(city.name);
          expect(user.company.businessLicenseType).toEqual(companyBody.businessLicenseType);
          expect(user.company.businessLicense).toEqual(companyBody.businessLicense);
          expect(user.company.taxType).toEqual(companyBody.taxType);
          expect(user.company.taxId).toEqual(companyBody.taxId);
          expect(user.company.serviceTypes).toEqual(companyBody.serviceTypes);
          expect(user.company.communityCode).toEqual(companyBody.communityCode);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 when communityCode is not alphanumeric',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                communityCode: '.sp4',
              },
            });

          expectHaveFailedMeta(body, '"communityCode" must only contain alpha-numeric characters');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 when communityCode is more than 32 character',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                communityCode: 'sp444444444444444444444444444444444444',
              },
            });

          expectHaveFailedMeta(body, '"communityCode" length must be less than or equal to 32 characters long');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 when communityCode is already exist',
        async () => {
          await UserModel.findByIdAndUpdate(serviceProviderId.toString(), {
            company: {
              communityCode: 'sp4',
            },
          });

          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                communityCode: 'sp5',
              },
            });

          expectHaveFailedMeta(body, 'User already have community code');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit service provider (status) by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              status: 'ACTIVE',
            });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit service provider by driver account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.driverAuthHeader())
            .send({
              status: 'ACTIVE',
            });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit service provider by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.customerCompanyAuthHeader())
            .send({
              status: 'ACTIVE',
            });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 with invalid country id',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                countryId: new Types.ObjectId().toString(),
              },
            });

          expectHaveFailedMeta(body, 'Country not found');
          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 if country is set to Indonesia but company document dan tax are not set',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                countryId: country.id,
              },
            });

          expectHaveFailedMeta(body, 'Company document and tax is required');
          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 if country is set to Indonesia but tax type is missing',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(serviceProviderId))
            .set(Auth.adminAuthHeader())
            .send({
              company: {
                countryId: country.id,
                ...companyDocument,
                ...taxInformation,
                taxType: undefined,
              },
            });

          expectHaveFailedMeta(body, 'Company document and tax is required');
          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('edits a customer user', () => {
      it(
        'Successfully edit customer (approvalStatus) by service provider account',
        async () => {
          const customerGroup = await CustomerGroupModel.create(
            constructCustomerGroupFields({ serviceProvider: serviceProviderTokenData.userId }),
          );

          const { status, body } = await request(app)
            .patch(endpoint(customerCompanyId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              approvalStatus: 'APPROVED',
              customerGroupId: customerGroup._id,
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Successfully edit customer (status) by internal account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(customerCompanySecondId))
            .set(Auth.adminAuthHeader())
            .send({
              status: 'ACTIVE',
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          const customer = await UserModel.findById(customerCompanySecondId);
          expect(customer.status).toEqual('ACTIVE');
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail approve customer by service provider account without customer group',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(customerCompanyId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              approvalStatus: 'APPROVED',
            });

          expectHaveFailedMeta(body, 'Customer group is required with approval');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail approve customer by service provider account if customer group not found',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(customerCompanyId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              approvalStatus: 'APPROVED',
              customerGroupId: new Types.ObjectId(),
            });

          expectHaveFailedMeta(body, 'Customer group not found');
          expect(status).toEqual(httpStatus.BAD_REQUEST);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit customer (except: approvalStatus) by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(customerCompanyId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              approvalStatus: 'APPROVED',
              name: 'Customer updated',
            });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit customer by driver account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(customerCompanyId))
            .set(Auth.driverAuthHeader())
            .send({
              name: 'Customer updated',
            });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('edits a driver user', () => {
      it(
        'Successfully edit driver by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(driverId))
            .set(Auth.serviceProviderAuthHeader())
            .send({
              driver: {
                nationalId: '5123123123',
              },
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully modified property inside object like driver.address with form-data',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(driverId))
            .set(Auth.serviceProviderAuthHeader())
            .field('driver[address]', 'New address');

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          const user = await UserModel.findById(driverId).lean();
          expect(user.driver.address).toEqual('New address');
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit driver by internal account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(driverId))
            .set(Auth.adminAuthHeader())
            .send({
              driver: {
                nationalId: '5123123123',
              },
            });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );
      it(
        'Fail edit driver by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(driverId))
            .set(Auth.customerCompanyAuthHeader())
            .send({
              driver: {
                nationalId: '5123123123',
              },
            });

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('edits a Service Provider Employee user', () => {
      const SPEmployeePayload = {
        name: 'John Snow',
        email: 'johnsnow@mail.com',
        SPEmployee: {
          responsibility: 'ADMIN',
        },
      };

      it(
        'Successfully edit Service Provider Employee by service provider account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(SPEmployeeId))
            .set(Auth.serviceProviderAuthHeader())
            .send(SPEmployeePayload);

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit Service Provider Employee by internal account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(SPEmployeeId))
            .set(Auth.adminAuthHeader())
            .send(SPEmployeePayload);

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit Service Provider Employee by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint(SPEmployeeId))
            .set(Auth.customerCompanyAuthHeader())
            .send(SPEmployeePayload);

          expectHaveFailedMeta(body, "The key role doesn't have access.");
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });

  describe('PATCH /v1/users', () => {
    const endpoint = '/v1/users';
    const newName = 'New User Name';
    const companyDocument = {
      businessLicenseType: 'SIUP',
      businessLicense: '123456789',
    };
    const taxInformation = {
      taxType: 'NON-PKP',
      taxId: '12345678',
    };

    beforeEach(async () => {
      await UserModel.insertMany([
        {
          _id: internalId,
          formattedId: 'ADM0001',
          name: 'First Admin',
          email: 'internalone@hzn.one',
          password: await hashPassword('A@hzn.one123'),
          status: 'ACTIVE',
          phone: '081234567890',
          role: 'INTERNAL',
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          _id: serviceProviderId.toString(),
          name: 'First Provider',
          slug: slug('Service Provider One Inc.'),
          email: 'user@serviceprovider.com',
          password: 'randomstring',
          status: 'INACTIVE',
          phone: '081234567810',
          role: 'SERVICE_PROVIDER',
          type: 'COMPANY',
          formattedId: 'IDN0001',
          company: {
            name: 'Service Provider One Inc.',
            email: 'company@serviceprovider.com',
            phone: '089123456789',
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
            serviceTypes: [GeneralEnum.ServiceType.LTL],
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: customerCompanyId.toString(),
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'First Company Customer',
          email: 'user@company-customer.com',
          password: 'randomstring',
          status: 'ACTIVE',
          phone: '081234567810',
          role: 'CUSTOMER',
          type: 'COMPANY',
          formattedId: 'CSR0001',
          company: {
            name: 'Service Provider One Inc.',
            email: 'admin@company-customer.com',
            phone: '089123456789',
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
            serviceTypes: [GeneralEnum.ServiceType.LTL],
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: customerIndividualId.toString(),
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'First Individual Customer',
          email: 'user@individual-customer.com',
          password: 'randomstring',
          status: 'ACTIVE',
          phone: '081234567810',
          role: 'CUSTOMER',
          type: 'INDIVIDUAL',
          formattedId: 'CSR0002',
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          _id: driverId,
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: 'APPROVED',
              approvalStatusAt: 123,
            },
          ],
          name: 'John',
          email: 'driver@gmail.com',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: 'DRIVER',
          formattedId: 'WKR00100',
          driver: {
            nationalId: '12343333',
            address: 'jl keluar',
            dateOfBirth: '1996-11-01',
            bloodType: 'A',
            employeeType: 'Own',
            licenseType: 'B2',
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: '1234567890123456',
            isAvailable: false,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
      ]);
    });

    it(
      'responds with 200 and updates service provider user',
      async () => {
        const { status, body } = await request(app).patch(endpoint).set(Auth.adminAuthHeader()).send({ name: newName });

        expectHaveSuccessMeta(body, 'Successfully modified a user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const updatedUser = await UserModel.findById(internalId, 'name').lean();
        expect(updatedUser.name).toEqual(newName);
      },
      TEST_TIMEOUT_MS,
    );

    describe('edits a driver user', () => {
      it(
        'Successfully edit driver (isAvailable and pin) by driver account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.driverAuthHeader())
            .send({
              driver: {
                isAvailable: true,
              },
              pin: '123456',
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit driver (except: isAvailable and pin) by driver account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.driverAuthHeader())
            .send({
              driver: {
                nationalId: '5123123123',
              },
            });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('edits a customer user', () => {
      it(
        'Successfully edit customer with company type (except: approvalStatus) by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.customerCompanyAuthHeader())
            .send({
              company: {
                countryId: country.id,
                ...companyDocument,
                ...taxInformation,
                taxType: undefined,
              },
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Successfully edit customer with individual type (except: approvalStatus) by customer account',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.customerIndividualAuthHeader())
            .send({
              individual: {
                countryId: country.id,
                provinceId: province.id,
                cityId: city.id,
              },
            });

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully modified property inside object like individual.cityId with form-data',
        async () => {
          const newCity = await CityModel.create({
            name: 'Sepatan',
            province: province.id,
            geoJsonId: 111,
            postalCodes: ['15200'],
          });

          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.customerIndividualAuthHeader())
            .field('individual[countryId]', country.id)
            .field('individual[provinceId]', province.id)
            .field('individual[cityId]', newCity.id);

          expectHaveSuccessMeta(body, 'Successfully modified a user');
          expect(body).toHaveProperty('data', null);
          expect(status).toEqual(200);

          const user = await UserModel.findById(customerIndividualId).lean();
          expect(user.individual.city.id.toString()).toEqual(newCity.id);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'Fail edit customer (approvalStatus) by customer account',
        async () => {
          const { status, body } = await request(app).patch(endpoint).set(Auth.customerCompanyAuthHeader()).send({
            approvalStatus: 'APPROVED',
          });

          expectHaveFailedMeta(body, 'Not allowed');
          expect(status).toEqual(httpStatus.FORBIDDEN);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 if country is set to Indonesia but company document dan tax are not set',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.customerCompanyAuthHeader())
            .send({
              company: {
                countryId: country.id,
              },
            });

          expectHaveFailedMeta(body, 'Company document and tax is required');
          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 400 if serviceTypes is set',
        async () => {
          const { status, body } = await request(app)
            .patch(endpoint)
            .set(Auth.customerCompanyAuthHeader())
            .send({
              company: {
                serviceTypes: GeneralEnum.ServiceType.FTL,
              },
            });

          expectHaveFailedMeta(body, 'Service type only available to service provider');
          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });
});
