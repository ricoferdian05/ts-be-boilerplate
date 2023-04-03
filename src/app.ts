import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import xss from 'xss-clean';
import firebaseAdmin from 'firebase-admin';
import passport from 'passport';
import httpStatus from 'http-status';
import compression from 'compression';
import { ApiError } from '@hzn-one/commons';
import express, { Application } from 'express';

import v1Routes from '@v1-routes';
import config from '@config/config';
import { Mongo } from '@config/mongo';
import { jwtStrategy } from '@config/passport';
import { errorHandler } from '@middlewares/error';
import { applicationDefault } from 'firebase-admin/app';

// load envs, should be at the very beginning of program
dotenv.config();

// Initialize firebase admin by application credential
firebaseAdmin.initializeApp({
  credential: applicationDefault(),
});

// connect to mongodb
Mongo.startConnection();

const app: Application = express();

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data,
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// root
app.get('/', (_req, res) => {
  res.send(`PT HZN Teknologi Indonesia - Transport Management System (${config.APP_ENV})`);
});

// v1 api routes
app.use('/v1', v1Routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found', true));
});

// handle error
app.use(errorHandler);

export default app;
