import { GeneralEnum, IResponsibility, ResponsibilityEnum } from '@server/definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { Types } from 'mongoose';
import { userInformation } from './user';

export function constructResponsibilityFields(customFields = {}): IResponsibility.IDataLean {
  return {
    _id: new Types.ObjectId().toString(),
    formattedId: 'RESP0001',
    name: 'Admin',
    accessTypes: [
      ResponsibilityEnum.AccessType.CREATE,
      ResponsibilityEnum.AccessType.READ,
      ResponsibilityEnum.AccessType.UPDATE,
      ResponsibilityEnum.AccessType.DELETE,
    ],
    status: GeneralEnum.Status.ACTIVE,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...customFields,
  };
}
