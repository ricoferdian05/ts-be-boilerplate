import { Types } from 'mongoose';
import randomstring from 'randomstring';

import { userInformation } from './user';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import { GeneralEnum, ICustomerGroup } from '@definitions';

export function constructCustomerGroupFields(customFields = {}): ICustomerGroup.IDataLean {
  return {
    _id: new Types.ObjectId().toString(),
    serviceProvider: new Types.ObjectId().toString(),
    name: randomstring.generate({ charset: 'alphabetic', length: 14 }),
    status: GeneralEnum.Status.ACTIVE,
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...customFields,
  };
}
