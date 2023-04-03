import Joi from 'joi';
import {
  object,
  statusString,
  string,
  password,
  objectIdString,
  array,
  dateIso,
  phoneString,
  serviceTypeString,
  pageNumber,
  limitItemNumber,
  boolean,
  userSourceString,
} from '@validations';

import {
  approvalStatus,
  bloodTypes,
  businessLicenseTypes,
  driverLicenseTypes,
  employeeTypes,
  roleOptions,
  roles,
  taxTypes,
  userTypes,
  SPEmployeeResponsibility,
} from '@models';
import { GeneralEnum, UserEnum } from '@definitions';
import { IUserController } from '@v1-definitions';

const roleString = string.valid(...roles); // refers to IUser.Role
const roleOptionString = string.valid(...roleOptions); // refers to IUser.Role
const bloodTypeString = string.valid(...bloodTypes); // refers to IUser.BloodType
const licenseTypeString = string.valid(...driverLicenseTypes); // refers to IUser.LicenseType
const typeString = string.valid(...userTypes); // refers to IUser.UserType
const employeeType = string.valid(...employeeTypes); // refers to IUser.EmployeeType
const businessLicenseTypeString = string.valid(...businessLicenseTypes); // refers to ICompany.businessLicenseType
const taxTypeString = string.valid(...taxTypes); // refers to ICompany.taxType
const approvalStatusString = string.valid(...approvalStatus); // refers to IUser.ApprovalStatus
const pinString = string.regex(/^\d+$/).length(6);
const responsibility = string.valid(...SPEmployeeResponsibility); // refers to UserEnum.SPEmployeeResponsibility

const UserValidation = {
  getServiceProviderBySlug: {
    params: object({
      slug: string,
    }),
  },
  postUserInternals: {
    body: object({
      name: string.required(),
      email: string.required().email(),
      password: password.required(),
      status: statusString.required(),
      phone: phoneString.required(),
      responsibility: string.required(),
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
    }),
  },
  postUserLinks: {
    body: object({
      title: string.required(),
      link: string.required(),
    }),
  },
  postUserDrivers: {
    body: object({
      formattedId: string.allow(''), // Allow an empty value for generating increment value of workerId
      name: string.required(),
      password: password.required(),
      status: statusString.required(),
      phone: phoneString.required(),
      nationalId: string.required().max(16),
      address: string.required(),
      dateOfBirth: dateIso.required().max('now'),
      bloodType: bloodTypeString.required(),
      employeeType: employeeType.required(),
      outsourcedCompany: string.when('employeeType', { is: UserEnum.EmployeeType.Outsource, then: string.required() }),
      licenseType: licenseTypeString.required(),
      licenseExpiryDate: dateIso.required(),
      driverLicenseId: string.required(),
    }),
  },
   getUsers: {
    query: object({
      role: roleString.required(),
      search: string.allow(''),
      status: statusString.allow(''),
      responsibility: Joi.when('role', {
        is: UserEnum.Role.INTERNAL,
        then: string.allow(''),
        otherwise: Joi.forbidden(),
      }),
      serviceProviderId: Joi.when('role', {
        switch: [
          { is: UserEnum.Role.CUSTOMER, then: string.allow('') },
        ],
        otherwise: Joi.forbidden(),
      }),
      userType: Joi.when('role', {
        is: UserEnum.Role.CUSTOMER,
        then: typeString.allow(''),
        otherwise: Joi.forbidden(),
      }),
      approvalStatus: Joi.when('role', {
        is: UserEnum.Role.CUSTOMER,
        then: approvalStatusString.allow(''),
        otherwise: Joi.forbidden(),
      }),
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
      page: pageNumber,
      limit: limitItemNumber,
    }),
  },
  getUserLinks: {
    query: object({
      role: roleString.required(),
      search: string.allow(''),
      status: statusString.allow(''),
      responsibility: Joi.when('role', {
        is: UserEnum.Role.INTERNAL,
        then: string.allow(''),
        otherwise: Joi.forbidden(),
      }),
      serviceProviderId: Joi.when('role', {
        switch: [
          { is: UserEnum.Role.CUSTOMER, then: string.allow('') },
        ],
        otherwise: Joi.forbidden(),
      }),
      userType: Joi.when('role', {
        is: UserEnum.Role.CUSTOMER,
        then: typeString.allow(''),
        otherwise: Joi.forbidden(),
      }),
      approvalStatus: Joi.when('role', {
        is: UserEnum.Role.CUSTOMER,
        then: approvalStatusString.allow(''),
        otherwise: Joi.forbidden(),
      }),
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
      page: pageNumber,
      limit: limitItemNumber,
    }),
  },
  patchUser: {
    params: object({
      userId: objectIdString,
    }).unknown(true),
    body: object({
      name: string,
      email: string.email(),
      phone: phoneString,
      oldPassword: password,
      newPassword: password,
      status: statusString,
      pin: pinString,
      approvalStatus: approvalStatusString,
      formattedId: string.allow(''), // Allow an empty value for generating increment value of workerId
      internal: object({
        responsibility: string.required(),
      }),
      individual: object({
        countryId: objectIdString,
        provinceId: objectIdString,
        cityId: objectIdString,
        postalCode: string.length(5),
        address: string,
      }),
      company: object({
        name: string,
        email: string.email(),
        phone: phoneString,
        countryId: objectIdString,
        provinceId: objectIdString,
        cityId: objectIdString,
        postalCode: string.length(5),
        address: string,
        businessLicenseType: businessLicenseTypeString,
        businessLicense: string,
        taxType: taxTypeString,
        taxId: string,
        serviceTypes: array(serviceTypeString).min(1).max(2).unique().single(),
        communityCode: string.alphanum().max(32).allow(''),
      }),
      driver: object({
        nationalId: string.max(16),
        address: string,
        dateOfBirth: dateIso.max('now'),
        bloodType: bloodTypeString,
        employeeType: employeeType,
        outsourcedCompany: string.when('employeeType', {
          is: UserEnum.EmployeeType.Outsource,
          then: string.required(),
        }),
        licenseType: licenseTypeString,
        licenseExpiryDate: dateIso,
        driverLicenseId: string,
        isAvailable: boolean,
      }),
      SPEmployee: object({
        responsibility: responsibility.required(),
      }),
      customerGroupId: objectIdString,
    })
      .min(1) // at least 1 field is required
      .oxor('internal', 'individual', 'company', 'driver', 'SPEmployee') // can only update 1 type of user information
      .oxor('internal', 'driver', 'SPEmployee', 'approvalStatus') // approvalStatus only used for customer (company/individual)
      .oxor('internal', 'individual', 'company', 'SPEmployee', 'pin') // pin only used for driver
      .and('oldPassword', 'newPassword'),
  },
  postRegistrationsServiceProviders: {
    body: object({
      name: string.required(),
      email: string.email().required(),
      password: password.required(),
      status: statusString,
      phone: phoneString.required(),
      companyName: string.required(),
      companyEmail: string.email().required(),
      companyPhone: phoneString.required(),
      taxId: string.alphanum().max(15),
      taxType: taxTypeString,
      businessLicense: string.max(50),
      businessLicenseType: businessLicenseTypeString,
      serviceTypes: array(serviceTypeString).min(1).max(2).unique().single().required(),
      countryId: objectIdString.required(),
      provinceId: objectIdString.required(),
      cityId: objectIdString.required(),
      postalCode: string.max(5).allow(''),
      address: string.allow(''),
      communityCode: string.alphanum().max(32).allow(''),
    }),
  },
  postRegistrationsCustomers: {
    body: object<IUserController.IPostUserRegistrationsCustomersRequest>({
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
      serviceProviderSlug: string.when('userSource', { is: UserEnum.UserSource.TMS, then: Joi.required() }),
      registrationType: string.valid(...userTypes).required(),
      name: string.required(),
      email: string.email().required(),
      password: password.required(),
      phone: phoneString.required(),
      companyName: string.when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
      companyEmail: string.email().when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
      companyPhone: phoneString.when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
      taxId: string.alphanum().max(15),
      businessLicense: string.max(50),
      businessLicenseType: businessLicenseTypeString,
      countryId: objectIdString.when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
      provinceId: objectIdString.when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
      cityId: objectIdString.when('registrationType', { is: UserEnum.UserType.COMPANY, then: Joi.required() }),
    }),
  },
  patchPaymentAccount: {
    body: object({
      bank: string.required(),
      bankBranch: string.required(),
      name: string.required(),
      number: string.required(),
    }),
  },
  postPin: {
    body: object({
      pin: pinString.required(),
    }),
  },
  getUserOptions: {
    query: object({
      role: roleOptionString.required(),
      status: statusString.allow(''),
      search: string.allow(''),
      isWithoutCustomerGroup: Joi.when('role', { is: 'CUSTOMER', then: boolean, otherwise: Joi.forbidden() }),
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
    }),
  },
  postRegistrationsSPEmployee: {
    body: object({
      formattedId: string.allow(''), // Allow an empty value for generating increment value of workerId
      name: string.required(),
      email: string.email().required(),
      password: password.required(),
      status: statusString.default(GeneralEnum.Status.ACTIVE),
      phone: phoneString.required(),
      responsibility: responsibility.required(),
    }),
  },
  checkDriverPhone: {
    params: object({
      phone: phoneString,
    }),
  },
  getCompanyDetailBySlug: {
    params: object({
      slug: string,
    }),
  },
};

export { UserValidation };
