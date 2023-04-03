import httpStatus from 'http-status';
import { ApiError, Http } from '@hzn-one/commons';
import { Request, Response, NextFunction } from 'express';

import { UserService } from '@v1-services';
import { GeneralEnum, IAuth, UserEnum } from '@definitions';
import { IUserController } from '@v1-definitions';

const UserController = {
  getServiceProviderBySlug: async (
    req: Request<IUserController.ISlugParam, null, IUserController.IPostUserRegistrationsServiceProvidersRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { slug } = req.params;
      const data = await UserService.getServiceProviderBySlug(slug);

      res.status(httpStatus.OK).json(Http.response(true, "Successfully get service provider's details", data));
    } catch (error) {
      next(error);
    }
  },
  postUserInternals: async (
    req: Request<IAuth.IToken, null, IUserController.IPostUserInternalsRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: creator } = req.params;
      await UserService.createInternalUser(req.body, creator);

      res.status(httpStatus.CREATED).json(Http.response(true, 'Successfully created an internal user'));
    } catch (error) {
      next(error);
    }
  },
  postUserLinks: async (
    req: Request<IAuth.IToken, null, IUserController.IPostUserLinksRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: creator } = req.params;
      await UserService.createUserLinks(req.body, creator);

      res.status(httpStatus.CREATED).json(Http.response(true, 'Successfully create new links'));
    } catch (error) {
      next(error);
    }
  },
  getUsers: async (
    req: Request<IAuth.IToken, null, null, IUserController.IGetUsersRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: caller } = req.params;
      const filter = req.query;
      let serviceProviderId;

      if (caller.role === UserEnum.Role.INTERNAL) {
        serviceProviderId = req.query.serviceProviderId;
      }

      const data = await UserService.getUsers(
        {
          ...filter,
          serviceProviderId,
        },
        caller,
      );

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully get users', data));
    } catch (error) {
      next(error);
    }
  },
  getUserLinks: async (
    req: Request<IAuth.IToken, null, null, IUserController.IGetUserLinksRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const filter = req.query;
      const data = await UserService.getLinks(
        {
          ...filter,
        },
      );
      res.status(httpStatus.OK).json(Http.response(true, "Sucessfully get all data", data));
    } catch (error) {
      next(error);
    }
  },
  getUserDetails: async (
    req: Request<IAuth.IToken & IUserController.IUserIdParam>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { userId: formattedUserId, token: caller } = req.params;
      // Disallow customer and driver role to access other user
      if (
        [UserEnum.Role.CUSTOMER].includes(caller.role) &&
        typeof formattedUserId !== 'undefined' &&
        caller.formattedId !== formattedUserId
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Not allowed');
      }

      /* if formattedUserId is exist, it coming from /users/:formattedUserId
         else it coming from /profile (caller)
      */
      const data = await UserService.getUserDetails(formattedUserId || caller.formattedId, caller);
      // console.log(data);

      res.status(httpStatus.OK).json(Http.response(true, "Successfully get user's details", data));
    } catch (error) {
      next(error);
    }
  },
  getUserOptions: async (
    req: Request<IAuth.IToken, null, null, IUserController.IGetUserOptionsRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: caller } = req.params;
      const filter = req.query;

      /*
        Filter status only allowed for internal
        and filter role (driver and customer) only allowed for internal, service provider and employee
      */
      if (
        ([UserEnum.RoleOption.DRIVER, UserEnum.RoleOption.CUSTOMER].includes(filter.role) &&
          ![ UserEnum.Role.INTERNAL].includes(
            caller.role,
          )) ||
        (filter.status && caller.role !== UserEnum.Role.INTERNAL)
      )
        throw new ApiError(httpStatus.FORBIDDEN, 'Not allowed', true);

      if (caller.role !== UserEnum.Role.INTERNAL) {
        filter.status = GeneralEnum.Status.ACTIVE;
      }
      res.status(httpStatus.OK).json(Http.response(true, 'Successfully get users'));
    } catch (error) {
      next(error);
    }
  },
};

export { UserController };
