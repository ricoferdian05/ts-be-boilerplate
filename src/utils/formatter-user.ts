import { Util } from '@hzn-one/commons';

import { IUser, IGeneral, IResponsibility, IAuth } from '@definitions';

import { IUserController } from '@v1-definitions';

import { getCurrentUnixTimestamp } from './datetime';

function formatInternalUserDetails(user: IUser.IDataLean): IUserController.IUserDetail {
  const responsibility = user.internal.responsibility as IResponsibility.IData;

  return {
    id: user._id,
    formattedId: user.formattedId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: user.role,
    type: user.type,
    internal: {
      responsibility: Util.pick(responsibility, ['name', 'status', 'accessTypes', 'formattedId']),
    },
    company: null,
    individual: null,
    driver: null,
    SPEmployee: null,
  };
}

function formatDriverUserDetails(user: IUser.IDataLean): IUserController.IUserDetail {
  return {
    id: user._id,
    formattedId: user.formattedId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: user.role,
    type: user.type,
    photoUrl: user.photoUrl,
    driver: {
      isAvailable: user.driver.isAvailable,
      nationalId: user.driver.nationalId,
      address: user.driver.address,
      dateOfBirth: user.driver.dateOfBirth,
      bloodType: user.driver.bloodType,
      employeeType: user.driver.employeeType,
      licenseType: user.driver.licenseType,
      licenseExpiryDate: user.driver.licenseExpiryDate,
      driverLicenseId: user.driver.driverLicenseId,
    },
    internal: null,
    company: null,
    individual: null,
    SPEmployee: null,
  };
}

function formatUserInformation(user: IAuth.IUserInformationData): {
  at: number;
  by: IGeneral.IUserInformation;
} {
  const at = getCurrentUnixTimestamp();
  const by: IGeneral.IUserInformation = Util.pick(user, ['userId', 'email', 'name']);

  return { at, by };
}

export { formatInternalUserDetails, formatDriverUserDetails, formatUserInformation };
