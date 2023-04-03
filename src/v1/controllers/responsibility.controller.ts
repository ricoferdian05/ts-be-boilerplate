import httpStatus from 'http-status';
import { ApiError, Http } from '@hzn-one/commons';
import { Request, Response, NextFunction } from 'express';

import { ResponsibilityService } from '@v1-services';
import { IAuth } from '@definitions';
import { IResponsibilityController } from '@v1-definitions';

const ResponsibilityController = {
  postResponsibility: async (
    req: Request<IAuth.IToken, null, IResponsibilityController.IPostResponsibilityRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: creator } = req.params;
      await ResponsibilityService.createResponsibility(req.body, creator);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully created a new responsibility'));
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getResponsibilityDetail: async (
    req: Request<
      IResponsibilityController.IGetResponsibilityDetailRequest,
      IResponsibilityController.IGetResponsibilityDetailResponse,
      null
    >,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { formattedResponsibilityId } = req.params;
      const data = await ResponsibilityService.findResponsibilityDetail(formattedResponsibilityId);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully get a responsibility', data));
    } catch (error) {
      next(error);
    }
  },

  getResponsibilities: async (
    req: Request<IAuth.IToken, null, null, IResponsibilityController.IGetResponsibilityRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const filter = req.query;

      let data: IResponsibilityController.IGetResponsibilityResponse = {
        totalFilteredData: 0,
        items: [],
      };

      data = await ResponsibilityService.getResponsibilities(filter);

      if (data.totalFilteredData === 0) throw new ApiError(httpStatus.NOT_FOUND, 'No responsibility matched.', true);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully get responsibility.', data));
    } catch (error) {
      next(error);
    }
  },

  putResponsibility: async (
    req: Request<
      IAuth.IToken & IResponsibilityController.IPutResponsibilityRequest,
      null,
      IResponsibilityController.IPostResponsibilityRequest
    >,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token: updater, responsiblityId } = req.params;
      await ResponsibilityService.updateResponsibility(responsiblityId, req.body, updater);

      res.status(httpStatus.OK).json(Http.response(true, 'Successfully modified a responsibility'));
    } catch (error) {
      next(error);
    }
  },
};

export { ResponsibilityController };
