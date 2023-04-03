import request from 'supertest';

import app from '@server/app';
import { Auth } from '@v1-tests/fixtures/auth';
import { GeneralEnum } from '@definitions';
import { UserModel } from '@models';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { constructUserServiceProviderFields, serviceProviderId } from '@v1-tests/fixtures/user';

describe('User routes', () => {
  describe('PATCH /v1/users/company-detail', () => {
    const endpoint = '/v1/users/company-detail';
    const requestBody = {
      description: 'First Service Provider Company provide a better choice for logistics',
      additionalHandling: ['General'],
      websiteLink: 'https://www.hzn.one/',
      currentImages: ['profile/company-detail/IDN00031658752436hvrj9LcEkfGH.jpeg'],
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
      'Respond with 200 and update company detail',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('additionalHandling', requestBody.additionalHandling)
          .field('websiteLink', requestBody.websiteLink)
          .field('currentImages', requestBody.currentImages[0]);

        expectHaveSuccessMeta(body, "Successfully modified service provider's company detail");
        expect(body).toHaveProperty('data', null);

        expect(status).toEqual(200);

        const user = await UserModel.findById(serviceProviderId).lean();
        expect(user.company.description).toEqual(requestBody.description);
        expect(user.company.additionalHandling).toEqual(requestBody.additionalHandling);
        expect(user.company.websiteLink).toEqual(requestBody.websiteLink);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'responds with 403 for failed update company detail with wrong authorizations',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.adminAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('additionalHandling', requestBody.additionalHandling)
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(body, "The key role doesn't have access.");
        expect(status).toEqual(403);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 400 if there is 6 photos files',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('additionalHandling', requestBody.additionalHandling)
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(body, 'photos files error Unexpected field');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 400 if photo file format not allowed',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyWrongFile.json')
          .attach('photos', 'src/v1/__tests__/files/dummyWrongFile.json')
          .attach('photos', 'src/v1/__tests__/files/dummyWrongFile.json')
          .attach('photos', 'src/v1/__tests__/files/dummyWrongFile.json')
          .attach('photos', 'src/v1/__tests__/files/dummyWrongFile.json')
          .field('description', requestBody.description)
          .field('additionalHandling', requestBody.additionalHandling)
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(body, 'Only image/jpg,image/jpeg,image/png format allowed!');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 400 if there no additional handling value',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(body, '"additionalHandling" is required');
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 400 if there any wrong additional handling value',
      async () => {
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('additionalHandling', ['Unknown Handling'])
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(
          body,
          '"value" must be one of [General, Stackable, Non stackable, Dangerous Goods, Batteries, Temperature Control, Fragile, others]',
        );
        expect(status).toEqual(400);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 404 if no service provider found',
      async () => {
        await UserModel.remove();
        const { status, body } = await request(app)
          .patch(endpoint)
          .set(Auth.serviceProviderAuthHeader())
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .attach('photos', 'src/v1/__tests__/files/dummyPhoto.png')
          .field('description', requestBody.description)
          .field('additionalHandling', requestBody.additionalHandling)
          .field('currentImages', requestBody.currentImages[0])
          .field('websiteLink', requestBody.websiteLink);

        expectHaveFailedMeta(body, 'Service provider not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
