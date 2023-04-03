import httpStatus from 'http-status';
import { Http } from '@hzn-one/commons';
import { Request, Response, NextFunction } from 'express';

import { AuthService } from '@v1-services';
import { IAuthController } from '@v1-definitions';

const AuthController = {
  postLogin: async (req: Request<null, null, IAuthController.IPostLoginRequest>, res: Response, next: NextFunction) => {
    try {
      const data = await AuthService.login(req.body);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully logged in', data));
    } catch (error) {
      next(error);
    }
  },
  postResetPasswordEmail: async (
    req: Request<null, null, IAuthController.IPostResetPasswordEmailRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email } = req.body;
      await AuthService.requestResetPassword(email);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully request reset password.'));
    } catch (error) {
      next(error);
    }
  },
  patchResetPassword: async (
    req: Request<null, null, IAuthController.IPatchResetPasswordRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await AuthService.resetPassword(req.body);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully reset password'));
    } catch (error) {
      next(error);
    }
  },
};

export { AuthController };
