import { ResponsibilityEnum } from './responsibility';
import { IUser, UserEnum } from './user';

declare namespace IAuth {
  interface  IUserInformationData {
    userId: IUser.IDataSchema['_id'];
    email?: string; // Driver doesn't have email
    name: string;
    formattedId: string;
    role: UserEnum.Role;
    type: UserEnum.UserType;
    accessTypes: ResponsibilityEnum.AccessType[];
  }

  interface IToken {
    token: IUserInformationData;
  }
}

export { IAuth };
