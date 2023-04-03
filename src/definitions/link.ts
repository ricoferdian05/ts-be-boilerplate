import { Document, LeanDocument } from 'mongoose';

import {
  IGeneral,
} from '@definitions';

declare namespace ILink {
    interface IData {
        title: string;
        link: string;
        createdBy: IGeneral.IUserInformation;
    }

    interface IDataSchema extends IData, Document {}
    interface IDataLean extends LeanDocument<IData & { _id: any }> {}
}

export { ILink };