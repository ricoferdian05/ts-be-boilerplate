import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class RemoveTransportTypeInFleet implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    await db.collection('fleets').updateMany({}, { $unset: { transportType: '', otherTransportType: '' } });
  }

  public async down(db: Db): Promise<any> {
    const fleets = await db.collection('fleets').find().toArray();
    for (const fleet of fleets) {
      const containerType = await db.collection('container_types').findOne({ _id: fleet.container.containerType });
      const transportationType = await db
        .collection('transportation_types')
        .findOne({ _id: containerType.transportationType });
      await db.collection('fleets').updateOne({ _id: fleet._id }, { $set: { transportType: transportationType.name } });
    }
  }
}
