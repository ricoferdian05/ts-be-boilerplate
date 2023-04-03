import { mongoMigrateCli } from 'mongo-migrate-ts';

mongoMigrateCli({
  uri: process.env.TMS_MONGODB_URI,
  migrationsDir: 'migrations',
  migrationsCollection: 'migration_changelogs',
});
