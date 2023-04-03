import passport from 'passport';
import { Request } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '@hzn-one/commons';

import { ResponsibilityEnum, UserEnum, IAuth } from '@definitions';

const verifyCallback =
  (req: Request<any>, resolve, reject, right: IRight) => async (err, data: IAuth.IUserInformationData, info) => {
    if (err || info || !data) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate', true));
    }

    if (typeof right.roles !== 'undefined') {
      if (!right.roles.includes('*') && !right.roles.includes(data.role)) {
        return reject(new ApiError(httpStatus.FORBIDDEN, "The key role doesn't have access.", true));
      }
    }

    if (typeof right.types !== 'undefined') {
      if (!right.types.includes('*') && !right.types.includes(data.type)) {
        return reject(new ApiError(httpStatus.FORBIDDEN, "The key type doesn't have access.", true));
      }
    }

    // We check the accessTypes only for Internal and Service Provider Employee
    if (
      [UserEnum.Role.INTERNAL].includes(data.role) &&
      typeof right.accessTypes !== 'undefined'
    ) {
      if (
        !right.accessTypes.includes('*') &&
        !right.accessTypes.filter((accessType: any) => data.accessTypes?.includes(accessType)).length
      ) {
        return reject(new ApiError(httpStatus.FORBIDDEN, "The key accessType doesn't have access.", true));
      }
    }
    req.params.token = data;
    resolve();
  };

interface IRight {
  types?: (UserEnum.UserType | '*')[];
  accessTypes?: (ResponsibilityEnum.AccessType | '*')[];
  roles?: (UserEnum.Role | '*')[];
}

interface IAuthPayload {
  right?: IRight;
}

const auth =
  ({ right }: IAuthPayload) =>
  async (req, res, next) => {
    req.headers['authorization'] = req.headers['x-api-key'] || req.headers['authorization'];
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, right))(req, res, next);
    })
      .then(() => next())
      .catch((err) => {
        next(err);
      });
  };

export default auth;
