import httpStatus from 'http-status';
import { ApiError, Util } from '@hzn-one/commons';
import randomstring from 'randomstring';

import { GeneralEnum, IAuth, IUser, UserEnum } from '@definitions';
import { IAuthController } from '@v1-definitions';
import { generateToken } from '@utils/jwt';
import { sendEmail, senderAccount } from '@config/mail';
import { ResponsibilityModel, UserModel } from '@models';
import { getResetPasswordEmail } from '@utils/email';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import { hashPassword, isMatchingPassword } from '@utils/password';

const AuthService = {
  login: async (data: IAuthController.IPostLoginRequest): Promise<IAuthController.IPostLoginResponse> => {
    let user: IUser.IDataSchema;
    const userWhere = {
      email: data.email.toLowerCase(),
      deletedAt: null,
      status: GeneralEnum.Status.ACTIVE,
    };

    if (data.serviceProviderSlug) {
      const userServiceProvider = await UserModel.findOne(
        {
          status: GeneralEnum.Status.ACTIVE,
          deletedAt: null,
          slug: data.serviceProviderSlug,
        },
        '_id',
      ).lean();

      if (!userServiceProvider) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid service provider');
      }

      userWhere['parents.approvalStatus'] = UserEnum.ApprovalStatus.APPROVED;
      userWhere['parents.user'] = userServiceProvider._id.toString();

      user = await UserModel.findOne(userWhere).lean();
    } else {
      user = await UserModel.findOne(userWhere).lean();
    }

    // When user exist but doesn't have source, the default source is TMS
    if (user && typeof user.source === 'undefined') {
      user.source = UserEnum.UserSource.TMS;
    }

    if (
      !user ||
      (user.role === UserEnum.Role.CUSTOMER && user.source === UserEnum.UserSource.TMS && !data.serviceProviderSlug) ||
      (user.role !== UserEnum.Role.INTERNAL && user.source !== data.userSource) || // only internal user are allowed to login to anywhere.
      !(await isMatchingPassword(data.password, user.password))
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Email and password doesn't match", true);
    }

    const userFiltered = Util.pick(user, ['name', 'email', 'role', 'type', 'formattedId', 'photoUrl', 'slug']);
    const tokenData: IAuth.IUserInformationData = {
      ...Util.pick(userFiltered, ['name', 'email', 'role', 'type', 'formattedId']),
      userId: user._id,
      accessTypes: [],
    };

    if (user.role === UserEnum.Role.INTERNAL) {
      const responsibility = await ResponsibilityModel.findById(user.internal.responsibility).lean();

      if (!responsibility) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Email and password doesn't match", true);
      }

      userFiltered['internal'] = {};
      userFiltered['internal']['responsibility'] = Util.pick(responsibility, ['formattedId', 'name', 'accessTypes']);

      tokenData['accessTypes'] = userFiltered.internal.responsibility.accessTypes;
    }

    if (user.type === UserEnum.UserType.COMPANY) userFiltered['company'] = Util.pick(user['company'], ['name']);

    if (user.type === UserEnum.UserType.INDIVIDUAL) userFiltered['individual'] = user['individual'];

    return {
      ...userFiltered,
      id: user._id,
      phone: user.phone,
      token: generateToken(tokenData),
    };
  },
  requestResetPassword: async (email: string): Promise<void> => {
    const user = await UserModel.findOne({ email });

    if (!user) return; // don't do anything if email is not found

    user.resetPasswordToken = randomstring.generate(32);
    user.updatedAt = getCurrentUnixTimestamp();
    await user.save();

    await sendEmail({
      subject: 'Confirm Password Reset',
      sender: senderAccount,
      to: [{ email }],
      htmlContent: getResetPasswordEmail(user.name, user.resetPasswordToken),
    });
  },
  resetPassword: async (data: IAuthController.IPatchResetPasswordRequest) => {
    const { token, password } = data;

    const user = await UserModel.findOne({ resetPasswordToken: { $exists: true, $eq: token } });

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Token not found', true);

    user.password = await hashPassword(password);
    user.updatedAt = getCurrentUnixTimestamp();
    user.updatedBy = {
      userId: user._id,
      email: user.email,
      name: user.name,
    };
    user.resetPasswordToken = undefined; // unset used reset password token

    await user.save();
  },
};

export { AuthService };
