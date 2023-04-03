import { IExpense } from '@definitions';
import dayjs from 'dayjs';
import { Types } from 'mongoose';

export function constructExpenseFields(customFields = {}): IExpense.IDataLean {
  const { tasks, items, ...otherCustomFields } = customFields as any;

  return {
    _id: new Types.ObjectId().toString(),
    tasks: tasks || [
      {
        formattedId: 'TS000001',
        taskGroup: { formattedId: 'GR000001' },
        order: {
          formattedId: 'OR000001',
          serviceType: 'LTL',
          serviceDateTime: dayjs().add(1, 'day').unix(),
          customer: { name: 'Customer Name' },
          originCity: { name: 'Jakarta Barat' },
          destinationCity: { name: 'Jakarta Timur' },
        },
        driver: { id: new Types.ObjectId().toString(), name: 'Driver Name' },
      },
    ],
    items: items || [
      {
        expenseItemId: new Types.ObjectId().toString(),
        expenseItemName: 'Toll Fee',
        cashAdvance: 100000,
      },
    ],
    serviceProvider: new Types.ObjectId().toString(),
    totalCashAdvance: 100000,
    actualExpense: 0,
    ...otherCustomFields,
  };
}
