import httpStatus from 'http-status';
import { FilterQuery, PipelineStage } from 'mongoose';
import { ApiError } from '@hzn-one/commons';
import { formatId } from '@server/utils/id';
import {
  GeneralEnum,
  UserEnum,
  IAuth,
  IGeneral,
  IUser,
} from '@definitions';
import {
  ResponsibilityModel,
  UserModel,
  LinkModel,
} from '@models';
import { IUserController } from '@v1-definitions';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import {
  constructGetUsersQuery,
  constructGetUsersAggregate,
} from '@utils/query-user';
import { hashPassword } from '@utils/password';

const UserService = {
  getServiceProviderBySlug: async (slug: string): Promise<IUserController.IGetServiceProviderBySlugResponse> => {
    const user = await UserModel.findOne(
      { slug, deletedAt: null, status: GeneralEnum.Status.ACTIVE },
      'photoUrl company.name company.serviceTypes -_id',
    ).lean<IUserController.IGetServiceProviderBySlugResponse>();

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Service provider not found', true);

    return user;
  },
  createInternalUser: async (
    data: IUserController.IPostUserInternalsRequest,
    creator: IAuth.IUserInformationData,
  ): Promise<void> => {
    const responsibility = await ResponsibilityModel.findOne(
      { formattedId: data.responsibility, deletedAt: null },
      '_id',
    );
    if (!responsibility) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Responsibility "${data.responsibility}" does not exist`, true);
    }

    const password = await hashPassword(data.password);
    const totalUsers = await UserModel.countDocuments({ role: UserEnum.Role.INTERNAL });
    const formattedId = formatId('ADM', totalUsers + 1);

    await UserModel.create({
      formattedId,
      name: data.name,
      email: data.email,
      password,
      status: data.status,
      phone: data.phone,
      role: UserEnum.Role.INTERNAL,
      createdAt: getCurrentUnixTimestamp(),
      createdBy: {
        userId: creator.userId,
        name: creator.name,
        email: creator.email,
      },
      internal: {
        responsibility: responsibility._id,
      },
      source: data.userSource,
    });
  },
  createUserLinks: async (
    data: IUserController.IPostUserLinksRequest,
    creator: IAuth.IUserInformationData,
  ): Promise<void> => {
    await LinkModel.create({
      title: data.title,
      link: data.link,
      createdBy: {
        userId: creator.userId,
        name: creator.name,
        email: creator.email,
      },
    });
  },
  getUsers: async (
    filter: IUserController.IGetUsersRequest,
    caller: IAuth.IUserInformationData,
  ): Promise<IGeneral.IList<IUserController.IUserDetail>> => {
    const queries = await constructGetUsersQuery(filter);
    const userFilter: FilterQuery<IUser.IData> = {
      ...queries,
    };

    const userProjection = {
      _id: 0,
      id: '$_id',
      formattedId: 1,
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      type: 1,
      status: 1,
      source: 1,
      createdAt: 1,
      'company.name': 1,
      'company.email': 1,
      'company.phone': 1,
      'company.city': 1,
      'internal.responsibility': 1,
      'driver.licenseType': 1,
      'driver.employeeType': 1,
    };

    if (caller.role === UserEnum.Role.INTERNAL) {
      userProjection['company.communityCode'] = 1;
    }

    const options = {
      sort: { createdAt: -1 },
      limit: filter.limit,
      skip: (filter.page - 1) * filter.limit,
    };

    let aggregatePipeline: PipelineStage[];
    let totalFilteredData = 0;
    if (filter.role === UserEnum.Role.CUSTOMER) {
      aggregatePipeline = await constructGetUsersAggregate(filter, userFilter);

      const countResult = await UserModel.aggregate<IGeneral.ICountAggregateResult>([
        ...aggregatePipeline,
        { $count: 'count' },
      ]);
      totalFilteredData = countResult[0]?.count || 0;
    } else {
      totalFilteredData = await UserModel.countDocuments(userFilter);
    }

    if (totalFilteredData === 0) throw new ApiError(httpStatus.NOT_FOUND, 'User not found', true);

    let users = [];

    switch (filter.role) {
      case UserEnum.Role.INTERNAL:
        users = await UserModel.find(userFilter, userProjection, options)
          .populate('internal.responsibility', 'name formattedId -_id')
          .lean();
        break;

      case UserEnum.Role.CUSTOMER:
        const customerOptions: PipelineStage[] = [
          { $sort: { createdAt: -1 } },
          { $skip: (filter.page - 1) * filter.limit },
          { $limit: filter.limit },
        ];

        userProjection['parents'] = [{ $first: '$parents' }];
        users = await UserModel.aggregate([
          ...aggregatePipeline,
          { $project: { ...userProjection } },
          ...customerOptions,
        ]);
        break;

      default:
        users = await UserModel.find(userFilter, userProjection, options).lean();
    }

    console.log("users", users)
    return {
      totalFilteredData,
      items: users,
    };
  },

  getLinks: async (
    filter: IUserController.IGetUserLinksRequest,
    // caller: IAuth.IUserInformationData,
  ): Promise<any> => {
    const queries = await constructGetUsersQuery(filter);
    const linkFilter: FilterQuery<IUser.ILinks> = {
      ...queries,
    };
    console.log(JSON.stringify(queries) )

    // { email: { $in: [/^(.*?(kalimat)[^$]*)$/ ] } }
    const linkProjection = {
      _id: 0,
      id: '$_id',
      title: 1,
      link: 1,
      createdAt: 1,
      createdBy: 1,
      updatedAt: 1,
      deletedAt: 1,
    };

    const options = {
      sort: { createdAt: -1 },
      limit: filter.limit,
      skip: (filter.page - 1) * filter.limit,
    };

    // let aggregatePipeline: PipelineStage[];
    let totalFilteredData = 0;
    totalFilteredData = await LinkModel.countDocuments(linkFilter);

    if (totalFilteredData === 0) throw new ApiError(httpStatus.NOT_FOUND, 'Link not found', true);

    const links = await LinkModel.find(linkFilter, linkProjection, options).lean();
    
    return {
      links,
    }
  },
  getUserDetails: async (formattedUserId: string, caller: IAuth.IUserInformationData): Promise<any> => {
    const query = {
      formattedId: formattedUserId,
      deletedAt: null, // only get undeleted users
    };

    const userProjection = {
      _id: 0,
      id: '$_id',
      formattedId: 1,
      photoUrl: 1,
      name: 1,
      slug: 1,
      email: 1,
      phone: 1,
      status: 1,
      role: 1,
      type: 1,
      internal: 1,
      company: 1,
      individual: 1,
      driver: 1,
      parents: {
        user: 1,
        approvalStatus: 1,
        approvalStatusAt: 1,
        customerGroup: 1,
      },
      SPEmployee: 1,
    };

    const userInformationProjection = {
      createdAt: 1,
      createdBy: 1,
      updatedAt: 1,
      updatedBy: 1,
    };

    const fullUserProjection = {
      ...userProjection,
      ...userInformationProjection,
    };

    const parentProjection = {
      _id: 0,
      id: '$_id',
      formattedId: 1,
      name: 1,
      slug: 1,
      email: 1,
      phone: 1,
      photoUrl: 1,
      'company.name': 1,
      'company.email': 1,
      'company.phone': 1,
    };

    const customerGroupProjection = {
      _id: 0,
      id: '$_id',
      serviceProvider: 1,
      name: 1,
      status: 1,
    };

    let customPopulate;
    let user: IUser.IDataSchema;
    let formattedIdType: IUser.IData['role'];

    // Validate formattedId prefix
    if (/^ADM\d{4,}$/.test(formattedUserId)) {
      formattedIdType = UserEnum.Role.INTERNAL;
    } else if (/^CSR\d{4,}$/.test(formattedUserId)) {
      formattedIdType = UserEnum.Role.CUSTOMER;
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    /* When caller (service provider / their employee) access another user data
      We need to check that user have the same parent.user.id with the caller.userId
    */
    if (
      [UserEnum.Role.CUSTOMER].includes(formattedIdType)
    ) {
      if (formattedIdType === UserEnum.Role.CUSTOMER) {
        customPopulate = { path: 'parents.customerGroup', select: customerGroupProjection };
      }

      user = await UserModel.findOne(
        {
          ...query,
        },
        userProjection,
      )
        .populate(customPopulate)
        .lean();
    } else if (
      (caller.role === UserEnum.Role.INTERNAL &&
        [UserEnum.Role.CUSTOMER].includes(formattedIdType)) ||
      [
        UserEnum.Role.CUSTOMER,
      ].includes(caller.role)
    ) {
      /*
        When internal access another user or
        user (customer, driver, service provider) access their self
      */
      customPopulate = [{ path: 'parents.user', select: parentProjection }];
      if (formattedIdType === UserEnum.Role.CUSTOMER) {
        customPopulate.push({ path: 'parents.customerGroup', select: customerGroupProjection });
      }

      user = await UserModel.findOne(query, fullUserProjection).populate(customPopulate).lean();
    } else {
      // When caller (internal) access internal user
      user = await UserModel.findOne(query, fullUserProjection)
        .populate('internal.responsibility', {
          _id: 0,
          id: '$_id',
          formattedId: 1,
          name: 1,
          accessTypes: 1,
          status: 1,
        })
        .lean();
    }

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found', true);

    /* When caller is service provider
       Only return a parent that related with the caller
    */
    if (formattedIdType === UserEnum.Role.CUSTOMER) {
      const selectedParents = user.parents.filter((parent) => parent.user.toString() === caller.userId);
      return {
        ...user,
        parents: selectedParents,
      };
    }

    return user;
  },
};

export { UserService };
