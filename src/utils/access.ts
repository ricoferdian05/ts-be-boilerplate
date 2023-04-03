import { IAuth, IUser, UserEnum } from '@definitions';
import { IUserController } from '@v1-definitions';

/**
 * Checks if the caller's authorization is sufficient
 * to access the details of a chosen user.
 */
function isUserAccessAllowed(caller: IAuth.IUserInformationData, user: IUser.IDataLean): boolean {
  switch (caller.role) {
    case UserEnum.Role.INTERNAL:
      return true;
    case UserEnum.Role.SERVICE_PROVIDER:
      return (
        (user.role === UserEnum.Role.SERVICE_PROVIDER && caller.userId === user._id.toString()) ||
        (user.role === UserEnum.Role.CUSTOMER &&
          user.parents.findIndex((parent) => parent.user.toString() === caller.userId) !== -1) ||
        (user.role === UserEnum.Role.DRIVER &&
          user.parents.findIndex((parent) => parent.user.toString() === caller.userId) !== -1)
      );
    case UserEnum.Role.CUSTOMER:
      return caller.userId === user._id.toString();
    case UserEnum.Role.DRIVER:
      return caller.userId === user._id.toString();
    default:
      return false;
  }
}

/**
 * Checks if the caller's authorization is sufficient
 * to edit the details of a chosen user.
 */
function isEditUserAccessAllowed(
  caller: IAuth.IUserInformationData,
  user: IUser.IDataLean,
  data: IUserController.IPatchUserRequest,
): boolean {
  switch (caller.role) {
    case UserEnum.Role.INTERNAL:
      return [UserEnum.Role.INTERNAL, UserEnum.Role.SERVICE_PROVIDER, UserEnum.Role.CUSTOMER].includes(user.role);
    case UserEnum.Role.SERVICE_PROVIDER: {
      // Service provider only allowed edit except "status" (ACTIVE/INACTIVE)
      if (user.role === UserEnum.Role.SERVICE_PROVIDER) {
        return caller.userId === user._id.toString() && typeof data.status === 'undefined';
      }

      // Service provinder only allowed edit their driver and SP employee
      if ([UserEnum.Role.DRIVER, UserEnum.Role.SERVICE_PROVIDER_EMPLOYEE].includes(user.role)) {
        return user.parents.findIndex((parent) => parent.user.toString() === caller.userId) !== -1;
      }

      // Service provider only allowed edit "approvalStatus"
      if (user.role === UserEnum.Role.CUSTOMER) {
        return (
          user.parents.findIndex((parent) => parent.user.toString() === caller.userId) !== -1 &&
          Object.keys(data).every((fieldName) => ['approvalStatus', 'customerGroupId'].includes(fieldName))
        );
      }

      return false;
    }
    case UserEnum.Role.CUSTOMER:
      return caller.userId === user._id.toString() && typeof data.approvalStatus === 'undefined';
    case UserEnum.Role.DRIVER:
      // Driver only allowed to edit pin and driver.isAvailable
      const { pin, driver, ...userData } = data;
      if (Object.keys(userData).length > 0) {
        return false;
      }

      if (driver) {
        const { isAvailable, ...driverData } = driver;
        if (Object.keys(driverData).length > 0) {
          return false;
        }
      }

      return caller.userId === user._id.toString();
    default:
      return false;
  }
}

export { isUserAccessAllowed, isEditUserAccessAllowed };
