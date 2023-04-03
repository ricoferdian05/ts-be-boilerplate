import jwt from 'jsonwebtoken';

import config from '@config/config';
import { IAuth } from '@definitions';

const generateToken = (data: IAuth.IUserInformationData, secret = config.JWT.SECRET) => {
  return jwt.sign(data, secret);
};

export { generateToken };
