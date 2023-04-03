import { GeneralEnum, IPendingBalanceLog, PendingBalanceLogEnum } from '@server/definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { Types } from 'mongoose';
import { serviceProviderId } from './user';

export function constructPendingBalanceLogFields(
  customFields: Partial<IPendingBalanceLog.IData> = {},
): IPendingBalanceLog.IData {
  const { reference, ...otherFields } = customFields;
  return {
    serviceProvider: serviceProviderId,
    reference: reference || [
      {
        name: PendingBalanceLogEnum.ReferenceName.ORDER,
        id: new Types.ObjectId().toString(),
      },
    ],
    event: GeneralEnum.BalanceEvent.ORDER_CONFIRMED,
    previousAmount: 0,
    currentAmount: 10_000,
    amountDifference: 10_000,
    createdAt: getCurrentUnixTimestamp(),
    ...otherFields,
  };
}
