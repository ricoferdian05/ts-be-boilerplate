import { IMaintenance } from '@definitions';
import { userInformation } from './user';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { Types } from 'mongoose';
import { MaintenanceEnum } from '@definitions';

export const constructMaintenanceFields = (customFields = {}): IMaintenance.IData => {
  return {
    _id: new Types.ObjectId().toString(),
    fleet: new Types.ObjectId().toString(),
    serviceProvider: new Types.ObjectId().toString(),
    currentDistance: 2000,
    distanceUnit: MaintenanceEnum.DistanceUnit.KM,
    serviceDate: new Date(),
    type: MaintenanceEnum.MaintenanceServiceCategory.Scheduled,
    items: [
      {
        maintenanceItemId: new Types.ObjectId().toString(),
        initialCost: 2000,
      },
    ],
    notes: '',
    actualCost: 2100,
    status: MaintenanceEnum.MaintenanceStatusType.COMPLETED,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...customFields,
  };
};
