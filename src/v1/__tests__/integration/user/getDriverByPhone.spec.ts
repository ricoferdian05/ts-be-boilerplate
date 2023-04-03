import slug from 'slug';
import request from 'supertest';
import { Types } from 'mongoose';

import app from '@server/app';

import { IUser, ICountry, IProvince, ICity, UserEnum, GeneralEnum } from '@definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { UserModel, CountryModel, ProvinceModel, CityModel } from '@models';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { serviceProviderId, userInformation, driverId } from '@v1-tests/fixtures/user';

const TEST_TIMEOUT_MS = 5000;

let country: ICountry.IDataSchema;
let province: IProvince.IDataSchema;
let city: ICity.IDataSchema;
let serviceProvider: IUser.IDataSchema;

describe('User routes', () => {
  describe('GET /v1/users/:formattedUserId', () => {
    const endpoint = '/v1/users/drivers/phones/';
    const firstDriverFormattedUserId = 'IDN0001-WKR9001';
    const firstServiceProviderFormattedUserId = 'IDN2001';

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

      [serviceProvider] = await UserModel.insertMany([
        {
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
      ]);
    });

    it(
      'returns 200 when driver phone',
      async () => {
        const registeredPhone = '081234567890';
        const { status, body } = await request(app).get(`${endpoint}${registeredPhone}`);

        expectHaveSuccessMeta(body, 'Successfully get driver');

        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 200 when driver phone prefix is 62',
      async () => {
        const registeredPhone = '6281234567890';
        const { status, body } = await request(app).get(`${endpoint}${registeredPhone}`);

        expectHaveSuccessMeta(body, 'Successfully get driver');

        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'returns 404 when use service provider phone',
      async () => {
        const { status, body } = await request(app).get(`${endpoint}${serviceProvider.phone}`);

        expectHaveFailedMeta(body, 'Driver not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
