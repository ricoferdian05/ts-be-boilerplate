import passportJWT from 'passport-jwt';

import config from './config';
import { IAuth } from '@definitions';

const jwtOptions = {
  secretOrKey: config.JWT.SECRET,
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload: IAuth.IUserInformationData, done) => {
  try {
    if (!payload) {
      return done(null, false);
    }
    done(null, payload);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new passportJWT.Strategy(jwtOptions, jwtVerify);

export { jwtStrategy };
