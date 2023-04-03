import { IUser } from '@definitions/user';

namespace GeneralEnum {
  export enum FileType {
    'MS_EXCEL' = 'application/vnd.ms-excel',
    'SPREAD_SHEET' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'IMAGE_JPEG' = 'image/jpeg',
    'IMAGE_JPG' = 'image/jpg',
    'IMAGE_PNG' = 'image/png',
  }

  export enum Status {
    'ACTIVE' = 'ACTIVE',
    'INACTIVE' = 'INACTIVE',
  }

  export enum DistanceUnit {
    'CM' = 'CM',
    'M' = 'M',
  }

  export enum WeightUnit {
    'KG' = 'KG',
    'TON' = 'TON',
  }

  export enum ServiceType {
    'LTL' = 'LTL',
    'FTL' = 'FTL',
  }

  export enum LocationType {
    'Point' = 'Point',
    'Polygon' = 'Polygon',
  }

  export enum Transport {
    'Truck' = 'Truck',
    'Container' = 'Container',
    'CDD' = 'CDD',
    'CDC' = 'CDC',
    'Other' = 'Other',
  }

  export enum PricingType {
    '3LC' = '3LC',
    'District' = 'District',
  }

  export enum RegionReference {
    'Country' = 'Country',
    'Province' = 'Province',
    'City' = 'City',
    'District' = 'District',
  }

  export enum SortDirection {
    'ASC' = 'ASC',
    'DESC' = 'DESC',
  }

  export enum ApiOrigin {
    'TMS' = 'TMS',
    'MARKETPLACE_TMS' = 'MARKETPLACE_TMS',
  }

  export enum BalanceEvent {
    'ORDER_CONFIRMED' = 'ORDER_CONFIRMED',
    'ADDITIONAL_CHARGE_PAID' = 'ADDITIONAL_CHARGE_PAID',
    'ORDER_COMPLETED' = 'ORDER_COMPLETED',
    /**
     * Event of when additional charge is added after order completion
     */
    'ADDITIONAL_CHARGE_ADDED' = 'ADDITIONAL_CHARGE_ADDED',
    'WITHDRAW_REQUESTED' = 'WITHDRAW_REQUESTED',
  }
}

declare namespace IGeneral {
  type UnixTimestamp = number;

  interface IItem {
    qty: number;
    dimension: IDimension;
  }

  interface IDimension {
    length: number;
    width: number;
    height: number;
    unit: GeneralEnum.DistanceUnit;
  }

  interface IPagination {
    page?: number;
    limit?: number;
  }

  interface IUserInformation {
    userId: IUser.IDataSchema['_id'];
    email?: string;
    name: string;
  }

  interface IRegion<TIData = string> {
    id: string | TIData;
    name: string;
    code?: string;
  }

  interface ICreated {
    createdAt: IGeneral.UnixTimestamp;
    createdBy: IUserInformation;
  }

  interface IUpdated {
    updatedAt?: IGeneral.UnixTimestamp;
    updatedBy?: IUserInformation;
  }

  interface IDeleted {
    deletedAt?: IGeneral.UnixTimestamp;
    deletedBy?: IUserInformation;
  }

  interface ILocation {
    location: {
      type: GeneralEnum.LocationType;
      coordinates: number[];
    };
  }

  interface IList<T> {
    totalFilteredData: number;
    items: T[];
  }

  interface IIdParam {
    id: string;
  }

  interface IMulterFile {
    key: string;
    path: string;
    mimetype: string;
    originalname: string;
    size: number;
  }

  interface IFormattedIdParam {
    formattedId: string;
  }

  interface ICountAggregateResult {
    count: number;
  }

  interface IReference {
    id: string;
    name: string;
  }
}

export { IGeneral, GeneralEnum };
