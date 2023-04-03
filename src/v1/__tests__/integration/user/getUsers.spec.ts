import slug from 'slug';
import request from 'supertest';
import { Types } from 'mongoose';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import {
  IUser,
  ICountry,
  IResponsibility,
  IProvince,
  ICity,
  GeneralEnum,
  ResponsibilityEnum,
  UserEnum,
} from '@definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { UserModel, ResponsibilityModel, CountryModel, ProvinceModel, CityModel, CustomerGroupModel } from '@models';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import {
  serviceProviderId,
  userInformation,
  initSPEmployee,
  constructUserCustomerFields,
  constructUserInternalFields,
  constructUserServiceProviderFields,
  constructUserDriverFields,
  constructUserSPEmployeeFields,
} from '@v1-tests/fixtures/user';
import { constructCustomerGroupFields } from '@v1-tests/fixtures/customer-group';
import { testRegexSearch } from '@tests/helper/regex';

const TEST_TIMEOUT_MS = 5000;

let responsibility: IResponsibility.IDataSchema;
let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;
let serviceProvider: IUser.IDataSchema;

describe('User routes', () => {
  describe('GET /v1/users', () => {
    const endpoint = '/v1/users';
    const customerGroupId = new Types.ObjectId();
    const customerGroupName = 'Default Group';

    beforeEach(async () => {
      const provinceId = new Types.ObjectId();
      const countryId = new Types.ObjectId();

      await initSPEmployee();
      [responsibility, country, province, city] = await Promise.all([
        ResponsibilityModel.create({
          formattedId: 'RESP0001',
          name: 'Admin',
          accessTypes: [ResponsibilityEnum.AccessType.CREATE],
          status: GeneralEnum.Status.ACTIVE,
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
        name: 'Provider One Active',
        slug: slug('Service Provider One Inc.'),
        email: 'user@serviceprovider.com',
        password: 'randomstring',
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
          taxId: '123256708',
          businessLicense: '123456711',
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
          communityCode: 'sp1a',
        },
        createdBy: userInformation,
        verifiedAt: 123,
      });

      await CustomerGroupModel.create(
        constructCustomerGroupFields({
          _id: customerGroupId,
          serviceProvider: serviceProvider.id,
          name: customerGroupName,
          status: GeneralEnum.Status.ACTIVE,
        }),
      );

      await UserModel.insertMany([
        constructUserInternalFields({
          name: 'First Admin',
          email: 'internalone@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          formattedId: 'ADM0001',
          internal: {
            responsibility: responsibility._id,
          },
        }),
        constructUserInternalFields({
          name: 'Second Admin',
          email: 'internaltwo@hzn.one',
          status: GeneralEnum.Status.INACTIVE,
          formattedId: 'ADM0002',
          internal: {
            responsibility: responsibility._id,
          },
          createdAt: getCurrentUnixTimestamp() + 1000,
        }),
        constructUserServiceProviderFields({
          name: 'Provider One InActive',
          slug: slug('Service Provider Inactive Inc.'),
          formattedId: 'IDN0004',
          email: 'provider-one-inactive@hzn.one',
          status: GeneralEnum.Status.INACTIVE,
          type: UserEnum.UserType.COMPANY,
        }),
        constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
              customerGroup: customerGroupId,
            },
          ],
          name: 'Customer One Approved',
          formattedId: 'CSR0001',
          email: 'customer-one-approved@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          createdAt: 2,
          verifiedAt: 123,
        }),
        constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.REJECTED,
              approvalStatusAt: 123,
              customerGroup: customerGroupId,
            },
          ],
          name: 'Customer One Rejected',
          formattedId: 'CSR0005',
          email: 'customer-one-rejected@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567810',
          createdAt: 1,
          verifiedAt: 123,
        }),
        constructUserDriverFields({
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Driver',
          email: 'driverone@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          formattedId: 'ADM0001-WKR0001',
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
        }),
        constructUserDriverFields({
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'Second Driver',
          email: 'driversecond@hzn.one',
          status: GeneralEnum.Status.INACTIVE,
          formattedId: 'ADM0001-WKR0002',
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
        }),
        constructUserSPEmployeeFields({
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'Admin Employee',
          email: 'sp-employee@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          formattedId: 'ADM0001-ADMC0001',
          SPEmployee: {
            accessTypes: ['CREATE', 'READ', 'UPDATE'],
          },
        }),
        constructUserSPEmployeeFields({
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'Admin Employee Two',
          email: 'sp-employee2@hzn.one',
          status: GeneralEnum.Status.INACTIVE,
          formattedId: 'ADM0001-ADMC0002',
          SPEmployee: {
            accessTypes: ['READ'],
          },
        }),
        constructUserSPEmployeeFields({
          parents: [
            {
              user: new Types.ObjectId(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'Admin Employee Three',
          email: 'sp-employee3@hzn.one',
          status: GeneralEnum.Status.ACTIVE,
          formattedId: 'ADM0002-ADMC0001',
          SPEmployee: {
            accessTypes: ['READ'],
          },
        }),
        constructUserCustomerFields(UserEnum.UserType.COMPANY, {
          formattedId: 'CSR0006',
          parents: [
            {
              user: serviceProvider.id,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
              customerGroup: customerGroupId,
            },
          ],
        }),
      ]);
    });

    testRegexSearch((search: string) =>
      request(app).get(endpoint).set(Auth.adminAuthHeader()).query({ role: UserEnum.Role.INTERNAL, search }),
    );

    it(
      'returns list of internal user in a specific page with limit without related filter',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.INTERNAL, page: 2, limit: 1 });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 2);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].formattedId).toEqual('ADM0001');
        expect(body.data.items[0].role).toEqual(UserEnum.Role.INTERNAL);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of service provider user in a specific page with limit without related filter',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, page: 1, limit: 10 });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 2);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(2);
        expect(body.data.items[0].formattedId).toEqual('IDN0004');
        expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of service provider user in a specific page with limit with related filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.SERVICE_PROVIDER,
          search: 'provider',
          status: GeneralEnum.Status.ACTIVE,
          cityId: city.id,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of customer user in a specific page with limit without related filter',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.CUSTOMER, page: 1, limit: 10 });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 3);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(3);
        expect(body.data.items[0].formattedId).toEqual('CSR0006');
        expect(body.data.items[0].role).toEqual(UserEnum.Role.CUSTOMER);

        expect(body.data.items[0].parents[0].customerGroup.name).toEqual(customerGroupName);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of CUSTOMER user in a specific page with limit with related filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.CUSTOMER,
          search: 'customer',
          status: GeneralEnum.Status.ACTIVE,
          serviceProviderId: serviceProvider.id,
          userType: UserEnum.UserType.INDIVIDUAL,
          approvalStatus: UserEnum.ApprovalStatus.REJECTED,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.CUSTOMER);
        expect(body.data.items[0].formattedId).toEqual('CSR0005');

        expect(body.data.items[0].parents[0].customerGroup.name).toEqual(customerGroupName);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of CUSTOMER user in a specific page with limit with userSource filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.CUSTOMER,
          userType: UserEnum.UserType.COMPANY,
          userSource: UserEnum.UserSource.TMS,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.CUSTOMER);
        expect(body.data.items[0].formattedId).toEqual('CSR0006');

        expect(body.data.items[0].parents[0].customerGroup.name).toEqual(customerGroupName);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of driver user in a specific page with limit without related filter',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, page: 1, limit: 10 });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 2);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(2);
        expect(body.data.items[0].formattedId).toEqual('ADM0001-WKR0001');
        expect(body.data.items[0].role).toEqual(UserEnum.Role.DRIVER);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of driver user in a specific page with limit with related filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.DRIVER,
          search: 'second',
          status: GeneralEnum.Status.INACTIVE,
          serviceProviderId: serviceProvider.id,
          employeeType: UserEnum.EmployeeType.Own,
          'licenseTypes[]': UserEnum.DriverLicenseType.B2,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.DRIVER);
        expect(body.data.items[0].formattedId).toEqual('ADM0001-WKR0002');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of driver user in a specific page with limit with related filter and service provider account',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.serviceProviderAuthHeader()).query({
          role: UserEnum.Role.DRIVER,
          employeeType: UserEnum.EmployeeType.Outsource,
          'licenseTypes[]': UserEnum.DriverLicenseType.B2,
          page: 1,
          limit: 10,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.DRIVER);
        expect(body.data.items[0].formattedId).toEqual('ADM0001-WKR0001');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of SP Employee user in a specific page with limit without related filter',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE, page: 1, limit: 10 });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));

        expect(body.data).toHaveProperty('totalFilteredData', 4);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(4);
        expect(body.data.items[0].formattedId).toEqual('IDN0001-ADMC000001');
        expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of SP Employee user in a specific page with limit with related filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
          status: GeneralEnum.Status.INACTIVE,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
        expect(body.data.items[0].formattedId).toEqual('ADM0001-ADMC0002');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of SP Employee user in a specific page with limit with related filter and service provider account',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.serviceProviderAuthHeader()).query({
          role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
          page: 1,
          limit: 10,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 3);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(3);
        expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
        expect(body.data.items[1].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
        expect(body.data.items[2].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
        const formattedIds = body.data.items.map((item) => item.formattedId);
        expect(formattedIds).toContainEqual('IDN0001-ADMC000001');
        expect(formattedIds).toContainEqual('ADM0001-ADMC0001');
        expect(formattedIds).toContainEqual('ADM0001-ADMC0002');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of internal user in a specific page with limit with related filter',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.INTERNAL,
          search: 'internal',
          responsibility: 'RESP0001',
          status: GeneralEnum.Status.ACTIVE,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns list of service provider user with limit with related filter that have community code',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader()).query({
          role: UserEnum.Role.SERVICE_PROVIDER,
          search: 'sp-one-inc@gmail.com',
          status: GeneralEnum.Status.ACTIVE,
        });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('totalFilteredData', 1);
        expect(body.data).toHaveProperty('items', expect.any(Array));
        expect(body.data.items.length).toEqual(1);
        expect(body.data.items[0].company.communityCode).toEqual('sp1a');

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns not allowed when send not related field (employeeType) when the role is internal ',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.INTERNAL, search: 'internal', responsibility: 'RESP0001', employeeType: '' });

        expectHaveFailedMeta(body, '"employeeType" is not allowed');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns not allowed when send not related field (employeeType) when the role is service provider ',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, employeeType: '' });

        expectHaveFailedMeta(body, '"employeeType" is not allowed');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns not allowed when send not related field (employeeType) when the role is customer ',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.CUSTOMER, employeeType: '' });

        expectHaveFailedMeta(body, '"employeeType" is not allowed');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns not allowed when send not related field (responsibility) when the role is driver ',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, responsibility: '' });

        expectHaveFailedMeta(body, '"responsibility" is not allowed');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 404 if no user found',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.INTERNAL, status: GeneralEnum.Status.ACTIVE, search: 'some random name' });

        expectHaveFailedMeta(body, 'User not found');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    describe('with internal authorization', () => {
      it(
        'responds with 200 and list of all internal user',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.adminAuthHeader())
            .query({ role: UserEnum.Role.INTERNAL });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('totalFilteredData', 2);
          expect(body.data).toHaveProperty('items', expect.any(Array));
          for (const item of body.data.items) {
            expect(item).toHaveProperty('internal', expect.any(Object));
            expect(item.internal.responsibility).toHaveProperty('formattedId', expect.stringMatching(/RESP\d{4,}/));
            expect(item.company).toBeUndefined();
            expect(item.individual).toBeUndefined();
          }
          expect(body.data.items.length).toEqual(2);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'only return filtered list of internal user with filter query',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.adminAuthHeader())
            .query({ role: UserEnum.Role.INTERNAL, status: GeneralEnum.Status.ACTIVE, responsibility: 'RESP0001' });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('totalFilteredData', 1);
          expect(body.data).toHaveProperty('items', expect.any(Array));
          expect(body.data.items.length).toEqual(1);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns 400 if responsibility in filter is not valid',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.adminAuthHeader())
            .query({ role: UserEnum.Role.INTERNAL, responsibility: 'random responsibility' });

          expectHaveFailedMeta(body, 'Responsibility "random responsibility" does not exist');

          expect(status).toEqual(400);
        },
        TEST_TIMEOUT_MS,
      );
    });

    describe('with SP Employee Auth', () => {
      it(
        'returns list of driver user in a specific page with limit with related filter',
        async () => {
          const { status, body } = await request(app).get(endpoint).set(Auth.SPEmployeeAuthHeader()).query({
            role: UserEnum.Role.DRIVER,
            employeeType: UserEnum.EmployeeType.Outsource,
            'licenseTypes[]': UserEnum.DriverLicenseType.B2,
            page: 1,
            limit: 10,
          });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('totalFilteredData', 1);
          expect(body.data).toHaveProperty('items', expect.any(Array));
          expect(body.data.items.length).toEqual(1);
          expect(body.data.items[0].role).toEqual(UserEnum.Role.DRIVER);
          expect(body.data.items[0].formattedId).toEqual('ADM0001-WKR0001');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'returns list of SP Employee user in a specific page with limit with related filter',
        async () => {
          const { status, body } = await request(app).get(endpoint).set(Auth.SPEmployeeAuthHeader()).query({
            role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
            page: 1,
            limit: 10,
          });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('totalFilteredData', 3);
          expect(body.data).toHaveProperty('items', expect.any(Array));
          expect(body.data.items.length).toEqual(3);
          expect(body.data.items[0].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
          expect(body.data.items[1].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
          expect(body.data.items[2].role).toEqual(UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE);
          const formattedIds = body.data.items.map((item) => item.formattedId);
          expect(formattedIds).toContainEqual('IDN0001-ADMC000001');
          expect(formattedIds).toContainEqual('ADM0001-ADMC0001');
          expect(formattedIds).toContainEqual('ADM0001-ADMC0002');

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });
});
