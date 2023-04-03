import Joi from 'joi';
import httpStatus from 'http-status';
import { ApiError, Util } from '@hzn-one/commons';

const validate = (schema) => (req, _res, next) => {
  const validSchema = Util.pick(schema, ['params', 'query', 'body']);
  const object = Util.pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' } })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage, true));
  }
  Object.assign(req, value);
  return next();
};

export default validate;
