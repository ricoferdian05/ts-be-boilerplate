import { Types } from 'mongoose';
import { IFuel, FuelEnum } from '@definitions';

import { userInformation } from '@v1-tests/fixtures/user';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';

export const constructFuelFields = (customFields = {}): IFuel.IDataLean => {
  return {
    _id: new Types.ObjectId(),
    serviceProvider: new Types.ObjectId(),
    fleet: new Types.ObjectId().toString(),
    tasks: [
      {
        formattedId: 'TS000099',
        taskGroup: {
          formattedId: 'GR000099',
        },
        order: {
          formattedId: 'ORD00000019',
          customerName: 'Customer-aldi2',
          distance: 10,
        },
        driver: {
          id: new Types.ObjectId(),
          name: 'John Snow',
        },
      },
    ],
    fuels: [
      {
        dateRefill: 1234,
        fuelRefill: 500,
        fuelUnit: FuelEnum.FuelUnit.LTR,
        cost: 5000,
      },
    ],
    totalCost: 5000,
    totalDistance: 10,
    distanceUnit: FuelEnum.DistanceUnit.KM,
    totalFuelRefill: 500,
    fuelUnit: FuelEnum.FuelUnit.LTR,
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...customFields,
  };
};
