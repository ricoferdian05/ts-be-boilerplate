import { Types } from 'mongoose';

import { IUser } from '@definitions';

export function constructPaymentAccountFields(customFields = {}): IUser.IData['paymentAccount'] {
  const { bank, ...otherCustomFields } = customFields as any;

  return {
    bank: {
      id: new Types.ObjectId(),
      name: 'Bank Indonesia',
      code: '000',
    },
    bankBranch: 'Jakarta Pusat',
    name: 'Johnny Cash',
    number: '123456789',
    ...otherCustomFields,
  };
}
