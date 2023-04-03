import { Schema, model } from 'mongoose';
import { ApiError } from '@hzn-one/commons';

import { GeneralEnum, IUser, UserEnum} from '@definitions';
import { createdSchemaObject, deletedSchemaObject, statusSchema, updatedSchemaObject } from '@models';
import { regionSchema, paymentAccountSchemaObject } from './general.model';
import { convertEnumToArray } from '@server/utils/object';

export const bloodTypes = convertEnumToArray<UserEnum.BloodType>(UserEnum.BloodType);
export const businessLicenseTypes = convertEnumToArray<UserEnum.BusinessLicenseType>(UserEnum.BusinessLicenseType);
export const driverLicenseTypes = convertEnumToArray<UserEnum.DriverLicenseType>(UserEnum.DriverLicenseType);
export const employeeTypes = convertEnumToArray<UserEnum.EmployeeType>(UserEnum.EmployeeType);
export const approvalStatus = convertEnumToArray<UserEnum.ApprovalStatus>(UserEnum.ApprovalStatus);
export const taxTypes = convertEnumToArray<UserEnum.TaxType>(UserEnum.TaxType);
export const userTypes = convertEnumToArray<UserEnum.UserType>(UserEnum.UserType);
export const roles = convertEnumToArray<UserEnum.Role>(UserEnum.Role);
export const roleOptions = convertEnumToArray<UserEnum.Role>(UserEnum.RoleOption);
export const SPEmployeeResponsibility = convertEnumToArray<UserEnum.SPEmployeeResponsibility>(
  UserEnum.SPEmployeeResponsibility,
);
export const userSources = convertEnumToArray<UserEnum.UserSource>(UserEnum.UserSource);

const internalSchema = new Schema(
  {
    responsibility: { type: Schema.Types.ObjectId, ref: 'Responsibility', required: true },
    ...updatedSchemaObject,
  },
  { _id: false },
);

const individualSchema = new Schema(
  {
    country: {
      type: regionSchema(GeneralEnum.RegionReference.Country),
      default: null,
    },
    province: { type: regionSchema(GeneralEnum.RegionReference.Province), default: null },
    city: { type: regionSchema(GeneralEnum.RegionReference.City), default: null },
    postalCode: { type: String, default: null },
    address: { type: String, default: null },
    ...updatedSchemaObject,
  },
  { _id: false },
);

const parentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvalStatus: {
      type: String,
      default: UserEnum.ApprovalStatus.PENDING,
      enum: approvalStatus,
    },
    approvalStatusAt: { type: Number, default: null },
    customerGroup: {
      type: Schema.Types.ObjectId,
      ref: 'Customer_Group',
    },
  },
  {
    _id: false,
  },
);

const paymentAccountSchema = new Schema(
  {
    ...paymentAccountSchemaObject,
    ...updatedSchemaObject,
  },
  { _id: false },
);

const UserSchema = new Schema({
  formattedId: { type: String, required: true, unique: true },
  parents: [parentSchema],
  photoUrl: { type: String },
  name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  pin: {
    type: String,
  },
  password: { type: String, required: true },
  status: { ...statusSchema, required: true },
  phone: { type: String, required: true, maxlength: 15 },
  confirmationToken: { type: String },
  resetPasswordToken: { type: String, unique: true, sparse: true },
  role: { type: String, required: true, enum: roles },
  type: {
    type: String,
    required: function () {
      return [UserEnum.Role.CUSTOMER].includes(this.role);
    },
    enum: userTypes,
  },
  internal: {
    type: internalSchema,
    required: function () {
      return this.role === UserEnum.Role.INTERNAL;
    },
  },
  individual: {
    type: individualSchema,
    default: null,
  },
  paymentAccount: {
    type: paymentAccountSchema,
    default: null,
  },
  source: { type: String, enum: UserEnum.UserSource, default: UserEnum.UserSource.TMS, required: true },
  ...createdSchemaObject,
  ...updatedSchemaObject,
  ...deletedSchemaObject,
});

UserSchema.pre('validate', function (next) {
  const user = this as unknown as IUser.IDataSchema;

  if (user.email) {
    user.email = user.email.toLowerCase();
  }

  if (user.company?.email) {
    user.company.email = user.company.email.toLowerCase();
  }

  next();
});

function schemaErrorHandling(error, _doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    // code 11000 means there is a duplicate key error
    if (error.keyPattern['email']) next(new ApiError(400, 'Email must be unique', true));
    else if (error.keyPattern['slug']) next(new ApiError(400, 'Company name must be unique', true));
    else if (error.keyPattern['formattedId']) next(new ApiError(400, 'formattedId Id must be unique', true));
    else if (error.keyPattern['company.taxId']) next(new ApiError(400, 'Tax id must be unique', true));
    else if (error.keyPattern['company.email']) next(new ApiError(400, 'Company email must be unique', true));
    else if (error.keyPattern['company.businessLicense'])
      next(new ApiError(400, 'Business license id must be unique', true));
    else if (error.keyPattern['driver.nationalId'])
      next(new ApiError(400, 'National Identity Id must be unique', true));
    else if (error.keyPattern['driver.driverLicenseId'])
      next(new ApiError(400, 'Driver license id must be unique', true));
    else if (error.keyPattern['company.communityCode'])
      next(new ApiError(400, 'Company community code must be unique', true));
  }
  next();
}

UserSchema.post('save', schemaErrorHandling);

const UserModel = model<IUser.IDataSchema>('User', UserSchema);

export { UserModel };
