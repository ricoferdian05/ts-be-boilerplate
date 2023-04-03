import { Document, LeanDocument } from 'mongoose';
import { GeneralEnum, IGeneral } from './general';

namespace ResponsibilityEnum {
  export enum AccessType {
    'CREATE' = 'CREATE',
    'UPDATE' = 'UPDATE',
    'READ' = 'READ',
    'DELETE' = 'DELETE',
  }
}

declare namespace IResponsibility {
  interface IData extends IGeneral.ICreated, IGeneral.IUpdated, IGeneral.IDeleted {
    formattedId?: string;
    name: string;
    accessTypes: ResponsibilityEnum.AccessType[];
    status: GeneralEnum.Status;
  }

  interface IDataSchema extends IData, Document {}

  interface IDataLean extends LeanDocument<IData & { _id: any }> {}
}

export { IResponsibility, ResponsibilityEnum };
