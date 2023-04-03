import { faker } from '@faker-js/faker';
import { IBank } from '@server/definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { Types } from 'mongoose';
import { userInformation } from './user';

export function constructBankFields(customFields: Partial<IBank.IDataLean> = {}): IBank.IDataLean {
  return {
    _id: new Types.ObjectId().toString(),
    name: faker.company.name(),
    code: faker.datatype.number({ min: 100, max: 999 }).toString(),
    country: new Types.ObjectId().toString(),
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...customFields,
  };
}
