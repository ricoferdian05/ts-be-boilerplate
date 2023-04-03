import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import { Mongo } from '@config/mongo';
import { FeeModel } from '@models/fee.model';
import { FeeEnum } from '@server/definitions';
import mongoose from 'mongoose';

export class AddMasterDataFee implements MigrationInterface {
  public async up(_db: Db): Promise<any> {
    await Mongo.startConnection();

    await FeeModel.insertMany([
      {
        name: 'Commission Fee',
        rate: 2.5,
        status: 'ACTIVE',
        targetUsers: [FeeEnum.TargetUsers.SERVICE_PROVIDER],
      },
      {
        name: 'Transaction Fee',
        rate: 5,
        status: 'ACTIVE',
        targetUsers: [FeeEnum.TargetUsers.CUSTOMER],
      },
    ]);

    await mongoose.syncIndexes({ background: false });
  }

  public async down(db: Db): Promise<any> {
    await db.dropCollection('fees');
  }
}
