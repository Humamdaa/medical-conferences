# Manual local template initialization

This development-only command initializes `shared-activity` using an **existing
Supervisor**. It never creates users, changes roles/passwords, resets a database,
executes migrations, or runs during application startup.

## Configuration and command

From `backend/`, each developer verifies their local `DATABASE_URL` privately,
then runs:

```bash
read -r -p 'Existing Supervisor email or ID: ' DEV_TEMPLATE_SUPERVISOR
export DEV_TEMPLATE_SUPERVISOR
NODE_ENV=development DEV_BOOTSTRAP_CONFIRM=local-development-only npm run bootstrap:dev
unset DEV_TEMPLATE_SUPERVISOR
```

Required variables:

- `DATABASE_URL`: existing migrated local PostgreSQL database. The entry point
  loads the existing local `.env`; exported variables take precedence. Do not
  print connection strings or edit secrets to run this command.
- `NODE_ENV=development` and `DEV_BOOTSTRAP_CONFIRM=local-development-only`:
  explicit execution guards checked before constructing the Prisma client.
- `DEV_TEMPLATE_SUPERVISOR`: an existing Supervisor's email or positive database
  ID. Emails are trimmed/lowercased like authentication; numeric IDs retain
  BIGINT precision. No password or Admin credential variables are used.

Only loopback PostgreSQL hosts (`localhost`, `127.0.0.1`, `[::1]`) are accepted;
`host` query overrides are rejected. Use a container's exposed local port. Do not
use a local proxy/tunnel pointing at a remote or production database. These
checks do not replace privately verifying your database target.

The command builds the backend and runs the standalone initializer. No Prisma
seed hook is configured, and no reset is needed for an already migrated table.
After any future approved local reset, establish a Supervisor through the team's
agreed account setup procedure before running this command. Public registration
creates Doctors; this initializer never promotes them.

## Behavior

1. Resolve the supplied account and require its current role to be SUPERVISOR.
   Missing/wrong-role accounts produce a clear error without creating anything,
   even when a shared template already exists.
2. Reuse an existing `shared-activity` without changing its fields, version,
   name, timestamps, or creator.
3. Otherwise create it with `formName: "Shared Activity Form"`, `version: 1`,
   `fieldsSchema: { fields: [] }`, and the verified Supervisor's actual ID.

The operations run in a transaction. A uniqueness conflict from simultaneous
initialization may require retrying; the existing template is never overwritten.
No credentials, URLs, or raw database errors are logged. Existing users and all
other configurations remain untouched.

## Verify manually

In your normal local PostgreSQL client, run this read-only query:

```sql
SELECT f.template_key, f.form_name, f.version, f.fields_schema,
       f.supervisor_id, u.role AS creator_role
FROM activity_form_configs f
JOIN users u ON u.id = f.supervisor_id
WHERE f.template_key = 'shared-activity';
```

A new template has version 1, `{"fields":[]}`, and creator role SUPERVISOR;
a reused template retains its existing values. Log in normally and GET
`/activity-form-template` as Supervisor or Admin to verify HTTP 200.

## Offline tests

```bash
./node_modules/.bin/tsc --noEmit --incremental false
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/development/bootstrap.spec.ts src/activity-form-template/activity-form-template.swagger.spec.ts src/activity-form-template/form-schema.validator.spec.ts src/activity-form-template/activity-form-template.service.spec.ts src/activity-form-template/activity-form-template.permissions.spec.ts src/app.controller.spec.ts
```

Tests use mocked Prisma, not a live database. The initializer is never executed
by these checks. Database execution remains an explicit manual developer step.
