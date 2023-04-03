import {
  GeneralEnum,
  UserEnum,
  IUser,
} from '@definitions';

declare namespace IUserController {
  interface IUserIdParam {
    userId: string;
  }

  interface ISlugParam {
    slug: string;
  }

  interface ICheckDriverPhoneParam {
    phone: string;
  }

  interface IPostUserRegistrationsServiceProvidersRequest extends IRegion {
    name: string;
    email: string;
    password: string;
    status?: GeneralEnum.Status;
    phone: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    taxType: UserEnum.TaxType;
    taxId: string;
    businessLicense: string;
    businessLicenseType: UserEnum.BusinessLicenseType;
    serviceTypes: GeneralEnum.ServiceType | GeneralEnum.ServiceType[];
    communityCode?: string;
  }

  interface IPostUserRegistrationsCustomersRequest {
    serviceProviderSlug?: string;
    registrationType: UserEnum.UserType;
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    taxId: string;
    businessLicense: string;
    businessLicenseType: UserEnum.BusinessLicenseType;
    countryId: string;
    provinceId: string;
    cityId: string;
    userSource: UserEnum.UserSource;
  }

  interface IPostUserInternalsRequest {
    name: string;
    email: string;
    password: string;
    status: GeneralEnum.Status;
    phone: string;
    responsibility: string;
    userSource: UserEnum.UserSource;
  }

  interface IPostUserLinksRequest {
    title: string;
    link: string;
  }

  interface IPostUserDriversRequest {
    photo: any;
    formattedId: string;
    name: string;
    password: string;
    status: GeneralEnum.Status;
    phone: string;
    nationalId: string;
    address: string;
    dateOfBirth: Date;
    bloodType: UserEnum.BloodType;
    employeeType: UserEnum.EmployeeType;
    outsourcedCompany: string;
    licenseType: UserEnum.DriverLicenseType;
    licenseExpiryDate: Date;
    driverLicenseId: string;
  }

  interface IGetUsersRequest {
    search?: string;
    responsibility?: string;
    cityId?: string;
    serviceProviderId?: string;
    userType?: UserEnum.UserType;
    status?: GeneralEnum.Status;
    approvalStatus?: UserEnum.ApprovalStatus;
    employeeType?: IUser.IDriver['employeeType'];
    role: UserEnum.Role;
    userSource: UserEnum.UserSource;
    page: number;
    limit: number;
  }

  interface IGetUserLinksRequest {
    search?: string;
    responsibility?: string;
    role: UserEnum.Role;
    userSource: UserEnum.UserSource;
    page: number;
    limit: number;
  }

  interface ILinksDetail {
    _id: string ;
    title: string;
    link: string;
  }

  interface IGetUserOptionsRequest {
    role: UserEnum.RoleOption;
    isAvailable?: boolean;
    status?: GeneralEnum.Status;
    search?: string;
    isWithoutCustomerGroup?: boolean;
    userSource?: UserEnum.UserSource;
  }

  interface IUserDetail {
    id: string;
    formattedId: string;
    name: string;
    email: string;
    phone: string;
    status: GeneralEnum.Status;
    role: UserEnum.Role;
    type: UserEnum.UserType;
    photoUrl?: string;
    internal: {
      responsibility: string;
    } | null;
    company: IUser.ICompany | null;
    individual: IUser.IIndividual | null;
    driver: Omit<IUser.IDriver, 'updatedAt' | 'updatedBy'> | null;
    parents?: IUser.IData['parents'];
    SPEmployee: {
      responsibility: string;
    } | null;
  }

  interface IGetUsersResponse {
    totalFilteredData: number;
    items: IUserDetail[];
  }

  interface IGetUserOptionsResponse {
    id: string;
    name: string;
    phone: string;
  }

  interface IGetServiceProviderBySlugResponse {
    photoUrl?: string;
    company?: {
      name: string;
    };
  }

  interface IGetUserDetailsResponse extends IUserDetail {}

  interface IRegion {
    countryId?: string;
    provinceId?: string;
    cityId?: string;
    address?: string;
    postalCode?: string;
  }

  interface IPatchPaymentAccount {
    bank: string;
    bankBranch: string;
    name: string;
    number: string;
  }

  interface IPostValidatePin {
    pin: string;
  }

  interface IPostUserRegistrationsSPEmployeeRequest {
    formattedId: string;
    name: string;
    email: string;
    password: string;
    status: GeneralEnum.Status;
    phone: string;
    responsibility: UserEnum.SPEmployeeResponsibility;
  }

  interface IGetUserBalancesResponse {
    pendingBalance: number;
    withdrawableBalance: number;
  }
}

export { IUserController };
