import { Types } from 'mongoose';
import randomstring from 'randomstring';

import { getCurrentUnixTimestamp } from '@utils/datetime';
import { GeneralEnum, IUser, UserEnum } from '@definitions';
import { accessTypes, UserModel } from '@models';

export const userInformation = {
  userId: '61cad6a8cb39694efde0a99a',
  name: 'User Name',
  email: 'dummyemail@hzn.one',
};

export const serviceProviderId = new Types.ObjectId();
export const internalId = new Types.ObjectId();
export const driverId = new Types.ObjectId();
export const SPEmployeeId = new Types.ObjectId();
export const customerCompanyId = new Types.ObjectId();
export const customerIndividualId = new Types.ObjectId();

export const constructUserDriverFields = (customFields = {}): IUser.IDataLean => {
  const { parents, driver, ...otherCustomFields } = customFields as any;

  return {
    parents: parents || [
      {
        user: serviceProviderId,
        approvalStatus: UserEnum.ApprovalStatus.APPROVED,
        approvalStatusAt: getCurrentUnixTimestamp(),
      },
    ],
    name: 'First Driver',
    email: 'driverone@serviceprovider.com',
    password: 'password',
    status: GeneralEnum.Status.ACTIVE,
    phone: '081234567890',
    role: UserEnum.Role.DRIVER,
    formattedId: 'IDN0001-WRK000001',
    driver: {
      nationalId: randomstring.generate({ charset: 'numeric', length: 14 }),
      address: 'jl test',
      dateOfBirth: '1996-12-01',
      bloodType: UserEnum.BloodType.A,
      employeeType: UserEnum.EmployeeType.Outsource,
      outsourcedCompany: 'PT asdfasf',
      licenseType: UserEnum.DriverLicenseType.B2,
      licenseExpiryDate: '2027-01-12',
      driverLicenseId: randomstring.generate({ charset: 'numeric', length: 16 }),
      isAvailable: true,
      ...driver,
    },
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...otherCustomFields,
  };
};

export const constructUserCustomerFields = (type: UserEnum.UserType, customFields = {}): IUser.IDataLean => {
  const { parents, company, individual, ...otherCustomFields } = customFields as any;

  const baseTypeObject = {
    country: {
      id: new Types.ObjectId(),
      name: 'Indonesia',
      code: 'ID',
    },
    province: {
      id: new Types.ObjectId(),
      name: 'Jawa Timur',
    },
    city: {
      id: new Types.ObjectId(),
      name: 'Surabaya',
    },
    postalCode: '12345',
    address: 'jl',
  };

  return {
    _id: new Types.ObjectId(),
    parents: parents || [
      {
        user: serviceProviderId,
        approvalStatus: UserEnum.ApprovalStatus.APPROVED,
        approvalStatusAt: getCurrentUnixTimestamp(),
      },
    ],
    name: 'First Customer',
    email: `${randomstring.generate({ charset: 'alphabetic', length: 10 })}@customer.com`,
    password: 'password',
    status: GeneralEnum.Status.ACTIVE,
    phone: '081234567891',
    role: UserEnum.Role.CUSTOMER,
    type,
    formattedId: 'CSR0001',
    ...(type === UserEnum.UserType.INDIVIDUAL ? { individual: { ...baseTypeObject, ...individual } } : {}),
    ...(type === UserEnum.UserType.COMPANY
      ? {
          company: {
            ...baseTypeObject,
            name: randomstring.generate({ charset: 'alphabetic', length: 14 }),
            email: 'company@customer.com',
            phone: randomstring.generate({ charset: 'numeric', length: 15 }),
            taxType: UserEnum.TaxType.PKP,
            taxId: randomstring.generate({ charset: 'numeric', length: 16 }),
            businessLicense: '123456789',
            businessLicenseType: UserEnum.BusinessLicenseType.SIUP,
            ...company,
          },
        }
      : {}),
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...otherCustomFields,
  };
};

export const constructUserServiceProviderFields = (customFields = {}): IUser.IDataLean => {
  const { company, ...otherCustomFields } = customFields as any;

  return {
    name: 'Delivery Express',
    email: `delivery-express-${randomstring.generate({ charset: 'alphabetic', length: 5 })}@serviceprovider.com`,
    password: 'password',
    status: GeneralEnum.Status.ACTIVE,
    phone: '081234567890',
    role: UserEnum.Role.SERVICE_PROVIDER,
    type: UserEnum.UserType.COMPANY,
    formattedId: 'IDN0001',
    slug: 'test-slug',
    company: {
      name: randomstring.generate({ charset: 'alphabetic', length: 14 }),
      email: `admin-${randomstring.generate({ charset: 'alphabetic', length: 5 })}@delivery-express.com`,
      phone: '12345',
      taxType: UserEnum.TaxType.PKP,
      taxId: randomstring.generate({ charset: 'numeric', length: 16 }),
      businessLicense: randomstring.generate({ charset: 'numeric', length: 14 }),
      businessLicenseType: UserEnum.BusinessLicenseType.SIUP,
      country: {
        id: new Types.ObjectId(),
        name: 'Indonesia',
        code: 'ID',
      },
      province: {
        id: new Types.ObjectId(),
        name: 'Banten',
      },
      city: {
        id: new Types.ObjectId(),
        name: 'Tangerang',
      },
      address: 'Jl. Scientia Boulevard',
      postalCode: '15810',
      serviceTypes: GeneralEnum.ServiceType.LTL,
      ...company,
    },
    paymentAccount: {
      bank: {
        id: new Types.ObjectId(),
        name: 'BANK ANZ INDONESIA',
        code: '061',
      },
      bankBranch: 'branch1',
      name: 'ANZ Branch 1',
      number: '1',
      updatedAt: 1648123299,
      updatedBy: userInformation,
    },
    photoUrl: 'profiles/IDN00421648020020LbaPm1lnzHaX.png',
    verifiedAt: 123,
    successOrders: 0,
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...otherCustomFields,
  };
};

export const constructUserInternalFields = (customFields = {}): IUser.IDataLean => {
  const { ...otherCustomFields } = customFields as any;

  return {
    parents: [],
    name: 'First Admin',
    email: 'internalone@hzn.one',
    password: 'password',
    status: GeneralEnum.Status.ACTIVE,
    phone: '081234567890',
    role: UserEnum.Role.INTERNAL,
    formattedId: 'ADM0001',
    internal: {
      responsibility: new Types.ObjectId(),
    },
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...otherCustomFields,
  };
};

export const constructUserSPEmployeeFields = (customFields = {}): IUser.IDataLean => {
  const { parents, driver, ...otherCustomFields } = customFields as any;

  return {
    parents: parents || [
      {
        user: serviceProviderId,
        approvalStatus: UserEnum.ApprovalStatus.APPROVED,
        approvalStatusAt: getCurrentUnixTimestamp(),
      },
    ],
    name: 'Admin SP Employee',
    email: 'spemployee@mail.com',
    password: 'password',
    status: GeneralEnum.Status.ACTIVE,
    phone: '081234567890',
    role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
    formattedId: 'IDN0001-ADMC000001',
    SPEmployee: {
      accessTypes,
    },
    createdBy: userInformation,
    createdAt: getCurrentUnixTimestamp(),
    ...otherCustomFields,
  };
};

export const initServiceProvider = async (customFields = {}): Promise<void> => {
  await UserModel.create(constructUserServiceProviderFields({ _id: serviceProviderId, ...customFields }));
};

export const initSPEmployee = async (customFields = {}): Promise<void> => {
  await UserModel.create(constructUserSPEmployeeFields({ _id: SPEmployeeId, ...customFields }));
};
