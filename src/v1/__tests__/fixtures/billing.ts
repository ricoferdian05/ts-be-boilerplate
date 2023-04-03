import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { BillingEnum, IBilling } from '@definitions';
import { constructPaymentAccountFields } from './payment-account';

export function constructBillingFields(customFields = {}): IBilling.IDataLean {
  const { serviceProvider, customer, orders, ...otherCustomFields } = customFields as any;

  return {
    _id: new Types.ObjectId().toString(),
    formattedId: 'INV00000001',
    status: BillingEnum.Status.UNPAID,
    total: 11_000,
    serviceProvider: {
      id: new Types.ObjectId(),
      company: {
        name: 'Service Provider Company',
        email: 'admin@delivery-express.com',
        phone: '12345',
        address: 'Jl. Scientia Boulevard, Curug Sangereng, Kec. Klp. Dua, Kabupaten Tangerang, Banten 15810',
      },
      paymentAccount: constructPaymentAccountFields(),
      ...serviceProvider,
    },
    customer: {
      id: new Types.ObjectId(),
      address:
        'Jl. Perjuangan No.33A, RT.11/RW.10, Kb. Jeruk, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11530',
      name: 'Customer Name',
      email: 'contact@customer.com',
      phone: '0215302722',
      ...customer,
    },
    orders: orders || [
      {
        id: new Types.ObjectId(),
        formattedId: 'OR000001',
        destinationCity: {
          id: new Types.ObjectId(),
          name: 'Jakarta Barat',
        },
        tax: 10,
        subTotal: 10_000,
        total: 11_000,
        createdAt: dayjs().subtract(1, 'day').unix(),
      },
    ],
    ...otherCustomFields,
  };
}
