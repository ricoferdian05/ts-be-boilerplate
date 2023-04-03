import { Document, LeanDocument } from 'mongoose';

import {
  IGeneral,
  IResponsibility,
  ResponsibilityEnum,
} from '@definitions';
import { GeneralEnum } from './general';

namespace UserEnum {
  export enum Role {
    'INTERNAL' = 'INTERNAL',
    'CUSTOMER' = 'CUSTOMER',
  }

  export enum RoleOption {
    'DRIVER' = 'DRIVER',
    'SERVICE_PROVIDER' = 'SERVICE_PROVIDER',
    'CUSTOMER' = 'CUSTOMER',
    'SERVICE_PROVIDER_EMPLOYEE' = 'SERVICE_PROVIDER_EMPLOYEE',
  }

  export enum EmployeeType {
    'Own' = 'Own',
    'Outsource' = 'Outsource',
  }

  export enum BloodType {
    'A' = 'A',
    'AB' = 'AB',
    'B' = 'B',
    'O' = 'O',
  }

  export enum ApprovalStatus {
    'APPROVED' = 'APPROVED',
    'REJECTED' = 'REJECTED',
    'PENDING' = 'PENDING',
  }

  export enum BusinessLicenseType {
    'SIUP' = 'SIUP',
    'NIB' = 'NIB',
    'SIUJPT' = 'SIUJPT',
  }

  export enum TaxType {
    'PKP' = 'PKP',
    'NON-PKP' = 'NON-PKP',
  }

  export enum UserType {
    'INDIVIDUAL' = 'INDIVIDUAL',
    'COMPANY' = 'COMPANY',
  }

  export enum DriverLicenseType {
    'A' = 'A',
    'B1' = 'B1',
    'B2' = 'B2',
    'C' = 'C',
    'D' = 'D',
  }

  export enum ServiceType {
    'LTL' = 'LTL',
    'FTL' = 'FTL',
  }

  export enum SPEmployeeResponsibility {
    'ADMIN' = 'ADMIN',
    'VIEWER' = 'VIEWER',
  }

  export enum UserSource {
    'TMS' = 'TMS',
    'Marketplace Delivery' = 'Marketplace Delivery',
  }
}

declare namespace IUser {
  interface IData {
    photoUrl?: string;
    formattedId: string;
    slug?: string;
    parents?:
      | {
          user: IUser.IDataSchema['_id'] | IUser.IData;
          approvalStatus: UserEnum.ApprovalStatus;
          approvalStatusAt: number | null;
        }[]
      | null;
    name: string;
    email: string;
    password: string;
    status: GeneralEnum.Status;
    phone: string;
    confirmationToken?: string;
    resetPasswordToken?: string;
    role: UserEnum.Role;
    type: UserEnum.UserType;
    pin?: string;
    createdAt: IGeneral.UnixTimestamp;
    createdBy: IGeneral.IUserInformation;
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IGeneral.IUserInformation;
    deletedAt?: IGeneral.UnixTimestamp;
    deletedBy?: IGeneral.IUserInformation;
    verifiedAt?: IGeneral.UnixTimestamp;
    internal?: IInternal;
    SPEmployee?: ISPEmployee;
    individual?: IIndividual;
    company?: ICompany;
    paymentAccount?: IPaymentAccount;
    driver?: IDriver;
    SPEmployeeCounter?: number;
    successOrders?: number;
    pendingBalance: number | null;
    withdrawableBalance: number | null;
    source: UserEnum.UserSource;
  }

  interface ILinks {
    _id: string;
    title: string;
    link: string;
    createdAt: IGeneral.UnixTimestamp;
    createdBy: IGeneral.IUserInformation;
    updatedAt?: IGeneral.UnixTimestamp;
    deletedAt?: IGeneral.UnixTimestamp;
  }

  interface IInternal {
    responsibility: string | IResponsibility.IData; // field from populating document
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IGeneral.IUserInformation;
  }

  interface ISPEmployee {
    accessTypes: ResponsibilityEnum.AccessType[];
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IGeneral.IUserInformation;
  }

  interface IUserRegion {
    postalCode: string | null;
    address: string | null;
  }

  interface IIndividual extends IUserRegion, IGeneral.IUpdated {}

  interface ICompany extends IUserRegion, IGeneral.IUpdated {
    name: string;
    email: string;
    phone: string;
    taxType?: UserEnum.TaxType;
    taxId: string;
    businessLicense: string;
    businessLicenseType: UserEnum.BusinessLicenseType;
    serviceTypes?: GeneralEnum.ServiceType[];
    photos?: string[];
    description?: string;
    websiteLink?: string;
    communityCode?: string;
  }

  interface IDriver {
    nationalId: string;
    address: string;
    dateOfBirth: Date;
    bloodType: UserEnum.BloodType;
    employeeType: UserEnum.EmployeeType;
    outsourcedCompany?: string;
    licenseType: UserEnum.DriverLicenseType;
    licenseExpiryDate: Date;
    driverLicenseId: string;
    isAvailable: boolean;
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IGeneral.IUserInformation;
  }
  interface IPaymentAccount {
    bank: {
      name: string;
      code: string;
    };
    bankBranch: string;
    name: string;
    number: string;
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IGeneral.IUserInformation;
  }
  interface ILinks {
    title: string;
    link: string;
    createdBy: IGeneral.IUserInformation;
  }

  interface IDataSchema extends IData, Document {}
  interface IDataLean extends LeanDocument<IData & { _id: any }> {}
}

export { IUser, UserEnum };
