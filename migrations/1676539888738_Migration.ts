import { Db } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts';

export class Migration1676539888738 implements MigrationInterface {
  public async up(_db: Db): Promise<any> {
  }

  public async down(_db: Db): Promise<any> {
  }
}
