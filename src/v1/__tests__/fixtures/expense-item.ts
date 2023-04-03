import { GeneralEnum, IExpenseItem } from '@definitions';
import { userInformation } from '@v1-tests/fixtures/user';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';

export const constructExpenseItemFields = (customFields = {}): IExpenseItem.IData => {
  return {
    name: 'Expense Item One',
    status: GeneralEnum.Status.ACTIVE,
    createdAt: getCurrentUnixTimestamp(),
    createdBy: userInformation,
    ...customFields,
  };
};
