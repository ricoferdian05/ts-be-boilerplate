import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { ITask, TaskEnum, UserEnum } from '@definitions';

export const constructTaskFields = (
  isInTaskGroup: boolean = false,
  status: TaskEnum.StatusType = TaskEnum.StatusType.NEW,
  customFields = {},
): ITask.IDataLean => {
  const { taskGroup, order, driver, fleet, photo, ...otherCustomFields } = customFields as any;

  return {
    formattedId: 'TS000001',
    status: status,
    taskGroup: isInTaskGroup
      ? {
          formattedId: 'GR000001',
          sequence: 1,
          ...taskGroup,
        }
      : undefined,
    order: {
      id: new Types.ObjectId().toString(),
      formattedId: 'OR000001',
      serviceProvider: new Types.ObjectId().toString(),
      customerName: 'Walter White',
      serviceDateTime: dayjs().unix(),
      destinationAddress: 'Taman Mini, Jl. Malaka',
      distance: 684,
      ...order,
    },
    driver: {
      id: new Types.ObjectId().toString(),
      formattedId: 'IDN0001-WRK000001',
      ...driver,
    },
    fleet: {
      id: new Types.ObjectId().toString(),
      licensePlate: 'B 1234 AC',
      ...fleet,
    },
    photo:
      status === TaskEnum.StatusType.COMPLETED
        ? {
            deliveryProofs: ['https://picsum.photos/200/300', 'https://picsum.photos/300/400'],
            signature: 'https://picsum.photos/200',
            ...photo,
          }
        : undefined,
    failureReason: status === TaskEnum.StatusType.FAILED ? 'Wrong address' : undefined,
    completedBy: status === TaskEnum.StatusType.COMPLETED ? UserEnum.Role.DRIVER : undefined,
    ...otherCustomFields,
  };
};
