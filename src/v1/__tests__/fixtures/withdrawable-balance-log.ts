import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import {
  GeneralEnum,
  IWithdrawableBalanceLog,
  PendingBalanceLogEnum,
  WithdrawableBalanceLogEnum,
} from '@server/definitions';
import { serviceProviderId } from './user';

export function constructWithdrawableBalanceLogFields(
  event: GeneralEnum.BalanceEvent,
  customFields: any = {},
): IWithdrawableBalanceLog.IData {
  const { histories, beneficiary, reference, ...otherCustomFields } = customFields;

  const fields = {
    event,
    amount: 10_000,
    serviceProvider: serviceProviderId,
    createdAt: dayjs().subtract(1, 'hour').unix(),
  };

  if (event === GeneralEnum.BalanceEvent.WITHDRAW_REQUESTED) {
    fields['platform'] = WithdrawableBalanceLogEnum.Platform.manual;
    fields['beneficiary'] = {
      bank: new Types.ObjectId(),
      accountNumber: faker.finance.account(),
      accountName: faker.finance.accountName(),
      ...beneficiary,
    };
    fields['histories'] = histories || [
      {
        status: WithdrawableBalanceLogEnum.Status.SUCCESS,
        createdAt: dayjs().unix(),
      },
      {
        status: WithdrawableBalanceLogEnum.Status.PENDING,
        createdAt: dayjs().subtract(1, 'hour').unix(),
      },
    ];
  } else {
    fields['reference'] = reference || [
      {
        name: PendingBalanceLogEnum.ReferenceName.ORDER,
        id: new Types.ObjectId().toString(),
      },
    ];
    fields['histories'] = histories || [
      {
        status: WithdrawableBalanceLogEnum.Status.PENDING,
        createdAt: dayjs().subtract(1, 'hour').unix(),
      },
    ];
  }

  return {
    ...fields,
    ...otherCustomFields,
  };
}
