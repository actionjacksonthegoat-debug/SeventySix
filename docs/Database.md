# Database Strategy

> Migration rollback policy, index discipline, retention, and Drizzle conventions for the SeventySix Ecosystem.

---

## EF Core Migrations (.NET Server)

### Contexts

| Context | Project | Schema |
| ------- | ------- | ------ |
| `IdentityDbContext` | `SeventySix.Domains.Identity` | `Identity` / `security` |
| `LoggingDbContext` | `SeventySix.Domains` | `Logging` |
| `ApiTrackingDbContext` | `SeventySix.Domains` | `ApiTracking` |
| `ElectronicNotificationsDbContext` | `SeventySix.Domains` | `ElectronicNotifications` |

### Rollback Policy

Every migration **must** have a fully implemented `Down()` method that reverses all operations in `Up()`.

| Operation in `Up()` | Required `Down()` Inverse |
| ------------------- | ------------------------- |
| `CreateTable` | `DropTable` (children first) |
| `AddColumn` | `DropColumn` |
| `DropColumn` | `AddColumn` with original type/constraints |
| `CreateIndex` | `DropIndex` |
| `AddForeignKey` | `DropForeignKey` |
| `Sql("CREATE INDEX CONCURRENTLY ...")` | `Sql("DROP INDEX CONCURRENTLY ...")` |

**Data-destructive migrations** (dropping a column or table with data) require a runbook entry in this file under [Runbook Entries](#runbook-entries) before merging.

### Creating New Migrations

```bash
cd SeventySix.Server
dotnet ef migrations add <MigrationName> --context <ContextName> --project <ProjectPath> --startup-project SeventySix.Api
```

### Applying / Rolling Back

```bash
# Apply all pending migrations
dotnet ef database update --context <ContextName> --project <ProjectPath> --startup-project SeventySix.Api

# Roll back to a specific migration
dotnet ef database update <PreviousMigrationName> --context <ContextName> --project <ProjectPath> --startup-project SeventySix.Api

# Roll back to empty (initial state)
dotnet ef database update 0 --context <ContextName> --project <ProjectPath> --startup-project SeventySix.Api
```

### Index Creation Discipline

- Tables expected to exceed **1,000 rows** in production: always use `CREATE INDEX CONCURRENTLY` via `migrationBuilder.Sql(...)` in its own migration (PostgreSQL requires `CONCURRENTLY` indexes to run outside a transaction)
- Never use `ALTER TABLE` with an `ACCESS EXCLUSIVE` lock on a table with active traffic without a runbook entry
- Every index must have a paired `Down()` that drops it
- Document the motivating query in an XML comment on the entity configuration

### CI Roundtrip Verification

The `migration-roundtrip` CI job verifies every migration's `Down()` method works:

1. Spin up an empty PostgreSQL container
2. Apply all migrations for each context
3. Roll back the most recent migration
4. Re-apply all migrations
5. Drop the database

This runs on every PR and push to `master`.

---

## Drizzle Migrations (Commerce Apps)

### Structure

Both commerce apps (SvelteKit and TanStack) use Drizzle ORM with SQL-based migrations:

| App | Schema Location | Migration Output |
| --- | --------------- | ---------------- |
| SvelteKit | `src/lib/server/db/schema.ts` | `src/lib/server/db/migrations/` |
| TanStack | `src/server/db/schema.ts` | `src/server/db/migrations/` |

### Migration Workflow

1. Modify the schema in the respective `schema.ts`
2. Run `drizzle-kit generate` to produce the SQL migration file
3. **Review the generated SQL** — Drizzle does not generate `DOWN` migrations
4. Commit **both** the generated TypeScript metadata and the SQL diff
5. Apply with `npm run db:migrate` (`drizzle-kit migrate`)

### Rollback Strategy

Drizzle Kit does **not** support native rollback (`db:rollback`). The rollback strategy is:

1. **Manual SQL**: For every generated migration, write and commit a corresponding `<migration-name>.down.sql` file in the same migrations directory
2. **Schema-first recovery**: If rollback SQL is unavailable, revert the schema change in `schema.ts`, generate a new forward migration that undoes the previous change, and apply it
3. **Point-in-time recovery**: For data-destructive changes in production, rely on database backups and point-in-time recovery (PITR)

### Commit Convention

Every `npm run db:generate` commit must include:

- The generated TypeScript migration metadata
- The resulting SQL file
- A review comment in the PR describing what the migration changes

---

## Retention Policy

Unbounded table growth is prevented by scheduled retention jobs:

| Domain | Table | Default Retention | Conditions |
| ------ | ----- | ----------------- | ---------- |
| Logging | `Logs` | 30 days | All rows older than retention |
| ApiTracking | `ThirdPartyApiRequests` | 90 days | All rows older than retention |
| ElectronicNotifications | `EmailQueue` | 14 days | Only `Sent` and `Failed` rows; never touches `Pending` or `Processing` |

Retention is configurable via `*Settings.RetentionDays` in `appsettings.json`. Jobs use chunked deletes (batch size 10,000) to avoid long table locks.

---

## Runbook Entries

> Add an entry here for any data-destructive migration before merging.

| Date | Migration | Context | Description | Recovery |
| ---- | --------- | ------- | ----------- | -------- |
| 2026-03-05 | `RemoveIpColumns` | `IdentityDbContext` | Drops `LastLoginIp`, `IpAddress`, `CreatedByIp`, `ClientIp` columns | `Down()` re-adds columns; data is lost and cannot be recovered from migration alone |
