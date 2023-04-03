import httpStatus from 'http-status';
import { ApiError } from '@hzn-one/commons';
import { PipelineStage, Types, FilterQuery } from 'mongoose';

import { escapeRegex } from './string';
import { GeneralEnum, IUser, UserEnum } from '@definitions';
import { IUserController } from '@v1-definitions';
import { UserModel, ResponsibilityModel } from '@models';
import { removeUndefinedFromObject } from './object';

/**
 * Construct a get users query that support for internal, service provider, customer, and driver.
 * We put each queries inside an array for destructure purpose
 * @param filter is a filter with type IUserController.IGetUsersRequest
 * @returns Promise<object[]> is a query construct
 */
export const constructGetUsersQuery = async (filter: IUserController.IGetUsersRequest): Promise<object[]> => {
  if (filter.search) filter.search = escapeRegex(filter.search);

  /*
    A company query to put inside a search query
    when the filter.role is customer company/service provider or filter.userType is empty
  */

  // A query for searching
  const searchQueries = filter.search
    ? [
        {
          $or: [
            {
              name: { $regex: filter.search, $options: 'i' },
            },
            {
              email: { $regex: filter.search, $options: 'i' },
            },
            {
              phone: { $regex: filter.search, $options: 'i' },
            },
            {
              formattedId: { $regex: filter.search, $options: 'i' },
            },
          ],
        },
      ]
    : [];

  // A query for filtering an internal user based on responsibility
  const internalQueries = [];
  if (filter.role === UserEnum.Role.INTERNAL && filter.responsibility) {
    const responsibility = await ResponsibilityModel.findOne({ formattedId: filter.responsibility }, '_id').lean();
    if (!responsibility) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Responsibility "${filter.responsibility}" does not exist`, true);
    }
    internalQueries.push({
      internal: { $exists: true },
      'internal.responsibility': responsibility._id,
    });
  }

  // A query for filtering customer based on user type
  const customerQueries = [];
  if (filter.role === UserEnum.Role.CUSTOMER) {
    if (filter.userType) {
      customerQueries.push({ type: filter.userType });
    }

    // A query for filtering customer based on user source
    if (filter.userSource) {
      customerQueries.push({ source: filter.userSource });
    }
  }

  // Main Query
  const mainQueries = [
    {
      // Make a service provider like a customer
      role:
        filter.role !== UserEnum.Role.CUSTOMER
          ? filter.role
          : { $in: [UserEnum.Role.CUSTOMER] },
    },
    {
      deletedAt: null,
    },
    ...searchQueries,
    ...internalQueries,
    ...customerQueries,
  ];

  if (filter.status) mainQueries.push({ status: filter.status });

  return mainQueries;
};

/**
 * Construct a get users aggregate that support for customer only.
 * We put each queries inside an array for destructure purpose
 * @param filter is a filter with type IUserController.IGetUsersRequest
 * @returns Promise<object[]> is a aggregate construct
 */
export const constructGetUsersAggregate = async (
  filter: IUserController.IGetUsersRequest,
  userFilter: FilterQuery<IUser.IData>,
): Promise<PipelineStage[]> => {
  // filter.role === UserEnum.Role.CUSTOMER aggregate
  const customerGroupByFields = Object.keys(UserModel.schema.paths);
  const fieldGroupBySchema = {};
  customerGroupByFields.forEach((field) => {
    if (!['_id', '__v', 'parents'].includes(field)) {
      fieldGroupBySchema[field] = {
        $first: '$' + field,
      };
    }
  });

  // filter service provider parent first before lookup document
  let serviceProviderFilter;
  if (filter.serviceProviderId || filter.approvalStatus) {
    serviceProviderFilter = {
      parents: {
        $exists: true,
        $elemMatch: {
          user: new Types.ObjectId(filter.serviceProviderId),
        },
      },
    };

    if (filter.serviceProviderId) {
      serviceProviderFilter.parents.$elemMatch.user = new Types.ObjectId(filter.serviceProviderId);
    }

    if (filter.approvalStatus) {
      serviceProviderFilter.parents.$elemMatch.approvalStatus = filter.approvalStatus;
    }
  }

  const aggregatePipeline: PipelineStage[] = [
    {
      $match: {
        role: UserEnum.Role.CUSTOMER,
        deletedAt: null,
        ...serviceProviderFilter,
      },
    },
    {
      $unwind: {
        path: '$parents',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'parents.user',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              'company.name': 1,
              customerGroup: 1,
              _id: 0,
            },
          },
        ],
        as: 'parents.user',
      },
    },
    {
      $lookup: {
        from: 'customer_groups',
        localField: 'parents.customerGroup',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 0,
            },
          },
        ],
        as: 'parents.customerGroup',
      },
    },
    {
      $unwind: {
        path: '$parents.user',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$parents.customerGroup',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      // group by for push all parents and add other field
      $group: {
        _id: '$_id',
        parents: { $push: '$parents' },
        ...fieldGroupBySchema,
      },
    },
    {
      $match: { ...userFilter },
    },
  ];
  // end filter.role === UserEnum.Role.CUSTOMER aggregate

  return aggregatePipeline;
};

/**
 * A function that used to validate a caller is customer or not
 * @param customerId A user Id with role customer or service provider
 * @param serviceProviderId A user with role service provider
 * @returns Customer Data
 */
export const isValidCustomer = async (customerId: string, serviceProviderId: string): Promise<IUser.IDataLean> => {
  return UserModel.findOne(
    {
      _id: customerId,
      role: {
        $in: [UserEnum.Role.CUSTOMER],
      },
      parents: {
        $elemMatch: {
          user: serviceProviderId,
          approvalStatus: UserEnum.ApprovalStatus.APPROVED,
        },
      },
      deletedAt: null,
      status: GeneralEnum.Status.ACTIVE,
    },
    {
      name: 1,
      email: 1,
      parents: 1,
      company: {
        name: 1,
        email: 1,
        address: 1,
        postalCode: 1,
        city: 1,
        province: 1,
        country: 1,
      },
      individual: 1,
    },
  ).lean();
};

export const constructGetUserOptionsQuery = (
  filter: IUserController.IGetUserOptionsRequest,
  serviceProviderId: string,
): object[] => {
  if (filter.search) filter.search = escapeRegex(filter.search);

  // A query for searching
  let searchQueries = [];

  if (serviceProviderId && [UserEnum.RoleOption.DRIVER, UserEnum.RoleOption.CUSTOMER].includes(filter.role)) {
    searchQueries.push(
      removeUndefinedFromObject({
        parents: {
          $exists: true,
          $elemMatch: {
            user: serviceProviderId,
            approvalStatus: UserEnum.ApprovalStatus.APPROVED,
            customerGroup:
              filter.role === UserEnum.RoleOption.CUSTOMER && filter.isWithoutCustomerGroup
                ? { $exists: false }
                : undefined,
          },
        },
      }),
    );
  }

  if (filter.search) {
    if (filter.role === UserEnum.RoleOption.DRIVER)
      searchQueries.push({
        name: { $regex: filter.search, $options: 'i' },
      });
    else if (filter.role === UserEnum.RoleOption.SERVICE_PROVIDER)
      searchQueries.push({
        $and: [
          {
            company: { $exists: true },
          },
          {
            'company.name': { $exists: true, $regex: filter.search, $options: 'i' },
          },
        ],
      });
    else if (filter.role === UserEnum.RoleOption.CUSTOMER)
      searchQueries.push({
        $or: [
          {
            name: { $regex: filter.search, $options: 'i' },
          },
          {
            $and: [
              {
                company: { $exists: true },
              },
              {
                'company.name': { $exists: true, $regex: filter.search, $options: 'i' },
              },
            ],
          },
        ],
      });
  }

  // Main Query
  const mainQueries: object[] = [
    {
      role: filter.role,
      deletedAt: null,
    },
    ...searchQueries,
  ];

  if (filter.status) mainQueries.push({ status: filter.status });
  if (filter.isAvailable) mainQueries.push({ 'driver.isAvailable': filter.isAvailable });
  if (filter.userSource === UserEnum.UserSource.TMS) {
    mainQueries.push({ source: { $ne: UserEnum.UserSource['Marketplace Delivery'] } });
  } else {
    mainQueries.push({ source: UserEnum.UserSource['Marketplace Delivery'] });
  }

  return mainQueries;
};
