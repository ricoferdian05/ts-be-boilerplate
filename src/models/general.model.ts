import { Schema } from 'mongoose';

import { GeneralEnum } from '@definitions/general';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import { convertEnumToArray } from '@server/utils/object';

export const status = convertEnumToArray<GeneralEnum.Status>(GeneralEnum.Status);
export const distanceUnits = convertEnumToArray<GeneralEnum.DistanceUnit>(GeneralEnum.DistanceUnit);
export const weightUnits = convertEnumToArray<GeneralEnum.WeightUnit>(GeneralEnum.WeightUnit);
export const serviceTypes = convertEnumToArray<GeneralEnum.ServiceType>(GeneralEnum.ServiceType);
export const locationTypes = convertEnumToArray<GeneralEnum.LocationType>(GeneralEnum.LocationType);
export const transportTypes = convertEnumToArray<GeneralEnum.Transport>(GeneralEnum.Transport);
export const sortDirection = convertEnumToArray<GeneralEnum.SortDirection>(GeneralEnum.SortDirection);
export const apiOrigins = convertEnumToArray<GeneralEnum.ApiOrigin>(GeneralEnum.ApiOrigin);
export const balanceEvents = convertEnumToArray<GeneralEnum.BalanceEvent>(GeneralEnum.BalanceEvent);

export const statusSchema = { type: String, enum: GeneralEnum.Status };

export const distanceUnitSchema = { type: String, enum: GeneralEnum.DistanceUnit };

export const weightUnitSchema = { type: String, enum: GeneralEnum.WeightUnit };

export const serviceTypeSchema = { type: String, enum: GeneralEnum.ServiceType };

export const locationTypeSchema = { type: String, enum: GeneralEnum.LocationType };

export const dimensionSchema = new Schema(
  {
    length: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    width: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    height: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    unit: {
      ...distanceUnitSchema,
      required: true,
    },
  },
  {
    _id: false,
  },
);

export const regionSchema = (reference: GeneralEnum.RegionReference) =>
  new Schema(
    {
      id: { type: Schema.Types.ObjectId, ref: reference, required: true },
      name: { type: String, required: true },
      code: { type: String, required: () => reference === 'Country' },
    },
    { _id: false },
  );

const bankSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Bank', required: true },
    name: { type: String, required: true },
    code: { type: String },
  },
  { _id: false },
);

export const paymentAccountSchemaObject = {
  bank: {
    type: bankSchema,
    required: true,
  },
  bankBranch: { type: String, required: true },
  name: { type: String, required: true },
  number: { type: String, required: true },
};

const userInformationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String },
    name: { type: String, required: true },
  },
  { _id: false },
);

export const createdSchemaObject = {
  createdAt: { type: Number, required: true, default: getCurrentUnixTimestamp() },
  createdBy: { type: userInformationSchema },
};

export const updatedSchemaObject = {
  updatedAt: { type: Number, default: null },
  updatedBy: { type: userInformationSchema },
};

export const deletedSchemaObject = {
  deletedAt: { type: Number, default: null },
  deletedBy: { type: userInformationSchema },
};

export const locationSchemaObject = {
  location: {
    type: { ...locationTypeSchema, required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
};

export const latitudeSchemaObject = {
  type: Number,
  min: -90,
  max: 90,
};

export const longitudeSchemaObject = {
  type: Number,
  min: -180,
  max: 180,
};
