import { accessTypes } from '@models/responsibility.model';
import {
  object,
  statusString,
  string,
  array,
  objectIdString,
  pageNumber,
  limitItemNumber,
} from '@validations//general.validation';

const AccessType = string.valid(...accessTypes);
const responsibilityBodySchema = object({
  name: string.required(),
  accessTypes: array(AccessType).min(1).required(),
  status: statusString.required(),
});

const ResponsibilityValidation = {
  postResponsibility: {
    body: responsibilityBodySchema,
  },
  putResponsibility: {
    params: object({
      responsiblityId: objectIdString.required(),
    }).unknown(true),
    body: responsibilityBodySchema,
  },
  getResponsibilities: {
    query: object({
      search: string.empty(''),
      accessType: AccessType.empty(''),
      status: statusString.empty(''),
      page: pageNumber,
      limit: limitItemNumber,
    }),
  },
};

export { ResponsibilityValidation };
