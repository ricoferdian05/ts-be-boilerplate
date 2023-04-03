import request from 'supertest';

import app from '@server/app';
import { Auth, serviceProviderTokenData, SPEmployeeTokenData } from '@v1-tests/fixtures/auth';
import { UserModel } from '@models';
import { expectHaveFailedMeta, expectHaveSuccessMeta } from '@tests/helper/general';
import { constructUserServiceProviderFields, constructUserSPEmployeeFields } from '@v1-tests/fixtures/user';
import { GeneralEnum, IUser, UserEnum } from '@server/definitions';

describe('User routes', () => {
  describe('GET /v1/users/balances', () => {
    const endpoint = '/v1/users/balances';

    let serviceProvider: IUser.IDataSchema;

    beforeEach(async () => {
      [serviceProvider] = await UserModel.insertMany([
        constructUserServiceProviderFields({
          _id: serviceProviderTokenData.userId,
          pendingBalance: 100_000,
          withdrawableBalance: 250_000,
        }),
        constructUserSPEmployeeFields({
          _id: SPEmployeeTokenData.userId,
          parents: [
            {
              user: serviceProviderTokenData.userId,
              approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            },
          ],
        }),
      ]);
    });

    it('return 404 if user is not found', async () => {
      await serviceProvider.updateOne({ status: GeneralEnum.Status.INACTIVE });

      const { status, body } = await request(app).get(endpoint).set(Auth.serviceProviderAuthHeader());

      expectHaveFailedMeta(body, 'User not found');
      expect(status).toEqual(404);
    });

    describe("with service provider's token", () => {
      it("return user's balances", async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.serviceProviderAuthHeader());

        expectHaveSuccessMeta(body, 'Successfully get user balances');
        expect(status).toEqual(200);

        expect(body.data).toEqual({
          pendingBalance: serviceProvider.pendingBalance,
          withdrawableBalance: serviceProvider.withdrawableBalance,
        });
      });

      it("return user's balances even without previous order", async () => {
        await serviceProvider.updateOne({ $unset: { pendingBalance: 1, withdrawableBalance: 1 } });

        const { status, body } = await request(app).get(endpoint).set(Auth.serviceProviderAuthHeader());

        expectHaveSuccessMeta(body, 'Successfully get user balances');
        expect(status).toEqual(200);

        expect(body.data).toEqual({
          pendingBalance: 0,
          withdrawableBalance: 0,
        });
      });
    });

    describe("with service provider employee's token", () => {
      it("return its employer's balances", async () => {
        const { status, body } = await request(app).get(endpoint).set(Auth.SPEmployeeAuthHeader());

        expectHaveSuccessMeta(body, 'Successfully get user balances');
        expect(status).toEqual(200);

        expect(body.data).toEqual({
          pendingBalance: serviceProvider.pendingBalance,
          withdrawableBalance: serviceProvider.withdrawableBalance,
        });
      });
    });
  });
});
