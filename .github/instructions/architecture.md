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
├── Constants/        # Domain-specific constants (RoleConstants, ClaimConstants)
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

| Type         | Purpose                          | Persisted? | API Exposed? | Location            | Naming                          | Record Pattern                                                                            |
| ------------ | -------------------------------- | ---------- | ------------ | ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| **DTOs**     | API contracts (request/response) | No         | **Yes**      | `Context/DTOs/`     | `*Dto`, `*Request`, `*Response` | Positional parameters: `public record UserDto(int Id, string Name);`                      |
| **Entities** | Database-persisted models        | **Yes**    | No           | `Context/Entities/` | Plain names (User, Log)         | N/A (classes with EF)                                                                     |
| **Models**   | Internal non-persisted types     | No         | No           | `Context/Models/`   | `*Result`, `*Options`, etc.     | Varies by use case                                                                        |
| **Settings** | Configuration binding            | No         | No           | `Context/Settings/` | `*Settings`                     | Init properties: `public record AuthSettings { public int Timeout { get; init; } = 60; }` |

**Rules**:

-   **DTOs** cross API boundary - serialized to/from JSON - use **positional parameters** for immutability
-   **Entities** are EF-tracked and saved to database - never returned directly from controllers
-   **Models** are internal service/business logic types - not persisted, not exposed
-   **Settings** bind to `appsettings.json` sections - use **init properties with defaults** for Options pattern

**Why Different Record Patterns?**:

```csharp
// DTOs: Positional (immutable, simple construction, API contracts)
public record UserDto(int Id, string Name, string Email);
var dto = new UserDto(1, "John", "john@example.com");

// Settings: Init properties (defaults, Options pattern, configuration binding)
public record AuthSettings
{
    public int AccessTokenExpirationMinutes { get; init; } = 60;
    public int RefreshTokenExpirationDays { get; init; } = 7;
}
// Bound from appsettings.json - needs property setters for binding
```

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
| CQRS/Wolverine        | MIT license, source gen, messaging  |
| PostgreSQL only       | One DB until polyglot needed        |

## CQRS Pattern (Wolverine)

> **License**: Wolverine is MIT (free forever, commercial use allowed).
> **Philosophy**: Don't over-engineer simple contexts. Use Wolverine's advanced features only when needed.

### Folder Structure

```
Context/
├── Commands/
│   └── {Operation}/
│       ├── {Operation}Command.cs
│       ├── {Operation}CommandHandler.cs
│       └── {Operation}CommandValidator.cs  # Optional
├── Queries/
│   └── {Operation}/
│       ├── {Operation}Query.cs
│       └── {Operation}QueryHandler.cs
└── ...
```

### When to Use Wolverine Features

| Feature               | Use When                      | Don't Over-Engineer     |
| --------------------- | ----------------------------- | ----------------------- |
| Basic handlers        | All DB read/write operations  | Always applicable       |
| FluentValidation      | Commands needing input checks | Always applicable       |
| Sagas/workflows       | Multi-step stateful processes | NOT for simple contexts |
| Distributed messaging | Cross-service communication   | NOT for single-app      |
| Background jobs       | Scheduled/delayed tasks       | Use when needed         |

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

## Type Organization Rules (YAGNI)

### Core Principle

**Types stay in their feature/context unless cross-context usage is required.**

### When to Extract Types

```
Is the type imported by a DIFFERENT module/folder?
├── YES → Is it cross-context (used by multiple features)?
│   ├── YES → Move to @shared/models/ (TS) or Shared/Models/ (C#)
│   └── NO → Keep in feature/models/
└── NO → Keep inline (YAGNI)
```

### Acceptable Inline Patterns

| Pattern                                  | Example                          | Action      |
| ---------------------------------------- | -------------------------------- | ----------- |
| Same-folder imports                      | `logger.service.ts` → `LogLevel` | Keep inline |
| Test files importing from same component | `user.service.spec.ts`           | Keep inline |
| Mock files in testing folder             | `theme.service.mock.ts`          | Keep inline |
| Private types not exported               | `interface QuickAction {}`       | Keep inline |

### Cross-Context Types (Must Extract)

| Type Used By                 | Location          | Example             |
| ---------------------------- | ----------------- | ------------------- |
| Multiple features (Angular)  | `@shared/models/` | `ConfirmDialogData` |
| Multiple contexts (C#)       | `Shared/Models/`  | `PagedResult<T>`    |
| Infrastructure + any feature | `@shared/models/` | `TableColumn`       |

### C# Specific

-   Interface return types → `Context/Models/` (same context)
-   Cross-context records → `Shared/Models/`
-   Private nested types → Keep in parent class file
-   DTOs (API contracts) → `Context/DTOs/`

### TypeScript Specific

-   Feature types → `feature/models/` (never `@infrastructure/`)
-   Cross-feature shared → `@shared/models/` only
-   Service internal types → Keep inline if not exported

### Constants Organization (DRY)

| Scope             | C# Location                | TypeScript Location          |
| ----------------- | -------------------------- | ---------------------------- |
| Feature constants | `Context/Constants/`       | `feature/constants/`         |
| Cross-feature     | `Shared/Constants/`        | `@shared/constants/`         |
| Test constants    | `TestUtilities/Constants/` | `src/app/testing/constants/` |

**Naming Conventions**:

| Language   | Value Style     | File Suffix     | Example                   |
| ---------- | --------------- | --------------- | ------------------------- |
| C#         | PascalCase      | `*Constants.cs` | `RoleConstants.Developer` |
| TypeScript | SCREAMING_SNAKE | `.constants.ts` | `ROLE_DEVELOPER`          |

**Existing Patterns**:

-   `Identity/Constants/RoleConstants.cs` - Role names (`Developer`, `Admin`, `User`)
-   `TestUtilities/Constants/TestTables.cs` - Table names for test cleanup
-   `@infrastructure/models/auth/jwt-claims.model.ts` - JWT claim constants
