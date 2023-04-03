import { GeneralEnum, IMaintenanceItem, MaintenanceItemEnum } from '@definitions';
import { userInformation } from './user';
import { getCurrentUnixTimestamp } from '@utils/datetime';

export const constructMaintenanceItemFields = (customFields = {}): IMaintenanceItem.IData => {
  return {
    name: 'Maintenance Item One',
    category: MaintenanceItemEnum.MaintenanceItemCategory.Service,
    status: GeneralEnum.Status.ACTIVE,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...customFields,
  };
};
