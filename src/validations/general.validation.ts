import Joi from 'joi';
import JoiPassword from 'joi-password';
import { distanceUnits, serviceTypes, status, transportTypes, weightUnits, sortDirection, userSources } from '@models';

/** Joi schema */
export const string = Joi.string().trim();
export const number = Joi.number();
export const boolean = Joi.boolean();
export const dateIso = Joi.date().iso();
export const array = (item) => Joi.array().items(item);
export const object = <T = any>(keys: Joi.PartialSchemaMap<T>) => Joi.object<T>().keys(keys);

/** Custom schema */
export const password = JoiPassword.string()
  .min(8)
  .max(50)
  .minOfUppercase(1)
  .minOfSpecialCharacters(1)
  .minOfLowercase(1)
  .noWhiteSpaces();

export const statusString = string.valid(...status); // refers to IGeneral.Status

export const objectIdString = string.hex().length(24);

export const unitString = string.valid(...distanceUnits); // refers to IGeneral.DistanceUnit

export const phoneString = string.regex(/^\d+$/).max(15);

export const serviceTypeString = string.valid(...serviceTypes); // refers to IGeneral.ServiceType

export const transportType = string.valid(...transportTypes); // refers to IFleet.Transport

export const pageNumber = number.integer().min(1).default(1);

export const limitItemNumber = number.integer().min(1).max(50).default(10);

export const unixTimestampNumber = number.integer().min(0);

export const weightUnitString = string.valid(...weightUnits); // refers to IOrder.WeightUnit

export const dimensionUnitString = string.valid(...distanceUnits); // refers to IOrder.DimensionUnit

export const sortDirectionString = string.valid(...sortDirection); // refers to IGeneral.sortType

export const itemArray = array({
  qty: number.min(1).required(),
  dimension: object({
    length: number.min(1).required(),
    width: number.min(1).required(),
    height: number.min(1).required(),
    unit: dimensionUnitString.required(),
  }).required(),
});

export const userSourceString = string.valid(...userSources);

/** Standalone validations */
export const GeneralValidation = {
  idParamOnly: {
    params: object({
      id: objectIdString.required(),
    }).unknown(true),
  },
};
