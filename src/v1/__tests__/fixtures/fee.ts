import { GeneralEnum, IFee, FeeEnum } from '@definitions';

export const constructFeeFields = (customFields = {}): IFee.IDataLean => {
  const { ...otherCustomFields } = customFields as any;

  return {
    name: 'Commission Fee',
    rate: 2.5,
    status: GeneralEnum.Status.ACTIVE,
    targetUsers: [FeeEnum.TargetUsers.SERVICE_PROVIDER],
    ...otherCustomFields,
  };
};
