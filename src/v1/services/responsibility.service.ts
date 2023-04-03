import httpStatus from 'http-status';
import { ApiError } from '@hzn-one/commons';

import { IAuth } from '@definitions';
import { IResponsibilityController } from '@v1-definitions';
import { ResponsibilityModel } from '@models';

import { formatId } from '@utils/id';
import { formatResponsibilityDetails } from '@utils/formatter-responsibility';
import { getCurrentUnixTimestamp } from '@utils/datetime';
import { escapeRegex } from '@utils/string';

const ResponsibilityService = {
  createResponsibility: async (
    data: IResponsibilityController.IPostResponsibilityRequest,
    creator: IAuth.IUserInformationData,
  ): Promise<void> => {
    const totalResponsibility = (await ResponsibilityModel.countDocuments({})) + 1;
    await ResponsibilityModel.create({
      formattedId: formatId('RESP', totalResponsibility),
      name: data.name,
      accessTypes: data.accessTypes,
      status: data.status,
      createdAt: getCurrentUnixTimestamp(),
      createdBy: {
        userId: creator.userId,
        name: creator.name,
        email: creator.email,
      },
    });
  },
  findResponsibilityDetail: async (
    responsiblityId: string,
  ): Promise<IResponsibilityController.IGetResponsibilityDetailResponse> => {
    let responsibility = await ResponsibilityModel.findOne({
      formattedId: responsiblityId,
    }).lean();

    if (!responsibility) {
      throw new ApiError(httpStatus.NOT_FOUND, `Responsibility Id "${responsiblityId}" not found`, true);
    }

    return {
      id: responsibility._id,
      formattedId: responsibility.formattedId,
      name: responsibility.name,
      accessTypes: responsibility.accessTypes,
      status: responsibility.status,
      createdAt: responsibility.createdAt,
      updatedAt: responsibility.updatedAt || null,
    };
  },
  getResponsibilities: async (
    filter: IResponsibilityController.IGetResponsibilityRequest,
  ): Promise<IResponsibilityController.IGetResponsibilityResponse> => {
    let responsibilityFilter: IResponsibilityController.IGetResponsibilityFilter = {};

    if (filter.search || filter.accessType || filter.status) responsibilityFilter.$and = [];

    if (filter.search) {
      filter.search = escapeRegex(filter.search);
      responsibilityFilter.$and.push({
        $or: [
          { formattedId: { $regex: filter.search, $options: 'i' } },
          { name: { $regex: filter.search, $options: 'i' } },
        ],
      });
    }
    if (filter.accessType) responsibilityFilter.$and.push({ accessTypes: filter.accessType });
    if (filter.status) responsibilityFilter.$and.push({ status: filter.status });

    const totalFilteredData = await ResponsibilityModel.countDocuments(responsibilityFilter);

    let responsibilities = [];
    if (totalFilteredData > 0) {
      responsibilities = await ResponsibilityModel.find(responsibilityFilter, 'formattedId name accessTypes status', {
        skip: (filter.page - 1) * filter.limit,
        limit: filter.limit,
      });
    }

    return {
      totalFilteredData,
      items: responsibilities.map((responsibility) => formatResponsibilityDetails(responsibility)),
    };
  },
  updateResponsibility: async (
    responsiblityId: string,
    data: IResponsibilityController.IPostResponsibilityRequest,
    creator: IAuth.IUserInformationData,
  ): Promise<void> => {
    const responsibility = await ResponsibilityModel.findById(responsiblityId);

    if (!responsibility) {
      throw new ApiError(httpStatus.NOT_FOUND, `Responsibility _id "${responsiblityId}" not found`, true);
    }

    Object.keys(data).forEach((key) => {
      responsibility[key] = data[key];
    });
    responsibility.updatedAt = getCurrentUnixTimestamp();
    responsibility.updatedBy = {
      userId: creator.userId,
      email: creator.email,
      name: creator.name,
    };

    await responsibility.save();
  },
};

export { ResponsibilityService };
