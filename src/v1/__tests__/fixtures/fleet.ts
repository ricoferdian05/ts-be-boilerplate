import { Types } from 'mongoose';

import { FleetEnum, GeneralEnum, IFleet } from '@definitions';

import randomstring from 'randomstring';

import { userInformation } from './user';
import { serviceProviderTokenData } from './auth';
import { getCurrentUnixTimestamp } from '@utils/datetime';

export const constructFleetTruckFields = (customFields = {}): IFleet.IDataLean => {
  const { container, ...otherCustomFields } = customFields as any;
  return {
    formattedId: `${serviceProviderTokenData.formattedId}-FL0000${randomstring.generate({
      charset: '1234567890',
      length: 2,
    })}`,
    serviceProvider: serviceProviderTokenData.userId,
    status: GeneralEnum.Status.ACTIVE,
    ownerType: FleetEnum.Owner.Own,
    ownerName: 'John Wick',
    name: 'My Truck',
    description: '',
    licensePlate: randomstring.generate({ charset: 'alphabetic', length: 7 }),
    freightType: FleetEnum.Freight.Inland,
    container: {
      containerType: new Types.ObjectId().toString(),
      height: 10,
      width: 10,
      length: 10,
      unit: GeneralEnum.DistanceUnit.M,
      volume: 1_000,
      ...container,
    },
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    images: ['src/v1/__tests__/files/dummyPhoto.png'],
    manufactureDate: new Date(),
    ...otherCustomFields,
  };
};
