import { Types } from 'mongoose';

import { ICity, IDistrict } from '@definitions';

export function constructCityFields(customFields = {}): ICity.IData {
  const { location, ...otherCustomFields } = customFields as any;

  return {
    name: 'Tangerang',
    province: new Types.ObjectId(),
    geoJsonId: 123,
    location: {
      type: 'Point',
      coodinates: [90, 180],
      ...location,
    },
    postalCodes: ['12345'],
    ...otherCustomFields,
  };
}

export function constructDistrictFields(customFields = {}): IDistrict.IData {
  const { location, ...otherCustomFields } = customFields as any;

  return {
    name: 'Kelapa Dua',
    city: new Types.ObjectId(),
    geoJsonId: 123,
    location: {
      type: 'Point',
      coodinates: [90, 180],
      ...location,
    },
    postalCodes: ['12345'],
    ...otherCustomFields,
  };
}
