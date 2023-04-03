import { object, string, password, userSourceString } from '@validations/general.validation';
import { UserEnum } from '@definitions';

const AuthValidation = {
  postLogin: {
    body: object({
      serviceProviderSlug: string.allow(''),
      email: string.required().email(),
      password: password.required(),
      userSource: userSourceString.default(UserEnum.UserSource.TMS),
    }),
  },
  postResetPasswordEmail: {
    body: object({
      email: string.required().email(),
    }),
  },
  patchResetPassword: {
    body: object({
      token: string.required(),
      password: password.required(),
    }),
  },
};

export { AuthValidation };
