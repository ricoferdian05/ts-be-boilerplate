import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import { Mongo } from '@config/mongo';
import { TransportationTypeModel, ContainerTypeModel } from '@models';

const data = [
  {
    containerType: 'MOBIL BOX',
    transportType: 'MOBIL',
  },
  {
    containerType: 'MOBIL BAK / PICKUP',
    transportType: 'MOBIL',
  },
  {
    containerType: 'BLIND VAN',
    transportType: 'MOBIL',
  },
  {
    containerType: 'CDE BOX',
    transportType: 'CDE',
  },
  {
    containerType: 'CDE BAK',
    transportType: 'CDE',
  },
  {
    containerType: 'CDE JUMBO',
    transportType: 'CDE',
  },
  {
    containerType: 'CDE LONG',
    transportType: 'CDE',
  },
  {
    containerType: 'CDD BOX',
    transportType: 'CDD',
  },
  {
    containerType: 'CDD BAK',
    transportType: 'CDD',
  },
  {
    containerType: 'CDD LONG',
    transportType: 'CDD',
  },
  {
    containerType: 'FUSO BOX',
    transportType: 'FUSO',
  },
  {
    containerType: 'FUSO BAK',
    transportType: 'FUSO',
  },
  {
    containerType: 'TRUCK TRAILER HALF-HEIGHT 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRONTON BOX',
    transportType: 'TRUCK TRONTON',
  },
  {
    containerType: 'TRUCK TRAILER SIDE DOOR 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER TANK 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER STANDARD 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER DOUBLE DOOR 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRONTON BAK',
    transportType: 'TRUCK TRONTON',
  },
  {
    containerType: 'TRUCK TRAILER OPEN TOP 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER HARD TOP 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER PALLET WIDE 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER DOUBLE DOOR 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER HIGH CUBE 45FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER REEFER 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER OPEN TOP 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER HARD TOP 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER HIGH CUBE 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER PALLET WIDE 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER REEFER 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK WINGBOX 30 TON',
    transportType: 'TRUCK WINGBOX',
  },
  {
    containerType: 'TRUCK TRAILER FLAT RACK 20FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER SIDE DOOR 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER STANDARD 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK TRAILER FLAT RACK 40FT',
    transportType: 'TRUCK TRAILER',
  },
  {
    containerType: 'TRUCK WINGBOX STANDARD 13 TON',
    transportType: 'TRUCK WINGBOX',
  },
];

export class EnhanceMasterDataContainerType implements MigrationInterface {
  public async up(_db: Db): Promise<any> {
    await Mongo.startConnection();

    const transportList = await TransportationTypeModel.find().lean();

    for (let val of data) {
      const transportType = transportList.find((t) => t.name === val.transportType);
      await ContainerTypeModel.updateOne(
        {
          name: val.containerType,
        },
        {
          transportationType: transportType._id,
        },
      );
    }
  }

  public async down(_db: Db): Promise<any> {
    await Mongo.startConnection();

    await ContainerTypeModel.updateMany({}, { $unset: { transportationType: '' } });
  }
}
