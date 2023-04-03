import request from 'supertest';

import app from '@server/app';
import { GeneralEnum } from '@definitions';
import { UserModel } from '@models';
import { TEST_TIMEOUT_MS } from '@tests/fixtures/constant';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { constructUserServiceProviderFields, serviceProviderId } from '@v1-tests/fixtures/user';
import { Auth } from '../../fixtures/auth';

describe('User routes', () => {
  describe('GET /v1/users/company-detail/:slug', () => {
    const endpoint = (slug) => `/v1/users/company-detail/${slug}`;
    const userFields = [
      constructUserServiceProviderFields({
        _id: serviceProviderId,
        name: 'First Service Provider Options',
        slug: 'first-service-provider-company',
        phone: '01234567121',
        email: 'user1@serviceprovider.com',
        formattedId: 'IDN0001',
        status: GeneralEnum.Status.ACTIVE,
        company: {
          name: 'First Service Provider Company',
          email: 'sp-one-inc@gmail.com',
          taxId: '123256708',
          businessLicense: '123456711',
          photos: [
            'profiles/company-detail/IDN00011649292799dcGZHSbdUoF2.png',
            'profiles/company-detail/IDN00011649592799dcLZGSbdUoH2.png',
          ],
          description: 'First Service Provider Company provide a better choice for logistics',
          additionalHandling: ['General'],
          websiteLink: 'https://www.hzn.one/',
        },
      }),
    ];

    beforeEach(async () => {
      await UserModel.create(userFields);
    });

    it(
      'Respond with 200 and get company detail',
      async () => {
        const { status, body } = await request(app)
          .get(endpoint(userFields[0].slug))
          .set(Auth.serviceProviderAuthHeader());

        expectHaveSuccessMeta(body, "Successfully get service provider's company detail");
        expect(status).toEqual(200);
        expect(body.data.company.photos).toEqual(userFields[0].company.photos);
        expect(body.data.company.description).toEqual(userFields[0].company.description);
        expect(body.data.company.additionalHandling).toEqual(userFields[0].company.additionalHandling);
        expect(body.data.company.websiteLink).toEqual(userFields[0].company.websiteLink);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Respond with 404 service provider not found',
      async () => {
        await UserModel.remove();
        const { status, body } = await request(app).get(endpoint(userFields[0].slug));

        expectHaveFailedMeta(body, 'Service provider not found');
        expect(status).toEqual(404);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
