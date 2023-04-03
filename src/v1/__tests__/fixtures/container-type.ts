import { Types } from 'mongoose';
import { GeneralEnum, IContainerType } from '@definitions';

export const constructContainerTypeFields = (customFields = {}): IContainerType.IData => {
  return {
    name: 'Flat Rack 40 feet',
    maxHeight: null,
    maxWidth: null,
    maxLength: null,
    unit: GeneralEnum.DistanceUnit.M,
    maxVolume: null,
    transportationType: new Types.ObjectId().toString(),
    ...customFields,
  };
};
