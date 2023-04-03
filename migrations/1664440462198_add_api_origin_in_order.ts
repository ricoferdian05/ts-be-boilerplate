import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import { GeneralEnum } from '@server/definitions';

export class AddApiOriginInOrder implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    await db
      .collection('orders')
      .updateMany({ apiOrigin: { $exists: false } }, { $set: { apiOrigin: GeneralEnum.ApiOrigin.TMS } });
  }

  public async down(db: Db): Promise<any> {
    await db.collection('orders').updateMany({ apiOrigin: GeneralEnum.ApiOrigin.TMS }, { $unset: { apiOrigin: 1 } });
  }
}
