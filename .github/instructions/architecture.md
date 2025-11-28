# Architecture Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## System Overview

```
Angular Client ◄──HTTP──► .NET API Server
                              │
                     Bounded Contexts (SeventySix/)
                      ├─ Identity
                      ├─ Logging
                      └─ ApiTracking
                              │
                         PostgreSQL (Separate schemas)
```

## Server-Client Alignment

| Server Context    | Client Feature        | Path Alias            |
| ----------------- | --------------------- | --------------------- |
| `Identity/`       | `admin/users/`        | `@admin/users`        |
| `Logging/`        | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`    | `admin/api-tracking/` | `@admin/api-tracking` |
| `Infrastructure/` | `infrastructure/`     | `@infrastructure`     |

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

| Context     | Schema         | DbContext              |
| ----------- | -------------- | ---------------------- |
| Identity    | `identity`     | `IdentityDbContext`    |
| Logging     | `logging`      | `LoggingDbContext`     |
| ApiTracking | `api_tracking` | `ApiTrackingDbContext` |

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

## Configuration

**NEVER hardcode**: URLs, connection strings, intervals, limits

| Server             | Client           |
| ------------------ | ---------------- |
| `appsettings.json` | `environment.ts` |
