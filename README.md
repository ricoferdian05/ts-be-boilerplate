# Transportation Management System

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HZN-one_tms&metric=alert_status&token=72bed3460bcea20686f997cb1b3b18da49aca0b9)](https://sonarcloud.io/summary/new_code?id=HZN-one_tms)

## About

TMS or Transportation Management System is a HZN properiatery fleet management software.

### API Domain:

| Env        | IP    | Domain |
| ---------- | ----- | ------ |
| Dev        | _TBD_ | _TBD_  |
| Sandbox    | _TBD_ | _TBD_  |
| Production | _TBD_ | _TBD_  |

### Static Outbound IP Address:

| Env        | IP    | Domain |
| ---------- | ----- | ------ |
| Dev        | _TBD_ | _TBD_  |
| Sandbox    | _TBD_ | _TBD_  |
| Production | _TBD_ | _TBD_  |

## Rules

1. Before push your code, make sure the import not commented in src/index.ts
2. Before you run your project locallcy, make sure the import already commented in src/index.ts

## Environment

| Class                   | Value                            | Description                                        |
| ----------------------- | -------------------------------- | -------------------------------------------------- |
| NODE_ENV                | development, production          | Development means that project run without build   |
| APP_ENV                 | development, sandbox, production | Development means that project run for development |
| PORT                    | 8080, etc                        | localhost port (for local development)             |
| PROJECT_ID              | hzn-\*                           | HZN Project ID                                     |
| TMS_JWT_SECRET          |                                  | Secret for JWT                                     |
| TMS_MONGODB_URI         |                                  | Connection string to MongoDB                       |
| TMS_WEB_BASE_URL        |                                  | Base url of TMS web application                    |
| SENDINBLUE_API_KEY      |                                  | Api key for Sendinblue                             |
| HZN_ASSET_BASE_URL.     |                                  | Base url of HZN's online storage for assets        |
| TMS_FILE_STORAGE_URI    | https://storage.googleapis.com   | Connection string to google cloud storage          |
| TMS_FILE_STORAGE_BUCKET |                                  | bucket name on google cloud storage                |

## Scripts

Before running a project locally, make sure you already exported a gcp variable in the same terminal with npm run start:dev

```
export GOOGLE_APPLICATION_CREDENTIALS='path/secret-manager-access-service-account.json'
```

| Script            | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| npm run build     | Building a project, this script will be create a folder 'build' |
| npm run start     | Run project based on build result                               |
| npm run start:dev | Run project based on src                                        |

## Migrations

Migrations are changes or actions that need to be **done once** before a user can use the system.

_Before you can run any migration command, make sure the `TMS_MONGODB_URI` environment variable has been set in the environment or the `.env` file._

- To migrate up (apply migrations) all available migrations, run `npm run migrate:up`
- To migrate down (rollback migration) the last migration, run `npm run migrate:down`
- To check which migrations are up in the database, run `npm run migrate:status`
  - `pending` status means the migration has not been applied
  - `up` status means the migration has been applied

### Creating new migration

**1. Create a new migration file with the `migrate:new` command**

```
npm run migrate:new
```

This will create a new file with `migrations/<Unix timestamp millisecond>_Migrations.ts`. You may rename the file by replacing the "Migration" word.

> **_NOTE_**
>
> `mongo-migrate-ts` (the library used to migrate) depends on the file name and its order (ascending).
>
> 1. Do NOT change the unix timestamp prefix to prevent change of migration's order.
> 2. Do NOT change the migration's file name after the migration's status is up.

**2. Edit the newly created migration file**

There are 3 things to edit here:

1. Add action(s) inside of the `up()` function. This is the **required action** that needs to be run before the new changes can be used.
2. Add action(s) inside of the `down()` function. This is a **rollback action** from what has been done in the `up()` function. This ensures that when migrating down, the system becomes what it was before the migration was up.
3. Change the classname of the migration class. This is the name shown when you run `npm run migrate:status`. Make sure the migration's classname is unique.

> **_NOTE_**
>
> Do not change a migration's classname if its status is up. This is because `mongo-migrate-ts` uses the classname as the migration identifier along with the file's path.

Now, you are good to go!

Another advice: **do not** change an existing migration when its status is up in another environment (especially in production). It is better to create a new migration to patch the fix or bring the migration down first (if it is possible to rollback).

## Folder Structure

## Testing

## Documentation

- [CI/CD Documentation](https://didikmulyadi.gitbook.io/ci-cd/)
- [Google Cloud Setup Doc](https://docs.google.com/document/d/1hzJCcbStIRqwCWWRH9BUMW8_cfnTf4gkAypI1-t2aI0/edit?usp=sharing)
- [Open API 3.0](#)
