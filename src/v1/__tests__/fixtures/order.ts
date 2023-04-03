import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { GeneralEnum, IOrder, OrderEnum } from '@definitions';
import { constructContainerTypeFields } from './container-type';
import { generateRandomLatitude, generateRandomLongitude } from './random';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';
import { userInformation } from './user';

export const constructOrderFields = (serviceType: GeneralEnum.ServiceType, customFields = {}): IOrder.IDataLean => {
  const {
    serviceProvider,
    customer,
    originCity,
    originDistrict,
    destinationCity,
    destinationDistrict,
    containerType,
    items,
    pricing,
    additionalCharges,
    ...otherCustomFields
  } = customFields as any;

  return {
    _id: new Types.ObjectId().toString(),
    serviceProvider: {
      id: new Types.ObjectId().toString(),
      name: 'Provider A',
      company: {
        name: 'Service Provider Name',
      },
      ...serviceProvider,
    },
    pricing: {
      id: new Types.ObjectId().toString(),
      basePrice: 100000,
      pricingType: GeneralEnum.PricingType['3LC'],
      ...pricing,
    },
    customer: {
      id: new Types.ObjectId().toString(),
      email: 'test@gmail.com',
      name: 'Customer Name',
      phone: '081234567890',
      ...customer,
    },
    formattedId: 'OR000001',
    status: OrderEnum.OrderStatus.NEW,
    originCity: {
      id: new Types.ObjectId().toString(),
      name: 'Jakarta Barat',
      ...originCity,
    },
    originDistrict: {
      id: new Types.ObjectId().toString(),
      name: 'Cengkareng',
      ...originDistrict,
    },
    originAddress: 'Jl. Lkr. Luar Barat',
    originLatitude: generateRandomLatitude(),
    originLongitude: generateRandomLongitude(),
    destinationCity: {
      id: new Types.ObjectId().toString(),
      name: 'Jakarta Timur',
      ...destinationCity,
    },
    destinationDistrict: {
      id: new Types.ObjectId().toString(),
      name: 'Cipayung',
      ...destinationDistrict,
    },
    destinationAddress: 'Taman Mini, Jl. Malaka',
    destinationLatitude: generateRandomLatitude(),
    destinationLongitude: generateRandomLongitude(),
    distance: 684,
    transportationType: serviceType === GeneralEnum.ServiceType.FTL ? GeneralEnum.Transport.Truck : undefined,
    containerType:
      serviceType === GeneralEnum.ServiceType.FTL
        ? {
            ...constructContainerTypeFields(),
            id: new Types.ObjectId().toString(),
            ...containerType,
          }
        : undefined,
    serviceType,
    serviceDateTime: dayjs().add(1, 'day').unix(),
    packageType: OrderEnum.PackageType.Box,
    categoryType: OrderEnum.CategoryType['Food & Beverage'],
    weight: serviceType === GeneralEnum.ServiceType.LTL ? 10 : undefined,
    weightUnit: GeneralEnum.WeightUnit.KG,
    volumetricWeight: 10,
    items: items || [
      {
        qty: 1,
        dimension: {
          length: 10,
          width: 10,
          height: 10,
          unit: GeneralEnum.DistanceUnit.M,
        },
      },
    ],
    handling: OrderEnum.Handling.Batteries,
    baseAmount: 100_000,
    additionalCharges: additionalCharges || [
      {
        id: new Types.ObjectId().toString(),
        name: 'Loading Package',
        amount: 25_000,
      },
    ],
    discountAmount: 0,
    taxRate: 10,
    taxAmount: 10_000,
    totalAmount: 110_000,
    orderedBy: OrderEnum.CreatedByFilter.OWNER,
    apiOrigin: GeneralEnum.ApiOrigin.TMS,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...otherCustomFields,
  };
};
