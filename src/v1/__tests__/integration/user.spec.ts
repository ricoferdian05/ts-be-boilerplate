import request from 'supertest';
import dayjs from 'dayjs';
import slug from 'slug';
import { Types } from 'mongoose';

import app from '@server/app';
import { Auth, serviceProviderTokenData } from '@v1-tests/fixtures/auth';
import { ICountry, IProvince, ICity, UserEnum, GeneralEnum } from '@definitions';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import { UserModel, CountryModel, ProvinceModel, CityModel, BankModel } from '@models';
import { hashPassword } from '@utils/password';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import {
  constructUserCustomerFields,
  constructUserDriverFields,
  constructUserInternalFields,
  constructUserServiceProviderFields,
  customerCompanyId,
  driverId,
  internalId,
  serviceProviderId,
  userInformation,
  initSPEmployee,
  initServiceProvider,
} from '@v1-tests/fixtures/user';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';

let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;

describe('User routes', () => {
  beforeEach(async () => {
    const provinceId = new Types.ObjectId();
    const countryId = new Types.ObjectId();

    [country, province, city] = await Promise.all([
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

  describe('POST /v1/users/drivers', () => {
    const endpoint = '/v1/users/drivers/';
    const requestBody = {
      name: 'John Snow',
      password: '123qwe123QWE!',
      phone: '2323',
      nationalId: '1234167828022356',
      address: 'jl test',
      dateOfBirth: '1996-12-01',
      bloodType: UserEnum.BloodType.A,
      employeeType: UserEnum.EmployeeType.Own,
      licenseType: UserEnum.DriverLicenseType.B2,
      licenseExpiryDate: '2027-01-12',
      driverLicenseId: '1234567890123456',
      status: GeneralEnum.Status.ACTIVE,
    };

    it(
      'sucessfully create new driver user and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send(requestBody);

        expectHaveSuccessMeta(body, 'Successfully created an driver user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);

        expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();
        expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
        expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new driver user and responds with 201 and custom formattedId',
      async () => {
        const formattedUserId = 'IDN0001';
        const customFormattedId = 'WOW0001';

        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({ ...requestBody, formattedId: customFormattedId });

        expectHaveSuccessMeta(body, 'Successfully created an driver user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();

        expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
        expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);

        expect(user.formattedId).toEqual(formattedUserId + '-' + customFormattedId);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new driver user with photo and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .field('name', requestBody.name)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('nationalId', requestBody.nationalId)
          .field('address', requestBody.address)
          .field('dateOfBirth', requestBody.dateOfBirth)
          .field('bloodType', requestBody.bloodType)
          .field('employeeType', requestBody.employeeType)
          .field('licenseType', requestBody.licenseType)
          .field('licenseExpiryDate', requestBody.licenseExpiryDate)
          .field('driverLicenseId', requestBody.driverLicenseId)
          .field('status', requestBody.status)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created an driver user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();

        expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
        expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);
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
            nationalId: undefined,
          });

        expectHaveFailedMeta(body, '"nationalId" is required');

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

    it(
      'responds with 400 with duplicate national id',
      async () => {
        await UserModel.create({
          parents: [
            {
              user: new Types.ObjectId(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'John',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567890',
          role: UserEnum.Role.DRIVER,

          formattedId: 'WKR00100',
          driver: {
            nationalId: requestBody.nationalId,
            address: 'jl keluar',
            dateOfBirth: '1996-11-01',
            bloodType: UserEnum.BloodType.A,
            employeeType: UserEnum.EmployeeType.Own,
            licenseType: UserEnum.DriverLicenseType.B2,
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: '1234567890123456',
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        });

        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send(requestBody);

        expectHaveFailedMeta(body, 'National Identity Id must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with duplicate license number',
      async () => {
        await UserModel.create({
          parents: [
            {
              user: new Types.ObjectId(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'John',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567890',
          role: UserEnum.Role.DRIVER,

          formattedId: 'WKR00100',
          driver: {
            nationalId: '1234567890111111',
            address: 'jl keluar',
            dateOfBirth: '1996-11-01',
            bloodType: UserEnum.BloodType.A,
            employeeType: UserEnum.EmployeeType.Own,
            licenseType: UserEnum.DriverLicenseType.B2,
            licenseExpiryDate: '2027-01-12',
            driverLicenseId: requestBody.driverLicenseId,
          },
          createdAt: getCurrentUnixTimestamp(),
          createdBy: userInformation,
        });

        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send(requestBody);

        expectHaveFailedMeta(body, 'Driver license id must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 500 with employeeType = Outsource but field outsourcedCompany undefined',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .send({ ...requestBody, employeeType: UserEnum.EmployeeType.Outsource });

        expectHaveFailedMeta(body, '"outsourcedCompany" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 500 if a format photo is not jpg,jpeg, or png',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .field('name', requestBody.name)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('nationalId', requestBody.nationalId)
          .field('address', requestBody.address)
          .field('dateOfBirth', requestBody.dateOfBirth)
          .field('bloodType', requestBody.bloodType)
          .field('employeeType', requestBody.employeeType)
          .field('licenseType', requestBody.licenseType)
          .field('licenseExpiryDate', requestBody.licenseExpiryDate)
          .field('driverLicenseId', requestBody.driverLicenseId)
          .field('status', requestBody.status)
          .attach('photo', 'src/v1/__tests__/files/dummyWrongFile.json');

        expectHaveFailedMeta(body, 'Only image/jpg,image/jpeg,image/png format allowed!');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    describe('With SP Employee Auth', () => {
      beforeEach(async () => {
        await initSPEmployee();
        await initServiceProvider();
      });

      it(
        'sucessfully create new driver user and responds with 201',
        async () => {
          const { status, body } = await request(app).post(endpoint).set(Auth.SPEmployeeAuthHeader()).send(requestBody);

          expectHaveSuccessMeta(body, 'Successfully created an driver user');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(201);

          expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

          const user = await UserModel.findOne({ role: UserEnum.Role.DRIVER }).lean();
          expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
          expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully create new driver user and responds with 201 and custom formattedId',
        async () => {
          const formattedUserId = 'IDN0001';
          const customFormattedId = 'WOW0001';

          const { status, body } = await request(app)
            .post(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .send({ ...requestBody, formattedId: customFormattedId });

          expectHaveSuccessMeta(body, 'Successfully created an driver user');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(201);
          expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

          const user = await UserModel.findOne({ role: UserEnum.Role.DRIVER }).lean();

          expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
          expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);

          expect(user.formattedId).toEqual(formattedUserId + '-' + customFormattedId);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'sucessfully create new driver user with photo and responds with 201',
        async () => {
          const { status, body } = await request(app)
            .post(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .field('name', requestBody.name)
            .field('password', requestBody.password)
            .field('phone', requestBody.phone)
            .field('nationalId', requestBody.nationalId)
            .field('address', requestBody.address)
            .field('dateOfBirth', requestBody.dateOfBirth)
            .field('bloodType', requestBody.bloodType)
            .field('employeeType', requestBody.employeeType)
            .field('licenseType', requestBody.licenseType)
            .field('licenseExpiryDate', requestBody.licenseExpiryDate)
            .field('driverLicenseId', requestBody.driverLicenseId)
            .field('status', requestBody.status)
            .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

          expectHaveSuccessMeta(body, 'Successfully created an driver user');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(201);
          expect(await UserModel.countDocuments({ role: UserEnum.Role.DRIVER })).toEqual(1);

          const user = await UserModel.findOne({ role: UserEnum.Role.DRIVER }).lean();

          expect(dayjs(user.driver.dateOfBirth).format('YYYY-MM-DD')).toEqual(requestBody.dateOfBirth);
          expect(dayjs(user.driver.licenseExpiryDate).format('YYYY-MM-DD')).toEqual(requestBody.licenseExpiryDate);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });

  describe('GET /v1/users/service-providers/:slug', () => {
    const endpoint = '/v1/users/service-providers/';

    it(
      'returns a service provider object when send the valid slug',
      async () => {
        const slugCompany = slug('Service Provider ABC inc');

        await UserModel.create({
          name: 'Provider ABC',
          slug: slugCompany,
          email: 'abc@serviceprovider.com',
          photoUrl: 'profile/test.jpg',
          password: 'randomstring',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567811',
          role: UserEnum.Role.SERVICE_PROVIDER,
          type: UserEnum.UserType.COMPANY,
          formattedId: 'IDN1001',
          company: {
            name: 'Service Provider ABC inc',
            email: 'sp-abc-inc@gmail.com',
            phone: '089123456781',
            taxType: UserEnum.TaxType.PKP,
            taxId: '123256701',
            businessLicense: '123416711',
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

        const { status, body } = await request(app).get(`${endpoint}${slugCompany}`);

        expectHaveSuccessMeta(body, "Successfully get service provider's details");
        expect(status).toEqual(200);
        expect(body.data.company?.name).toEqual('Service Provider ABC inc');
        expect(body.data.company?.serviceTypes).toContainEqual(GeneralEnum.ServiceType.LTL);
        expect(body.data.photoUrl).toContain('profile/test.jpg');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns no data when send the invalid slug',
      async () => {
        const { status, body } = await request(app).get(`${endpoint}pt-abcdef`);

        expectHaveFailedMeta(body, 'Service provider not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('POST /v1/users/registrations/service-providers', () => {
    const endpoint = '/v1/users/registrations/service-providers/';
    const requestBody = {
      name: 'Service Provider Four',
      email: 'admin@serviceprovider.com',
      password: '123qwe123QWE!',
      phone: '08957025700001',
      companyName: 'Service Four Inc',
      companyEmail: 'service-provider-inc-9@gmail.com',
      companyPhone: '08957025600001',
      taxId: '1234567456',
      businessLicense: '123456706',
      businessLicenseType: UserEnum.BusinessLicenseType.SIUP,
      serviceTypes: [GeneralEnum.ServiceType.LTL],
      taxType: UserEnum.TaxType.PKP,
      provinceId: '',
      cityId: '',
    };

    beforeEach(() => {
      requestBody['provinceId'] = province.id;
      requestBody['cityId'] = city.id;
      requestBody['countryId'] = country.id;
    });

    it(
      'sucessfully create new service provider user with photo and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', province.id)
          .field('cityId', city.id)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created a service provider user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();

        expect(user.company?.name).toEqual(requestBody.companyName);
        expect(user.photoUrl).toContain('profile');
        expect(user.role).toEqual(UserEnum.Role.SERVICE_PROVIDER);
        expect(user.successOrders).toEqual(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a mandatory field is not given',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .send({
            ...requestBody,
            email: undefined,
          });

        expectHaveFailedMeta(body, '"email" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if given status is not valid',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
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
      'responds with 400 with duplicate email',
      async () => {
        const hashedPassword = await hashPassword('123');
        await UserModel.create({
          name: 'Provider One Active',
          slug: slug('Service Provider One Inc.'),
          email: requestBody.email,
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
            taxId: '123456706',
            businessLicense: '123456707',
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

        const { status, body } = await request(app)
          .post(endpoint)
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 500 if a format photo is not jpg,jpeg, or png',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .attach('photo', 'src/v1/__tests__/files/dummyWrongFile.json');

        expectHaveFailedMeta(body, 'Only image/png format allowed!');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if country is not valid',
      async () => {
        const countryId = new Types.ObjectId();
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', countryId.toString())
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Country not found');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('POST /v1/users/service-providers', () => {
    const endpoint = '/v1/users/service-providers/';
    const requestBody = {
      name: 'Service Provider Four',
      email: 'admin@serviceprovider.com',
      password: '123qwe123QWE!',
      phone: '08957025700001',
      companyName: 'Service Four Inc',
      companyEmail: 'service-provider-inc-9@gmail.com',
      companyPhone: '08957025600001',
      taxId: '126781123456',
      businessLicense: '123456708',
      businessLicenseType: UserEnum.BusinessLicenseType.SIUP,
      serviceTypes: [GeneralEnum.ServiceType.LTL],
      taxType: UserEnum.TaxType.PKP,
      provinceId: '',
      cityId: '',
      countryId: '',
      status: GeneralEnum.Status.ACTIVE,
      communityCode: 'sp4',
    };

    beforeEach(() => {
      requestBody['provinceId'] = province.id;
      requestBody['cityId'] = city.id;
      requestBody['countryId'] = country.id;
    });

    it(
      'sucessfully create new service provider user with photo and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('status', requestBody.status)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('communityCode', requestBody.communityCode)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created a service provider user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();

        expect(user.company?.name).toEqual(requestBody.companyName);
        expect(user.company?.communityCode).toEqual(requestBody.communityCode);
        expect(user.photoUrl).toContain('profile');
        expect(user.role).toEqual(UserEnum.Role.SERVICE_PROVIDER);
        expect(user.successOrders).toEqual(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new service provider user without photo and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('status', requestBody.status)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('communityCode', requestBody.communityCode);

        expectHaveSuccessMeta(body, 'Successfully created a service provider user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.SERVICE_PROVIDER })).toEqual(1);

        const user = await UserModel.findOne({}).lean();

        expect(user.company?.name).toEqual(requestBody.companyName);
        expect(user.company?.communityCode).toEqual(requestBody.communityCode);
        expect(user.photoUrl).toBeUndefined();
        expect(user.successOrders).toEqual(0);
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
            email: undefined,
          });

        expectHaveFailedMeta(body, '"email" is required');

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
      'responds with 400 with duplicate email',
      async () => {
        const hashedPassword = await hashPassword('123');
        await UserModel.create({
          name: 'Provider One Active',
          slug: slug('Service Provider One Inc.'),
          email: requestBody.email,
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
            taxId: '123456107',
            businessLicense: '123456709',
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

        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('status', requestBody.status)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 500 if a format photo is not jpg,jpeg, or png',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('companyName', requestBody.companyName)
          .field('companyEmail', requestBody.companyEmail)
          .field('companyPhone', requestBody.companyPhone)
          .field('taxId', requestBody.taxId)
          .field('status', requestBody.status)
          .field('businessLicense', requestBody.businessLicense)
          .field('businessLicenseType', requestBody.businessLicenseType)
          .field('serviceTypes', requestBody.serviceTypes)
          .field('taxType', requestBody.taxType)
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .attach('photo', 'src/v1/__tests__/files/dummyWrongFile.json');

        expectHaveFailedMeta(body, 'Only image/png format allowed!');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a communityCode is not alphanumeric',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            communityCode: '.sp4',
          });

        expectHaveFailedMeta(body, '"communityCode" must only contain alpha-numeric characters');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a communityCode field more than 32 character',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            communityCode: 'sp4444444444444444444444444444444',
          });

        expectHaveFailedMeta(body, '"communityCode" length must be less than or equal to 32 characters long');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a communityCode is not unique',
      async () => {
        await UserModel.create(
          constructUserServiceProviderFields({
            company: {
              communityCode: 'sp5',
            },
          }),
        );

        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.adminAuthHeader())
          .send({
            ...requestBody,
            communityCode: 'sp5',
          });

        expectHaveFailedMeta(body, 'Company community code must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('PATCH /v1/users/payment-accounts', () => {
    const endpoint = '/v1/users/payment-accounts/';

    const bankId = new Types.ObjectId();
    const firstCustomerFormattedUserId = 'CSR9001';
    const firstServiceProviderFormattedUserId = 'IDN2001';
    const bankName = 'Bank BCA';
    const bankCode = '014';

    const paymentPayload = {
      bank: bankId,
      bankBranch: 'Malang',
      name: 'John Snow',
      number: '1234567890',
    };

    beforeEach(async () => {
      await BankModel.create({
        _id: bankId,
        name: bankName,
        code: bankCode,
        country: country.id,
        createdBy: {
          userId: '61cad6a8cb39694efde0a99a',
          email: 'dummy@example.com',
          name: 'Dummy',
        },
      });
    });

    it(
      'responds with 200 and successfully updates payment account [customer auth]',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully modified user’s payment account');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const user = await UserModel.findOne({ _id: customerCompanyId }).lean();

        expect(user).toHaveProperty('paymentAccount', expect.any(Object));
        expect(user.paymentAccount).toHaveProperty('bank', expect.any(Object));
        expect(user.paymentAccount.bank.id).toEqual(bankId);
        expect(user.paymentAccount.bank.name).toEqual(bankName);
        expect(user.paymentAccount.bank.code).toEqual(bankCode);
        expect(user.paymentAccount.bankBranch).toEqual('Malang');
        expect(user.paymentAccount.name).toEqual('John Snow');
        expect(user.paymentAccount.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 and successfully updates payment account [service provider auth]',
      async () => {
        await UserModel.create({
          _id: serviceProviderId.toString(),
          name: 'First Service Provider',
          slug: slug('First Service Provider Inc.'),
          email: 'first@servicerprovider.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234564810',
          role: UserEnum.Role.SERVICE_PROVIDER,
          type: UserEnum.UserType.COMPANY,
          formattedId: firstServiceProviderFormattedUserId,
          company: {
            name: 'First Service Provider Inc.',
            email: 'sp-one-inc@gmail.com',
            phone: '089121456789',
            taxType: UserEnum.TaxType.PKP,
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

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.serviceProviderAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully modified user’s payment account');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const user = await UserModel.findOne({ _id: serviceProviderId.toString() }).lean();

        expect(user).toHaveProperty('paymentAccount', expect.any(Object));
        expect(user.paymentAccount).toHaveProperty('bank', expect.any(Object));
        expect(user.paymentAccount.bank.id).toEqual(bankId);
        expect(user.paymentAccount.bank.name).toEqual(bankName);
        expect(user.paymentAccount.bank.code).toEqual(bankCode);
        expect(user.paymentAccount.bankBranch).toEqual('Malang');
        expect(user.paymentAccount.name).toEqual('John Snow');
        expect(user.paymentAccount.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user id from token not found',
      async () => {
        await UserModel.create({
          _id: new Types.ObjectId(),
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when bank id not found',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send({ ...paymentPayload, bank: '620226aabffdc569e5e8b999' });

        expectHaveFailedMeta(body, 'Bank not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user inactive',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.INACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 with admin auth',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 with driver auth',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint}`)
          .set(Auth.driverAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    describe('With SP Employee Auth', () => {
      beforeEach(async () => {
        await initSPEmployee();
      });

      it(
        'responds with 200 and successfully updates payment account [SP Employee auth]',
        async () => {
          await UserModel.create({
            _id: serviceProviderId.toString(),
            name: 'First Service Provider',
            slug: slug('First Service Provider Inc.'),
            email: 'first@servicerprovider.com',
            password: 'password',
            status: GeneralEnum.Status.ACTIVE,
            phone: '081234564810',
            role: UserEnum.Role.SERVICE_PROVIDER,
            type: UserEnum.UserType.COMPANY,
            formattedId: firstServiceProviderFormattedUserId,
            company: {
              name: 'First Service Provider Inc.',
              email: 'sp-one-inc@gmail.com',
              phone: '089121456789',
              taxType: UserEnum.TaxType.PKP,
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

          const { status, body } = await request(app)
            .patch(`${endpoint}`)
            .set(Auth.SPEmployeeAuthHeader())
            .send(paymentPayload);

          expectHaveSuccessMeta(body, 'Successfully modified user’s payment account');
          expect(body).toHaveProperty('data', null);

          expect(status).toEqual(200);

          const user = await UserModel.findOne({ _id: serviceProviderId.toString() }).lean();

          expect(user).toHaveProperty('paymentAccount', expect.any(Object));
          expect(user.paymentAccount).toHaveProperty('bank', expect.any(Object));
          expect(user.paymentAccount.bank.id).toEqual(bankId);
          expect(user.paymentAccount.bank.name).toEqual(bankName);
          expect(user.paymentAccount.bank.code).toEqual(bankCode);
          expect(user.paymentAccount.bankBranch).toEqual('Malang');
          expect(user.paymentAccount.name).toEqual('John Snow');
          expect(user.paymentAccount.number).toEqual('1234567890');
        },
        TEST_TIMEOUT_MS,
      );
    });
  });

  describe('GET /v1/users/payment-accounts', () => {
    const endpoint = '/v1/users/payment-accounts/';

    const bankId = new Types.ObjectId();
    const firstCustomerFormattedUserId = 'CSR9001';
    const firstServiceProviderFormattedUserId = 'IDN2001';
    const bankName = 'Bank BCA';
    const bankCode = '014';

    const paymentPayload = {
      bank: bankId,
      bankBranch: 'Malang',
      name: 'John Snow',
      number: '1234567890',
    };

    beforeEach(async () => {
      await BankModel.create({
        _id: bankId,
        name: bankName,
        code: bankCode,
        country: country.id,
        createdBy: {
          userId: '61cad6a8cb39694efde0a99a',
          email: 'dummy@example.com',
          name: 'Dummy',
        },
      });
    });

    it(
      'responds with 200 and successfully get detail payment',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
          paymentAccount: {
            bank: {
              id: bankId,
              name: bankName,
              code: bankCode,
            },
            bankBranch: 'Malang',
            name: 'John Wick',
            number: '1234567890',
            updatedAt: 123,
            updatedBy: userInformation,
          },
          createdBy: userInformation,
          verifiedAt: 123,
        });

        const { status, body } = await request(app)
          .get(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully get user’s payment account');
        expect(status).toEqual(200);

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('bank', expect.any(Object));
        expect(body.data.bank.id).toEqual(bankId.toString());
        expect(body.data.bank.name).toEqual(bankName);
        expect(body.data.bank.code).toEqual(bankCode);

        expect(body.data.bankBranch).toEqual('Malang');
        expect(body.data.name).toEqual('John Wick');
        expect(body.data.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 and get detail payment account [service provider auth]',
      async () => {
        await UserModel.create({
          _id: serviceProviderId.toString(),
          name: 'First Service Provider',
          slug: slug('First Service Provider Inc.'),
          email: 'first@servicerprovider.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234564810',
          role: UserEnum.Role.SERVICE_PROVIDER,
          type: UserEnum.UserType.COMPANY,
          formattedId: firstServiceProviderFormattedUserId,
          company: {
            name: 'First Service Provider Inc.',
            email: 'sp-one-inc@gmail.com',
            phone: '089121456789',
            taxType: UserEnum.TaxType.PKP,
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
          paymentAccount: {
            bank: {
              id: bankId,
              name: bankName,
              code: bankCode,
            },
            bankBranch: 'Malang',
            name: 'John Wick',
            number: '1234567890',
            updatedAt: 123,
            updatedBy: userInformation,
          },
          createdBy: userInformation,
          verifiedAt: 123,
        });

        const { status, body } = await request(app)
          .get(`${endpoint}`)
          .set(Auth.serviceProviderAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully get user’s payment account');
        expect(status).toEqual(200);

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('bank', expect.any(Object));
        expect(body.data.bank.id).toEqual(bankId.toString());
        expect(body.data.bank.name).toEqual(bankName);
        expect(body.data.bank.code).toEqual(bankCode);

        expect(body.data.bankBranch).toEqual('Malang');
        expect(body.data.name).toEqual('John Wick');
        expect(body.data.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user id from token not found',
      async () => {
        await UserModel.create({
          _id: new Types.ObjectId(),
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
          paymentAccount: {
            bank: {
              id: bankId,
              name: bankName,
              code: bankCode,
            },
            bankBranch: 'Malang',
            name: 'John Wick',
            number: '1234567890',
            updatedAt: 123,
            updatedBy: userInformation,
          },
          createdBy: userInformation,
          verifiedAt: 123,
        });

        const { status, body } = await request(app)
          .get(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when payment account not found',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .get(`${endpoint}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'Payment account not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    describe('With SP Employee Auth', () => {
      beforeEach(async () => {
        await initSPEmployee();
      });

      it(
        'responds with 200 and get detail payment account [SP Employee auth]',
        async () => {
          await UserModel.create({
            _id: serviceProviderId.toString(),
            name: 'First Service Provider',
            slug: slug('First Service Provider Inc.'),
            email: 'first@servicerprovider.com',
            password: 'password',
            status: GeneralEnum.Status.ACTIVE,
            phone: '081234564810',
            role: UserEnum.Role.SERVICE_PROVIDER,
            type: UserEnum.UserType.COMPANY,
            formattedId: firstServiceProviderFormattedUserId,
            company: {
              name: 'First Service Provider Inc.',
              email: 'sp-one-inc@gmail.com',
              phone: '089121456789',
              taxType: UserEnum.TaxType.PKP,
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
            paymentAccount: {
              bank: {
                id: bankId,
                name: bankName,
                code: bankCode,
              },
              bankBranch: 'Malang',
              name: 'John Wick',
              number: '1234567890',
              updatedAt: 123,
              updatedBy: userInformation,
            },
            createdBy: userInformation,
            verifiedAt: 123,
          });

          const { status, body } = await request(app)
            .get(`${endpoint}`)
            .set(Auth.SPEmployeeAuthHeader())
            .send(paymentPayload);

          expectHaveSuccessMeta(body, 'Successfully get user’s payment account');
          expect(status).toEqual(200);

          expect(body).toHaveProperty('data', expect.any(Object));
          expect(body.data).toHaveProperty('bank', expect.any(Object));
          expect(body.data.bank.id).toEqual(bankId.toString());
          expect(body.data.bank.name).toEqual(bankName);
          expect(body.data.bank.code).toEqual(bankCode);

          expect(body.data.bankBranch).toEqual('Malang');
          expect(body.data.name).toEqual('John Wick');
          expect(body.data.number).toEqual('1234567890');
        },
        TEST_TIMEOUT_MS,
      );
    });
  });

  describe('PATCH /v1/users/:userId/payment-accounts', () => {
    const endpoint = (userId: string): string => `/v1/users/${userId}/payment-accounts/`;

    const bankId = new Types.ObjectId();
    const firstCustomerFormattedUserId = 'CSR9001';
    const firstServiceProviderFormattedUserId = 'IDN2001';
    const bankName = 'Bank BCA';
    const bankCode = '014';

    const paymentPayload = {
      bank: bankId,
      bankBranch: 'Malang',
      name: 'John Snow',
      number: '1234567890',
    };

    beforeEach(async () => {
      await BankModel.create({
        _id: bankId,
        name: bankName,
        code: bankCode,
        country: country.id,
        createdBy: {
          userId: '61cad6a8cb39694efde0a99a',
          email: 'dummy@example.com',
          name: 'Dummy',
        },
      });
    });

    it(
      'responds with 200 and successfully updates service provider payment account [internal auth]',
      async () => {
        await UserModel.create({
          _id: serviceProviderId.toString(),
          name: 'First Service Provider',
          slug: slug('First Service Provider Inc.'),
          email: 'first@servicerprovider.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234564810',
          role: UserEnum.Role.SERVICE_PROVIDER,
          type: UserEnum.UserType.COMPANY,
          formattedId: firstServiceProviderFormattedUserId,
          company: {
            name: 'First Service Provider Inc.',
            email: 'sp-one-inc@gmail.com',
            phone: '089121456789',
            taxType: UserEnum.TaxType.PKP,
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

        const { status, body } = await request(app)
          .patch(`${endpoint(serviceProviderId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully modified user’s payment account');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const user = await UserModel.findOne({ _id: serviceProviderId.toString() }).lean();

        expect(user).toHaveProperty('paymentAccount', expect.any(Object));
        expect(user.paymentAccount).toHaveProperty('bank', expect.any(Object));
        expect(user.paymentAccount.bank.id).toEqual(bankId);
        expect(user.paymentAccount.bank.name).toEqual(bankName);
        expect(user.paymentAccount.bank.code).toEqual(bankCode);
        expect(user.paymentAccount.bankBranch).toEqual('Malang');
        expect(user.paymentAccount.name).toEqual('John Snow');
        expect(user.paymentAccount.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 when updates customer payment account [internal auth]',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'Not allowed');
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user id from token not found',
      async () => {
        await UserModel.create({
          _id: new Types.ObjectId(),
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint(serviceProviderId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when bank id not found',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send({ ...paymentPayload, bank: '620226aabffdc569e5e8b999' });

        expectHaveFailedMeta(body, 'Bank not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user inactive',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.INACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .patch(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 with customer auth',
      async () => {
        const { status, body } = await request(app)
          .patch(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 with service provider auth',
      async () => {
        const { status, body } = await request(app)
          .patch(`${endpoint(serviceProviderId.toString())}`)
          .set(Auth.driverAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 with driver auth',
      async () => {
        const { status, body } = await request(app)
          .patch(`${endpoint(serviceProviderId.toString())}`)
          .set(Auth.driverAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('GET /v1/users/:userId/payment-accounts', () => {
    const endpoint = (userId: string): string => `/v1/users/${userId}/payment-accounts/`;

    const bankId = new Types.ObjectId();
    const firstCustomerFormattedUserId = 'CSR9001';
    const bankName = 'Bank BCA';
    const bankCode = '014';

    const paymentPayload = {
      bank: bankId,
      bankBranch: 'Malang',
      name: 'John Snow',
      number: '1234567890',
    };

    beforeEach(async () => {
      await BankModel.create({
        _id: bankId,
        name: bankName,
        code: bankCode,
        country: country.id,
        createdBy: {
          userId: '61cad6a8cb39694efde0a99a',
          email: 'dummy@example.com',
          name: 'Dummy',
        },
      });
    });

    it(
      'responds with 200 and successfully get detail payment',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
          paymentAccount: {
            bank: {
              id: bankId,
              name: bankName,
              code: bankCode,
            },
            bankBranch: 'Malang',
            name: 'John Wick',
            number: '1234567890',
            updatedAt: 123,
            updatedBy: userInformation,
          },
          createdBy: userInformation,
          verifiedAt: 123,
        });

        const { status, body } = await request(app)
          .get(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveSuccessMeta(body, 'Successfully get user’s payment account');
        expect(status).toEqual(200);

        expect(body).toHaveProperty('data', expect.any(Object));
        expect(body.data).toHaveProperty('bank', expect.any(Object));
        expect(body.data.bank.id).toEqual(bankId.toString());
        expect(body.data.bank.name).toEqual(bankName);
        expect(body.data.bank.code).toEqual(bankCode);

        expect(body.data.bankBranch).toEqual('Malang');
        expect(body.data.name).toEqual('John Wick');
        expect(body.data.number).toEqual('1234567890');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 and get detail payment account [service provider auth]',
      async () => {
        const { status, body } = await request(app)
          .get(`${endpoint('12345')}`)
          .set(Auth.serviceProviderAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 and get detail payment account [customer auth]',
      async () => {
        const { status, body } = await request(app)
          .get(`${endpoint('12345')}`)
          .set(Auth.customerCompanyAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 and get detail payment account [driver auth]',
      async () => {
        const { status, body } = await request(app)
          .get(`${endpoint('12345')}`)
          .set(Auth.driverAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when user id from token not found',
      async () => {
        const { status, body } = await request(app)
          .get(`${endpoint(serviceProviderId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'User not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when payment account not found',
      async () => {
        await UserModel.create({
          _id: customerCompanyId,
          parents: [
            {
              user: serviceProviderId.toString(),
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
              approvalStatusAt: 123,
            },
          ],
          name: 'First Customer',
          email: 'first@customer.com',
          password: 'password',
          status: GeneralEnum.Status.ACTIVE,
          phone: '081214567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
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
        });

        const { status, body } = await request(app)
          .get(`${endpoint(customerCompanyId.toString())}`)
          .set(Auth.adminAuthHeader())
          .send(paymentPayload);

        expectHaveFailedMeta(body, 'Payment account not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('POST /v1/users/pin', () => {
    const endpoint = '/v1/users/pin/';
    const pin = '123456';
    const requestBody = {
      pin,
    };

    beforeEach(async () => {
      await UserModel.create({
        _id: driverId,
        formattedId: 'IDN0001-WKR0001',
        parents: [
          {
            user: '61fa55158c19d828b8e11fd3',
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: 1644336364,
            _id: '620294ebe413cf609a8a7a20',
          },
        ],
        name: 'John Snow',
        email: 'john2@gmail.com',
        password: '$2b$10$d/.JCZx/g0lr1c8tPMozhO/SmvyOiLnZwhe/lXCaJm2VkrWtpmcIa',
        status: GeneralEnum.Status.ACTIVE,
        phone: '2323',
        role: UserEnum.Role.DRIVER,

        driver: {
          nationalId: '1234567890',
          address: 'jl test',
          dateOfBirth: '1996-01-13',
          bloodType: UserEnum.BloodType.A,
          employeeType: UserEnum.EmployeeType.Own,
          licenseType: UserEnum.DriverLicenseType.B2,
          licenseExpiryDate: '2027-01-01',
          driverLicenseId: '1234567891',
          isAvailable: true,
          updatedAt: null,
        },
        individual: null,
        verifiedAt: null,
        createdAt: 1644336257,
        createdBy: {
          userId: '620293e8fb643270d0496bc3',
          email: 'admin@serviceprovider.com',
          name: 'Service Provider',
        },
        updatedAt: 1646647391,
        deletedAt: null,
        __v: 0,
        updatedBy: { userId: '620294ebe413cf609a8a7a1f', email: 'john2@gmail.com', name: 'John Snow' },
        pin: await hashPassword(pin),
      });
    });

    it(
      'sucessfully check pin and responds with 201',
      async () => {
        const { status, body } = await request(app).post(endpoint).set(Auth.driverAuthHeader()).send(requestBody);

        expectHaveSuccessMeta(body, 'Pin is correct');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 404 if driver user deleted',
      async () => {
        // soft deletes the user first
        await UserModel.updateOne({ _id: driverId }, { deletedAt: getCurrentUnixTimestamp() });

        const { status, body } = await request(app).post(endpoint).set(Auth.driverAuthHeader()).send(requestBody);

        expectHaveFailedMeta(body, 'User not found');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 when pin is invalid',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.driverAuthHeader())
          .send({ ...requestBody, pin: '555555' });

        expectHaveFailedMeta(body, 'Invalid pin');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 when pin length not 6 character',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .set(Auth.driverAuthHeader())
          .send({ ...requestBody, pin: '123' });

        expectHaveFailedMeta(body, '"pin" length must be 6 characters long');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('GET /v1/users/options', () => {
    const endpoint = '/v1/users/options/';

    const notMineDriverIds = [new Types.ObjectId().toString()];
    const mineDriverIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];
    const serviceProviderIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];

    const userFields = [
      constructUserInternalFields({
        _id: internalId,
      }),
      constructUserCustomerFields(UserEnum.UserType.INDIVIDUAL, {
        formattedId: 'CSR0001',
        parents: [
          {
            user: serviceProviderTokenData.userId,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            customerGroup: new Types.ObjectId(),
          },
        ],
      }),
      constructUserDriverFields({
        _id: mineDriverIds[0],
        formattedId: `${serviceProviderTokenData.formattedId}-WRK000001`,
        name: 'First Driver',
        phone: '01234567111',
        email: 'driver1@sp.com',
        driver: {
          isAvailable: true,
        },
      }),
      constructUserDriverFields({
        _id: mineDriverIds[1],
        formattedId: `${serviceProviderTokenData.formattedId}-WRK000002`,
        name: 'Second Driver',
        phone: '01234567222',
        email: 'driver2@sp.com',
        driver: {
          isAvailable: false,
        },
      }),
      constructUserServiceProviderFields({
        _id: serviceProviderIds[0],
        name: 'First Service Provider Options',
        slug: 'TEST-1234',
        phone: '01234567121',
        email: 'user1@serviceprovider.com',
        formattedId: 'IDN0011',
        status: GeneralEnum.Status.ACTIVE,
        company: {
          name: 'First Service Provider Company',
          email: 'sp-one-inc@gmail.com',
          taxId: '123256708',
          businessLicense: '123456711',
        },
      }),
      constructUserServiceProviderFields({
        _id: serviceProviderIds[1],
        name: 'Second Service Provider Options',
        slug: 'OPT-1234',
        phone: '01234567122',
        email: 'user2@serviceprovider.com',
        formattedId: 'IDN0012',
        status: GeneralEnum.Status.INACTIVE,
        company: {
          name: 'Second Service Provider Company',
          email: 'sp-two-inc@gmail.com',
          taxId: '1232567089',
          businessLicense: '1234567119',
        },
      }),
      constructUserDriverFields({
        _id: notMineDriverIds[0],
        parents: [
          {
            user: new Types.ObjectId(),
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            approvalStatusAt: getCurrentUnixTimestamp(),
          },
        ],
        formattedId: `IDN900099-WRK000003`,
        name: 'Not my driver',
        phone: '01234567211',
        email: 'not-my-driver@sp.com',
      }),
      constructUserCustomerFields(UserEnum.UserType.COMPANY, {
        formattedId: 'CSR0002',
        parents: [
          {
            user: serviceProviderTokenData.userId,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
          },
        ],
      }),
    ];

    beforeEach(async () => {
      await UserModel.insertMany(userFields);
    }, TEST_TIMEOUT_MS);

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with internal auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(2);
        expect(status).toEqual(200);
        body.data.forEach((data) => {
          expect(serviceProviderIds).toContainEqual(data.id);
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with service provider auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[4]._id);
        expect(body.data[0].name).toEqual(userFields[4].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with internal auth token and show slug',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(2);
        expect(body.data[0].serviceProviderSlug).toEqual('first-service-provider-company');
        expect(status).toEqual(200);
        body.data.forEach((data) => {
          expect(serviceProviderIds).toContainEqual(data.id);
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role DRIVER with service provider auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(2);
        body.data.forEach((data) => {
          expect(mineDriverIds).toContainEqual(data.id);
          expect(data.id).not.toEqual(notMineDriverIds[0]);
        });

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role CUSTOMER with service provider auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.CUSTOMER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(2);
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: userFields[1]._id.toString() }),
            expect.objectContaining({ id: userFields[7]._id.toString() }),
          ]),
        );

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role CUSTOMER with internal auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.CUSTOMER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(2);
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: userFields[1]._id.toString() }),
            expect.objectContaining({ id: userFields[7]._id.toString() }),
          ]),
        );

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role CUSTOMER with service provider auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: 'CUSTOMER', isWithoutCustomerGroup: true });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[7]._id.toString());

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with customer company auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.customerCompanyAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[4]._id);
        expect(body.data[0].name).toEqual(userFields[4].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with customer individual auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.customerIndividualAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[4]._id);
        expect(body.data[0].name).toEqual(userFields[4].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with search success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.customerIndividualAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, search: 'First' });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[4]._id);
        expect(body.data[0].name).toEqual(userFields[4].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role DRIVER with search success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, search: 'First' });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[2]._id);
        expect(body.data[0].name).toEqual(userFields[2].name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role DRIVER with search and isAvailable true success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, search: 'First', isAvailable: true });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[2]._id);
        expect(body.data[0].name).toEqual(userFields[2].name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role DRIVER with search and isAvailable false success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, search: 'Second', isAvailable: false });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[3]._id);
        expect(body.data[0].name).toEqual(userFields[3].name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with search and status ACTIVE success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, search: 'First', status: GeneralEnum.Status.ACTIVE });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[4]._id);
        expect(body.data[0].name).toEqual(userFields[4].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 200 for get user options role SERVICE_PROVIDER with search and status INACTIVE success',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, search: 'Second', status: GeneralEnum.Status.INACTIVE });

        expectHaveSuccessMeta(body, 'Successfully get users');

        expect(body).toHaveProperty('data', expect.any(Array));
        expect(body.data.length).toEqual(1);
        expect(body.data[0].id).toEqual(userFields[5]._id);
        expect(body.data[0].name).toEqual(userFields[5].company.name);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if a mandatory query params is not given',
      async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.adminAuthHeader());

        expectHaveFailedMeta(body, '"role" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if role query params is wrong',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.INTERNAL });

        expectHaveFailedMeta(
          body,
          '"role" must be one of [DRIVER, SERVICE_PROVIDER, CUSTOMER, SERVICE_PROVIDER_EMPLOYEE]',
        );

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if status query params is wrong',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.adminAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, status: 'SUPER' });

        expectHaveFailedMeta(body, '"status" must be one of [ACTIVE, INACTIVE, ]');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 if isAvailable query params is wrong',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, isAvailable: 'none' });

        expectHaveFailedMeta(body, '"isAvailable" must be a boolean');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 if called with wrong auth token',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.driverAuthHeader())
          .query({ role: UserEnum.Role.DRIVER });

        expectHaveFailedMeta(body, "The key role doesn't have access.");

        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 if isAvailable called with role other than DRIVER',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, isAvailable: true });

        expectHaveFailedMeta(body, '"isAvailable" is not allowed');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 if status query params called with auth token other than internal',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.SERVICE_PROVIDER, status: GeneralEnum.Status.ACTIVE });

        expectHaveFailedMeta(body, 'Not allowed');

        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 if user options with search query params not found',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .query({ role: UserEnum.Role.DRIVER, search: 'admin' });

        expectHaveFailedMeta(body, 'No user matched');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    describe('With SP Employee Auth', () => {
      beforeEach(async () => {
        await initSPEmployee();
        await initServiceProvider();
      });

      it(
        'responds with 200 for get user options role SERVICE_PROVIDER',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.SERVICE_PROVIDER });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(2);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role DRIVER',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.DRIVER });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(2);
          body.data.forEach((data) => {
            expect(mineDriverIds).toContainEqual(data.id);
            expect(data.id).not.toEqual(notMineDriverIds[0]);
          });

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role CUSTOMER',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.CUSTOMER });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(2);
          expect(body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: userFields[1]._id.toString() }),
              expect.objectContaining({ id: userFields[7]._id.toString() }),
            ]),
          );

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role CUSTOMER',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: 'CUSTOMER', isWithoutCustomerGroup: true });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(1);
          expect(body.data[0].id).toEqual(userFields[7]._id.toString());

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role DRIVER with search success',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.DRIVER, search: 'First' });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(1);
          expect(body.data[0].id).toEqual(userFields[2]._id);
          expect(body.data[0].name).toEqual(userFields[2].name);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role DRIVER with search and isAvailable true success',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.DRIVER, search: 'First', isAvailable: true });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(1);
          expect(body.data[0].id).toEqual(userFields[2]._id);
          expect(body.data[0].name).toEqual(userFields[2].name);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );

      it(
        'responds with 200 for get user options role DRIVER with search and isAvailable false success',
        async () => {
          const { status, body } = await request(app)
            .get(endpoint)
            .set(Auth.SPEmployeeAuthHeader())
            .query({ role: UserEnum.Role.DRIVER, search: 'Second', isAvailable: false });

          expectHaveSuccessMeta(body, 'Successfully get users');

          expect(body).toHaveProperty('data', expect.any(Array));
          expect(body.data.length).toEqual(1);
          expect(body.data[0].id).toEqual(userFields[3]._id);
          expect(body.data[0].name).toEqual(userFields[3].name);

          expect(status).toEqual(200);
        },
        TEST_TIMEOUT_MS,
      );
    });
  });
});
