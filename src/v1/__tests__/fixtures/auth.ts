import { generateToken } from '@utils/jwt';
import { UserEnum } from '@definitions';
import { serviceProviderId, internalId, customerCompanyId, customerIndividualId, driverId, SPEmployeeId } from './user';
import { accessTypes } from '@models/responsibility.model';

export const serviceProviderTokenData = {
  userId: serviceProviderId.toString(),
  email: 'sample@provider.com',
  name: 'Provider A',
  formattedId: 'IDN0001',
  role: UserEnum.Role.SERVICE_PROVIDER,
  type: UserEnum.UserType.COMPANY,
  accessTypes: [],
};

const serviceProviderToken = generateToken(serviceProviderTokenData);

const internalToken = generateToken({
  userId: internalId.toString(),
  email: 'sample@internal.com',
  name: 'Internal A',
  formattedId: 'ADM0001',
  role: UserEnum.Role.INTERNAL,
  type: null,
  accessTypes: accessTypes,
});

export const companyCustomerTokenData = {
  userId: customerCompanyId.toString(),
  email: 'customer@internal.com',
  name: 'Customer A',
  formattedId: 'CSR9001',
  role: UserEnum.Role.CUSTOMER,
  type: UserEnum.UserType.COMPANY,
  accessTypes: [],
};

export const driverTokenData = {
  userId: driverId.toString(),
  email: 'driver@internal.com',
  name: 'Driver A',
  formattedId: 'IDN0001-WKR9001',
  role: UserEnum.Role.DRIVER,
  type: null,
  accessTypes: [],
};

const companyCustomerToken = generateToken(companyCustomerTokenData);

const customerIndividualToken = generateToken({
  userId: customerIndividualId.toString(),
  email: 'customer@internal.com',
  name: 'Customer A',
  formattedId: 'CSR9001',
  role: UserEnum.Role.CUSTOMER,
  type: UserEnum.UserType.INDIVIDUAL,
  accessTypes: [],
});

const driverToken = generateToken(driverTokenData);

export const SPEmployeeTokenData = {
  userId: SPEmployeeId.toString(),
  email: 'spemployee@mail.com',
  name: 'SP Employee A',
  formattedId: 'IDN0001-ADMC000001',
  role: UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE,
  type: null,
  accessTypes: accessTypes,
};

const SPEmployeeToken = generateToken(SPEmployeeTokenData);

export const Auth = {
  adminAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${internalToken}`,
    };
  },
  serviceProviderAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${serviceProviderToken}`,
    };
  },
  customerCompanyAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${companyCustomerToken}`,
    };
  },
  customerIndividualAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${customerIndividualToken}`,
    };
  },
  driverAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${driverToken}`,
    };
  },
  SPEmployeeAuthHeader: function () {
    return {
      'x-api-key': `Bearer ${SPEmployeeToken}`,
    };
  },
};
