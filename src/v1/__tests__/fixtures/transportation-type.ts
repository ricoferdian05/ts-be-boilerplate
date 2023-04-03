import { FleetEnum, ITransportationType } from '@definitions';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { userInformation } from './user';

export const constructTransportationTypeFields = (customFields = {}): ITransportationType.IData => {
  return {
    name: 'Mobil',
    freightType: FleetEnum.Freight.Inland,
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...customFields,
  };
};
