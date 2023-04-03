import request from 'supertest';
import slug from 'slug';
import { Types } from 'mongoose';

import app from '@server/app';
import { ICountry, IProvince, ICity, UserEnum, GeneralEnum } from '@definitions';
import { UserModel, CountryModel, ProvinceModel, CityModel } from '@models';
import { hashPassword } from '@utils/password';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { serviceProviderId, userInformation } from '@v1-tests/fixtures/user';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';

let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;

describe('User routes', () => {
  describe('POST /v1/users/registrations/customers', () => {
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

    const endpoint = '/v1/users/registrations/customers/';
    const requestBody = {
      name: 'Customer',
      email: 'customer@gmail.com',
      password: '123qwe123QWE!',
      phone: '08957025700001',
      companyName: 'Customer Inc',
      companyEmail: 'customer-inc-9@gmail.com',
      companyPhone: '08957025600001',
      taxId: '16789123456',
      businessLicense: '123456710',
      businessLicenseType: UserEnum.BusinessLicenseType.SIUP,
      provinceId: '',
      cityId: '',
      countryId: '',
      registrationType: UserEnum.UserType.COMPANY,
      serviceProviderSlug: slug('Service Provider One Inc.'),
    };

    beforeEach(async () => {
      await UserModel.create({
        name: 'Provider One Active',
        slug: requestBody.serviceProviderSlug,
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
        },
        createdBy: userInformation,
        verifiedAt: 123,
      });

      requestBody['countryId'] = country.id;
      requestBody['provinceId'] = province.id;
      requestBody['cityId'] = city.id;
    });

    it(
      'sucessfully create new customer user as a company with photo and responds with 201',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created a customer user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.CUSTOMER })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.CUSTOMER }).lean();

        expect(user.company?.name).toEqual(requestBody.companyName);
        expect(user.role).toEqual(UserEnum.Role.CUSTOMER);
        expect(user.photoUrl).toContain('profile');
        expect(user.source).toEqual(UserEnum.UserSource.TMS);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new customer user as a company for Marketplace Delivery',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('userSource', UserEnum.UserSource['Marketplace Delivery'])
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created a customer user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.CUSTOMER })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.CUSTOMER }).lean();

        expect(user.company?.name).toEqual(requestBody.companyName);
        expect(user.role).toEqual(UserEnum.Role.CUSTOMER);
        expect(user.photoUrl).toContain('profile');
        expect(user.source).toEqual(UserEnum.UserSource['Marketplace Delivery']);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'sucessfully create new customer user as an individual with photo and responds with 201',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .field('name', requestBody.name)
          .field('email', requestBody.email)
          .field('password', requestBody.password)
          .field('phone', requestBody.phone)
          .field('registrationType', UserEnum.UserType.INDIVIDUAL)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveSuccessMeta(body, 'Successfully created a customer user');
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(201);
        expect(await UserModel.countDocuments({ role: UserEnum.Role.CUSTOMER })).toEqual(1);

        const user = await UserModel.findOne({ role: UserEnum.Role.CUSTOMER }).lean();

        expect(user.type).toEqual(UserEnum.UserType.INDIVIDUAL);
        expect(user.role).toEqual(UserEnum.Role.CUSTOMER);
        expect(user.photoUrl).toContain('profile');
        expect(user.source).toEqual(UserEnum.UserSource.TMS);
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
            serviceProviderId: serviceProviderId,
          });

        expectHaveFailedMeta(body, '"email" is required');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with duplicate email',
      async () => {
        const hashedPassword = await hashPassword('123');
        await UserModel.create({
          name: 'Customer One',
          slug: slug('Customer One Inc.'),
          email: requestBody.email,
          password: hashedPassword,
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
          formattedId: 'CSR0101',
          company: {
            name: 'Customer One Inc.',
            email: 'customer-one-inc@gmail.com',
            phone: '089123456789',
            taxId: '123416709',
            businessLicense: '123456712',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with duplicate email when use uppercase email ',
      async () => {
        const hashedPassword = await hashPassword('123');
        await UserModel.create({
          name: 'Customer One',
          slug: slug('Customer One Inc.'),
          email: requestBody.email.toUpperCase(),
          password: hashedPassword,
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
          formattedId: 'CSR0101',
          company: {
            name: 'Customer One Inc.',
            email: 'customer-one-inc@gmail.com',
            phone: '089123456789',
            taxId: '123416709',
            businessLicense: '123456712',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 400 with duplicate company email',
      async () => {
        const hashedPassword = await hashPassword('123');
        await UserModel.create({
          name: 'Customer One',
          slug: slug('Customer One Inc.'),
          email: 'customer-one@gmail.com',
          password: hashedPassword,
          status: GeneralEnum.Status.ACTIVE,
          phone: '081234567810',
          role: UserEnum.Role.CUSTOMER,
          type: UserEnum.UserType.COMPANY,
          formattedId: 'CSR0101',
          company: {
            name: 'Customer One Inc.',
            email: requestBody.companyEmail.toUpperCase(),
            phone: '089123456789',
            taxId: '123416709',
            businessLicense: '123456712',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Company email must be unique');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 404 when service provider is not found',
      async () => {
        const { status, body } = await request(app)
          .post(endpoint)
          .field('name', requestBody.name)
          .field('email', 'custom123@gmail.com')
          .field('password', requestBody.password)
          .field('phone', '0891234567898')
          .field('registrationType', UserEnum.UserType.INDIVIDUAL)
          .field('serviceProviderSlug', slug('not found'))
          .attach('photo', 'src/v1/__tests__/files/dummyPhoto.png');

        expectHaveFailedMeta(body, 'Service provider not found');

        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 500 if a format photo is not jpg,jpeg, or png',
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
          .field('countryId', country.id)
          .field('provinceId', requestBody.provinceId)
          .field('cityId', requestBody.cityId)
          .field('registrationType', UserEnum.UserType.COMPANY)
          .field('serviceProviderSlug', requestBody.serviceProviderSlug)
          .attach('photo', 'src/v1/__tests__/files/dummyWrongFile.json');

        expectHaveFailedMeta(body, 'Only image/jpg,image/jpeg,image/png format allowed!');

        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
