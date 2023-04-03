import slug from 'slug';
import request from 'supertest';
import { Types } from 'mongoose';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import { IUser, ICountry, IResponsibility, IProvince, ICity, UserEnum, GeneralEnum } from '@definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { UserModel, ResponsibilityModel, CountryModel, ProvinceModel, CityModel, CustomerGroupModel } from '@models';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { serviceProviderId, userInformation, driverId, customerCompanyId } from '@v1-tests/fixtures/user';
import { constructCustomerGroupFields } from '@v1-tests/fixtures/customer-group';

const TEST_TIMEOUT_MS = 5000;

let responsibility: IResponsibility.IDataSchema;
let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;
let serviceProvider: IUser.IDataSchema;

describe('User routes', () => {
  describe('GET /v1/users/:formattedUserId', () => {
    const endpoint = '/v1/users/';
    const userIdOne = new Types.ObjectId();
    const userIdTwo = new Types.ObjectId();
    const firstInternalFormattedUserId = 'ADM0001';
    const secondInternalFormattedUserId = 'ADM0002';
    const firstDriverFormattedUserId = 'IDN0001-WKR9001';
    const secondDriverFormattedUserId = 'IDN0001-WKR0002';
    const firstServiceProviderFormattedUserId = 'IDN2001';
    const firstSPEmployeeFormattedUserId = 'IDN0001-ADMC0001';
    const secondSPEmployeeFormattedUserId = 'IDN0002-ADMC0001';
    const firstCustomerFormattedUserId = 'CSR9001';
    const customerGroupId = new Types.ObjectId();
    const customerGroupName = 'Default Group';

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

      serviceProvider = await UserModel.create({
        _id: serviceProviderId,
        name: 'First Service Provider',
        slug: slug('First Service Provider Inc.'),
        email: 'first@servicerprovider.com',
        password: 'password',
        status: 'ACTIVE',
        phone: '081234564810',
        role: 'SERVICE_PROVIDER',
        type: 'COMPANY',
        formattedId: firstServiceProviderFormattedUserId,
        company: {
          name: 'First Service Provider Inc.',
          email: 'sp-one-inc@gmail.com',
          phone: '089121456789',
          taxType: 'PKP',
          taxId: '123456706',
          businessLicense: '123156707',
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

      await CustomerGroupModel.create(
        constructCustomerGroupFields({
          _id: customerGroupId,
          serviceProvider: serviceProvider.id,
          name: customerGroupName,
          status: 'ACTIVE',
        }),
      );

      await UserModel.insertMany([
        {
          _id: userIdOne,
          parents: null,
          name: 'First Admin',
          email: 'internalone@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: UserEnum.Role.INTERNAL,
          formattedId: firstInternalFormattedUserId,
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          _id: userIdTwo,
          parents: null,
          name: 'Second Admin',
          email: 'internaltwo@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: UserEnum.Role.INTERNAL,
          formattedId: secondInternalFormattedUserId,
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
          deletedAt: getCurrentUnixTimestamp(),
          deletedBy: userInformation,
        },
        {
          _id: driverId.toString(),
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Driver',
          email: 'driverone@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567890',
          role: UserEnum.Role.DRIVER,
          formattedId: firstDriverFormattedUserId,
          driver: {
            nationalId: '12813369776211',
            address: 'jl test',
            dateOfBirth: '1996-12-01',
            bloodType: UserEnum.BloodType.A,
            employeeType: UserEnum.EmployeeType.Outsource,
            outsourcedCompany: 'PT asdfasf',
            licenseType: UserEnum.DriverLicenseType.B2,
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: '1234666511223172',
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        },
        {
          parents: [
            {
              user: userIdOne,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'Second Driver',
          email: 'drivertwo@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567123',
          role: UserEnum.Role.DRIVER,
          formattedId: secondDriverFormattedUserId,
          driver: {
            nationalId: '12813369776222',
            address: 'jl test',
            dateOfBirth: '1996-12-01',
            bloodType: UserEnum.BloodType.A,
            employeeType: UserEnum.EmployeeType.Outsource,
            outsourcedCompany: 'PT asdfasf',
            licenseType: UserEnum.DriverLicenseType.B2,
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: '1234666511223173',
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
          deletedAt: getCurrentUnixTimestamp(),
          deletedBy: userInformation,
        },
        {
          _id: customerCompanyId.toString(),
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
              customerGroup: customerGroupId,
            },
            {
              user: userIdOne,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: 'ACTIVE',
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: 'COMPANY',
          formattedId: firstCustomerFormattedUserId,
          company: {
            name: 'First Customer Inc.',
            email: 'customer-one-inc@gmail.com',
            phone: '089173456789',
            taxId: '126416709',
            businessLicense: '123656712',
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
          },
          createdBy: userInformation,
          verifiedAt: 123,
        },
        {
          parents: [
            {
              user: serviceProviderId,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'SP Employee One',
          email: 'spemployee@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567123',
          role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
          formattedId: firstSPEmployeeFormattedUserId,
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
          SPEmployee: {
            accessTypes: ['READ'],
          },
        },
        {
          parents: [
            {
              user: new Types.ObjectId(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'SP Employee Two',
          email: 'spemployee2@hzn.one',
          password: 'password',
          status: 'ACTIVE',
          phone: '081234567423',
          role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
          formattedId: secondSPEmployeeFormattedUserId,
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
          SPEmployee: {
            accessTypes: ['READ'],
          },
        },
      ]);
    });

    describe('with internal authorization', () => {
      it(
        "returns 200 and service provider user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstServiceProviderFormattedUserId}`)
            .set(Auth.adminAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstServiceProviderFormattedUserId);
          expect(body.data.company.name).toEqual('First Service Provider Inc.');
          expect(body.data.slug).toEqual(slug('First Service Provider Inc.'));

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and customer user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstCustomerFormattedUserId}`)
            .set(Auth.adminAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstCustomerFormattedUserId);
          expect(body.data.company.name).toEqual('First Customer Inc.');
          expect(body.data.slug).toBeUndefined();

          expect(body.data.parents[0].customerGroup.name).toEqual(customerGroupName);
          expect(body.data.parents[0].customerGroup.serviceProvider).toEqual(serviceProvider.id);
          expect(body.data.parents[0].customerGroup.status).toEqual('ACTIVE');
          expect(body.data.parents[0].customerGroup.id).toEqual(customerGroupId.toString());

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and driver user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstDriverFormattedUserId}`)
            .set(Auth.adminAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstDriverFormattedUserId);
          expect(body.data.driver.nationalId).toEqual('12813369776211');
          expect(body.data.slug).toBeUndefined();

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and SP Employee user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstSPEmployeeFormattedUserId}`)
            .set(Auth.adminAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstSPEmployeeFormattedUserId);
          expect(body.data.SPEmployee).toHaveProperty('accessTypes', expect.any(Array));

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and internal user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstInternalFormattedUserId}`)
            .set(Auth.adminAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty(
            'internal',
            expect.objectContaining({
              responsibility: expect.any(Object),
            }),
          );
          expect(body.data).toHaveProperty('formattedId', 'ADM0001');
          expect(body.data.slug).toBeUndefined();

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 404 if internal user was deleted',
        async () => {
          // soft deletes the user first
          await UserModel.updateOne(
            { internal: { $exists: true }, 'internal.formattedId': 'ADM0001' },
            { deletedAt: getCurrentUnixTimestamp() },
          );

          const { status, body } = await request(app).get(`${endpoint}ADM0001`).set(Auth.adminAuthHeader());

          expectHaveFailedMeta(body, 'User not found');

          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 404 if user id is invalid',
        async () => {
          const { status, body } = await request(app).get(`${endpoint}randomuserid`).set(Auth.adminAuthHeader());

          expectHaveFailedMeta(body, 'User not found');

          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('with service provider authorization', () => {
      it(
        "returns 200 and service provider user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstServiceProviderFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstServiceProviderFormattedUserId);
          expect(body.data.company.name).toEqual('First Service Provider Inc.');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and customer user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstCustomerFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstCustomerFormattedUserId);
          expect(body.data.company.name).toEqual('First Customer Inc.');
          expect(body.data.parents.length).toEqual(1);

          expect(body.data.parents[0].customerGroup.name).toEqual(customerGroupName);
          expect(body.data.parents[0].customerGroup.serviceProvider).toEqual(serviceProvider.id);
          expect(body.data.parents[0].customerGroup.status).toEqual('ACTIVE');
          expect(body.data.parents[0].customerGroup.id).toEqual(customerGroupId.toString());

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and first driver user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstDriverFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstDriverFormattedUserId);
          expect(body.data.driver.nationalId).toEqual('12813369776211');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 200 and SP Employee user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstSPEmployeeFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('formattedId', firstSPEmployeeFormattedUserId);
          expect(body.data.SPEmployee).toHaveProperty('accessTypes', expect.any(Array));

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        "returns 404 when access other SP Employee user's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${secondSPEmployeeFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveFailedMeta(body, 'User not found');

          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 404 if the parent is not match',
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${secondDriverFormattedUserId}`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveFailedMeta(body, 'User not found');
          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 404 if user id is invalid',
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}randomuserid`)
            .set(Auth.serviceProviderAuthHeader());

          expectHaveFailedMeta(body, 'User not found');
          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('with driver authorization', () => {
      it(
        "returns 200 and driver's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstDriverFormattedUserId}`)
            .set(Auth.driverAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));

          expect(body.data).toHaveProperty('formattedId', firstDriverFormattedUserId);

          expect(body.data).toHaveProperty('driver', expect.any(Object));

          expect(body.data.driver).toHaveProperty('nationalId', expect.any(String));
          expect(body.data.driver).toHaveProperty('address', expect.any(String));
          expect(body.data.driver).toHaveProperty('dateOfBirth', expect.any(String));
          expect(body.data.driver).toHaveProperty('bloodType', expect.any(String));
          expect(body.data.driver).toHaveProperty('employeeType', expect.any(String));
          expect(body.data.driver).toHaveProperty('licenseType', expect.any(String));
          expect(body.data.driver).toHaveProperty('licenseExpiryDate', expect.any(String));
          expect(body.data.driver).toHaveProperty('driverLicenseId', expect.any(String));

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 404 if driver user was deleted',
        async () => {
          // soft deletes the user first
          await UserModel.updateOne(
            { driver: { $exists: true }, formattedId: firstDriverFormattedUserId },
            { deletedAt: getCurrentUnixTimestamp() },
          );

          const { status, body } = await request(app)
            .get(`${endpoint}${firstDriverFormattedUserId}`)
            .set(Auth.driverAuthHeader());

          expectHaveFailedMeta(body, 'User not found');

          expect(status).toEqual(404);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 403 if driver user was deleted',
        async () => {
          // soft deletes the user first
          await UserModel.updateOne(
            { driver: { $exists: true }, formattedId: secondDriverFormattedUserId },
            { deletedAt: getCurrentUnixTimestamp() },
          );

          const { status, body } = await request(app)
            .get(`${endpoint}${secondDriverFormattedUserId}`)
            .set(Auth.driverAuthHeader());

          expectHaveFailedMeta(body, 'Not allowed');

          expect(status).toEqual(403);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('with customer authorization', () => {
      it(
        "returns 200 and customer's details",
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstCustomerFormattedUserId}`)
            .set(Auth.customerCompanyAuthHeader());

          expectHaveSuccessMeta(body, "Successfully get user's details");

          expect(body).toHaveProperty('data', expect.any(Object));

          expect(body.data).toHaveProperty('formattedId', firstCustomerFormattedUserId);
          expect(body.data).toHaveProperty('role', UserEnum.Role.CUSTOMER);
          expect(body.data.company).toHaveProperty('name', 'First Customer Inc.');
          expect(body.data.parents.length).toEqual(2);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 403 if customer access other user',
        async () => {
          const { status, body } = await request(app)
            .get(`${endpoint}${firstServiceProviderFormattedUserId}`)
            .set(Auth.customerCompanyAuthHeader());

          expectHaveFailedMeta(body, 'Not allowed');

          expect(status).toEqual(403);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });
});
