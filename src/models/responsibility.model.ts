import { Schema, model } from 'mongoose';

import { ResponsibilityEnum, IResponsibility } from '@definitions';
import { createdSchemaObject, deletedSchemaObject, statusSchema, updatedSchemaObject } from '@models';
import { convertEnumToArray } from '@server/utils/object';

export const accessTypes = convertEnumToArray<ResponsibilityEnum.AccessType>(ResponsibilityEnum.AccessType);

const ResponsibilitySchema: Schema = new Schema({
  formattedId: { type: String, required: true },
  name: { type: String, required: true },
  accessTypes: [
    {
      type: String,
      enum: ResponsibilityEnum.AccessType,
      required: true,
    },
  ],
  status: { ...statusSchema, required: true },
  ...createdSchemaObject,
  ...updatedSchemaObject,
  ...deletedSchemaObject,
});

const ResponsibilityModel = model<IResponsibility.IDataSchema>('Responsibility', ResponsibilitySchema);
export { ResponsibilityModel };
