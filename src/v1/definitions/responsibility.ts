import { GeneralEnum, IGeneral, ResponsibilityEnum } from '@definitions';

declare namespace IResponsibilityController {
  interface IPostResponsibilityRequest {
    name: string;
    accessTypes: ResponsibilityEnum.AccessType[];
    status: GeneralEnum.Status;
  }

  interface IGetResponsibilityDetailRequest {
    formattedResponsibilityId: string;
  }

  interface IPutResponsibilityRequest {
    responsiblityId: string;
  }

  interface IGetResponsibilityDetailResponse {
    id: string;
    formattedId?: string;
    name: string;
    accessTypes: ResponsibilityEnum.AccessType[];
    status: GeneralEnum.Status;
    createdAt: IGeneral.UnixTimestamp;
    updatedAt?: IGeneral.UnixTimestamp;
  }

  interface IGetResponsibilityRequest {
    search?: string;
    accessType?: ResponsibilityEnum.AccessType;
    status?: GeneralEnum.Status;
    page?: number;
    limit?: number;
  }

  interface IResponsibilityDetail {
    id: string;
    formattedId?: string;
    name: string;
    accessTypes: ResponsibilityEnum.AccessType[];
    status: GeneralEnum.Status;
  }
  interface IGetResponsibilityResponse {
    totalFilteredData: number;
    items: IResponsibilityDetail[];
  }
  interface IGetResponsibilityFilter {
    $and?: Object[];
  }
}

export { IResponsibilityController };
