import { IUser, UserEnum } from '@definitions';

declare namespace IAuthController {
  interface IPostLoginRequest {
    serviceProviderSlug?: string;
    email: string;
    password: string;
    userSource: UserEnum.UserSource;
  }

  interface IPostExchangeToken {
    firebaseTokenId: string;
  }

  interface IPostLoginResponse {
    id: IUser.IDataSchema['_id'];
    phone: string;
    token: string;
    name: string;
    email?: string;
    photoUrl: string;
    slug?: string;
    role: UserEnum.Role;
    type: UserEnum.UserType;
    formattedId: string;
    internal?: IUser.IInternal;
    company?: Pick<IUser.ICompany, 'name'>;
    individual?: IUser.IIndividual;
    SPEmployee?: IUser.ISPEmployee;
    driver?: IUser.IDriver;
    hasPin?: boolean;
  }

  interface IPostResetPasswordEmailRequest {
    email: string;
  }

  interface IPatchResetPasswordRequest {
    token: string;
    password: string;
  }
}

export { IAuthController };
