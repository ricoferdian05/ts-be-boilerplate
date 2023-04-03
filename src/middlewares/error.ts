import axios from 'axios';
import httpStatus from 'http-status';
import { Http } from '@hzn-one/commons';
import { Request, Response } from 'express';

import config from '@server/config/config';

const errorHandler = (err: any, _req: Request, res: Response, _next): void => {
  let { statusCode = 500, message, isOperational = false } = err;

  if (config.APP_ENV === 'production' && !isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  } else {
    if (axios.isAxiosError(err) && typeof err.response !== 'undefined') {
      statusCode = err.response?.status;
      message = err.response?.data?.meta?.message ?? 'failed';
    }
  }

  // App env testing coming from GitHub Action SonarCloud
  if (config.APP_ENV !== 'testing') {
    console.error(err);
  }

  res.status(statusCode).send(Http.response(false, message));
};

export { errorHandler };
