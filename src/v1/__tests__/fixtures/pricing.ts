import { Types } from 'mongoose';

import { GeneralEnum, IPricing } from '@definitions';
import { getCurrentUnixTimestamp } from '@utils/datetime';

import { userInformation } from './user';
import { serviceProviderTokenData } from './auth';

export function constructPricingFields(
  serviceType: GeneralEnum.ServiceType,
  pricingType: GeneralEnum.PricingType,
  customFields = {},
): IPricing.IDataLean {
  const { originCity, destinationCity, originDistrict, destinationDistrict, ...otherCustomField } = customFields as any;

  const fields = {
    user: serviceProviderTokenData.userId,
    serviceType,
    pricingType,
    containerType: serviceType === GeneralEnum.ServiceType.FTL ? new Types.ObjectId().toString() : undefined,
    basePrice: 10_000,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
  };

  if (pricingType === GeneralEnum.PricingType['3LC']) {
    fields['originCity'] = {
      id: new Types.ObjectId().toString(),
      name: 'Jakarta Barat',
      ...originCity,
    };
    fields['destinationCity'] = {
      id: new Types.ObjectId().toString(),
      name: 'Jakarta Timur',
      ...destinationCity,
    };
  } else if (pricingType === GeneralEnum.PricingType.District) {
    fields['originDistrict'] = {
      id: new Types.ObjectId().toString(),
      name: 'Cengkareng',
      ...originDistrict,
    };
    fields['destinationDistrict'] = {
      id: new Types.ObjectId().toString(),
      name: 'Cipayung',
      ...destinationDistrict,
    };
  }

  return {
    ...fields,
    ...otherCustomField,
  };
}
