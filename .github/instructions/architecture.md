# Architecture Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## System Overview

```
Angular Client ◄──HTTP──► .NET API Server
                              │
                     Bounded Contexts (SeventySix/)
                      ├─ Identity
                      ├─ Logging
                      ├─ ApiTracking
                      └─ ElectronicNotifications
                              │
                         PostgreSQL (Separate schemas)
```

## Server-Client Alignment

| Server Context             | Client Feature        | Path Alias            |
| -------------------------- | --------------------- | --------------------- |
| `Identity/`                | `admin/users/`        | `@admin/users`        |
| `Logging/`                 | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`             | `admin/api-tracking/` | `@admin/api-tracking` |
| `ElectronicNotifications/` | (server-only)         | N/A                   |
| `Infrastructure/`          | `infrastructure/`     | `@infrastructure`     |

## Server Structure

```
BoundedContext/
├── Configurations/    # EF Core Fluent API
├── DTOs/             # Records only
├── Entities/
├── Extensions/       # ToDto, ToEntity mapping
├── Infrastructure/   # DbContext
├── Repositories/     # Domain-specific (NO generic)
├── Services/
└── Validators/       # FluentValidation
```

### ElectronicNotifications Structure (Special Case)

```
ElectronicNotifications/
├── Emails/                # Email implementation
│   ├── Interfaces/
│   └── Services/
├── Extensions/            # DI registration for all notification types
└── (Future: SignalR/, SMS/, Push/)
```

| Context                 | Schema         | DbContext              |
| ----------------------- | -------------- | ---------------------- |
| Identity                | `identity`     | `IdentityDbContext`    |
| Logging                 | `logging`      | `LoggingDbContext`     |
| ApiTracking             | `api_tracking` | `ApiTrackingDbContext` |
| ElectronicNotifications | (no DB)        | N/A (service-only)     |

## DTO vs Entity vs Model vs Settings

| Type         | Purpose                          | Persisted? | API Exposed? | Location            | Naming                          |
| ------------ | -------------------------------- | ---------- | ------------ | ------------------- | ------------------------------- |
| **DTOs**     | API contracts (request/response) | No         | **Yes**      | `Context/DTOs/`     | `*Dto`, `*Request`, `*Response` |
| **Entities** | Database-persisted models        | **Yes**    | No           | `Context/Entities/` | Plain names (User, Log)         |
| **Models**   | Internal non-persisted types     | No         | No           | `Context/Models/`   | `*Result`, `*Options`, etc.     |
| **Settings** | Configuration binding            | No         | No           | `Context/Settings/` | `*Settings`                     |

**Rules**:

-   DTOs cross API boundary - serialized to/from JSON
-   Entities are EF-tracked and saved to database - never returned directly from controllers
-   Models are internal service/business logic types - not persisted, not exposed
-   Settings bind to `appsettings.json` sections - context-specific config belongs in context

## Client Structure

```
SeventySix.Client/src/app/
├── infrastructure/    # Cross-cutting only
│   ├── api/          # HTTP client, interceptors
│   ├── auth/         # Guards
│   └── services/     # logger, notification, storage
├── shared/           # Reusable UI components
└── features/         # Self-contained contexts
    ├── admin/        # users/, logs/, api-tracking/
    ├── game/
    └── home/
```

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |

**Rule**: Features import from `@infrastructure/` and `@shared/` only, NEVER other features.

## Feature Routes (Required)

```typescript
// features/game/game.routes.ts
export const GAME_ROUTES: Routes =
	[{
		path: "",
		loadComponent: () =>
			import("./world-map/world-map")
				.then((module) => module.WorldMap),
	}];

// app.routes.ts - use loadChildren
{
	path: "game",
	loadChildren: () =>
		import("./features/game/game.routes")
			.then((module) => module.GAME_ROUTES),
}
```

## Key Decisions

| Decision              | Rationale                           |
| --------------------- | ----------------------------------- |
| Bounded contexts      | Clear boundaries, future extraction |
| No generic repository | EF Core IS the repository           |
| Separate DbContext    | Each domain owns its data           |
| No CQRS/MediatR       | YAGNI - add when pain happens       |
| PostgreSQL only       | One DB until polyglot needed        |

## Database Conventions

### Naming Standards

| Convention     | Standard                    | Example                      |
| -------------- | --------------------------- | ---------------------------- |
| Table names    | PascalCase                  | `UserRoles`, `SecurityRoles` |
| Column names   | PascalCase                  | `UserId`, `CreateDate`       |
| FK columns     | Suffix with `Id`            | `UserId`, `RoleId`           |
| Audit columns  | String, no `Id` suffix      | `CreatedBy`, `ModifiedBy`    |
| Index names    | `IX_{Table}_{Column(s)}`    | `IX_Users_Email`             |
| FK constraints | `FK_{Child}_{Parent}_{Col}` | `FK_UserRoles_Users_UserId`  |

### Foreign Keys vs Audit Fields

-   **FK Properties**: End with `Id`, reference table PK → `UserId`, `RoleId`
-   **Audit Fields**: Store username string, track WHO acted → `CreatedBy`, `ModifiedBy`

### Cascade Delete Policy

| Relationship        | Behavior   | Example                              |
| ------------------- | ---------- | ------------------------------------ |
| Dependent children  | `CASCADE`  | User → Tokens, Credentials           |
| Lookup tables       | `RESTRICT` | SecurityRoles (can't delete if used) |
| Optional references | `SET NULL` | Soft references (rare)               |

## Configuration

**NEVER hardcode**: URLs, connection strings, intervals, limits

| Server             | Client           |
| ------------------ | ---------------- |
| `appsettings.json` | `environment.ts` |
