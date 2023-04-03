import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import { Mongo } from '@config/mongo';
import { TransportationTypeModel } from '@models';
import { FleetEnum } from '@definitions';
import mongoose from 'mongoose';
import { getCurrentUnixTimestamp } from '@server/utils/datetime';

export class Migration1658276112405 implements MigrationInterface {
  public async up(_db: Db): Promise<any> {
    await Mongo.startConnection();

    await TransportationTypeModel.insertMany([
      {
        name: 'MOBIL',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'CDE',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'CDD',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'FUSO',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'TRUCK TRAILER',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'TRUCK TRONTON',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
      {
        name: 'TRUCK WINGBOX',
        freightType: FleetEnum.Freight.Inland,
        createdAt: getCurrentUnixTimestamp(),
      },
    ]);

    await mongoose.syncIndexes({ background: false });
  }

  public async down(db: Db): Promise<any> {
    await db.dropCollection('transportation_types');
  }
}
