# SeventySix Copilot Instructions

## Code Formatting (CRITICAL - .ts and .cs)

| Rule           | Do                                        | Don't                          |
| -------------- | ----------------------------------------- | ------------------------------ |
| Variable names | Descriptive: `service`, `index`, `user`   | Abbreviations: `svc`, `i`, `u` |
| 2+ params      | Each on new line, indented                | Same line                      |
| Lambda params  | Lambda on new line after `(`              | Lambda inline with `(`         |
| Binary ops     | `\|\|` on LEFT of new line                | End of line                    |
| Assignment `=` | ALWAYS new line after `=`, value indented | Value on same line             |
| Chains         | New line BEFORE `.`, indented             | One line                       |
| Closing `)`    | With last param                           | Alone on line                  |
| Nulls (C#)     | `user?.ToDto()`                           | `if (user == null)`            |

### Formatting Examples

```csharp
// ✅ CORRECT
User? user =
    await repo.GetByIdAsync(id);

builder
    .Property(
        user => user.Username)
    .HasMaxLength(100);

await bus.InvokeAsync<UserDto?>(
    new GetUserByIdQuery(id),
    cancellationToken);
```

---

## Architecture Overview

### Server Projects (SeventySix.Server/)

```
SeventySix.Shared     → Base abstractions (NO domain refs)
SeventySix.Domains    → Bounded contexts (refs Shared only)
SeventySix.Api        → HTTP layer (refs Domains)
```

**Bounded Contexts**: Identity, Logging, ApiTracking, ElectronicNotifications, Game (future)

### Client Structure (SeventySix.Client/src/app/)

```
shared/     → @shared/*   (cross-cutting, NO domain refs)
domains/    → @admin/*, @game/*, @commerce/*
```

### Import Rules (CRITICAL)

**Server**: `Shared ← Domains ← Api` (never reverse)

**Client**: Each domain imports ONLY `@shared/*` + itself. NEVER another domain.

| From → To | @shared | @admin | @game | @commerce |
| --------- | ------- | ------ | ----- | --------- |
| @shared   | ✅      | ❌     | ❌    | ❌        |
| @admin    | ✅      | ✅     | ❌    | ❌        |
| @game     | ✅      | ❌     | ✅    | ❌        |
| @commerce | ✅      | ❌     | ❌    | ✅        |

**Cross-domain features** → Use `integrations/` folder (only place allowed to import multiple domains)

---

## C# (.NET 10+)

| Rule         | Pattern                                       |
| ------------ | --------------------------------------------- |
| Types        | `string name = ""` never `var`                |
| Constructors | `class UserService(IRepo repo)` primary only  |
| Collections  | `[1, 2, 3]` not `new List`                    |
| Async        | Suffix `*Async` always                        |
| DTOs         | `record UserDto(int Id)` positional           |
| Settings     | `record X { prop { get; init; } = default; }` |
| EF Config    | Fluent API, never attributes                  |
| Queries      | `AsNoTracking()` for reads                    |
| FK naming    | Suffix `*Id`: `UserId`, `RoleId`              |
| Audit fields | String `CreatedBy`, not FK                    |

### Server File Locations

| Type         | Location in Domain         | Namespace                     |
| ------------ | -------------------------- | ----------------------------- |
| Commands     | `{Domain}/Commands/`       | `SeventySix.{Domain}`         |
| Queries      | `{Domain}/Queries/`        | `SeventySix.{Domain}`         |
| DTOs         | `{Domain}/DTOs/`           | `SeventySix.{Domain}`         |
| Entities     | `{Domain}/Entities/`       | `SeventySix.{Domain}`         |
| DbContext    | `{Domain}/Infrastructure/` | `SeventySix.{Domain}`         |
| Repositories | `{Domain}/Repositories/`   | `SeventySix.{Domain}`         |
| Services     | `{Domain}/Services/`       | `SeventySix.{Domain}`         |
| Settings     | `{Domain}/Settings/`       | `SeventySix.{Domain}`         |
| Registration | `Api/Registration/`        | `SeventySix.Api.Registration` |

### Logging

| Level       | Usage                          |
| ----------- | ------------------------------ |
| Debug       | NEVER                          |
| Information | Background job completion ONLY |
| Warning     | Recoverable issues             |
| Error       | Unrecoverable failures         |

### Transactions

-   Single write: Direct `SaveChangesAsync`
-   Multiple entities: Consolidated `SaveChangesAsync`
-   Read-then-write: `TransactionManager`

---

## Angular (20+)

| Rule             | Pattern                            |
| ---------------- | ---------------------------------- |
| Zone             | Zoneless only, never Zone.js       |
| DI               | `inject(Service)` not constructor  |
| Types            | `const name: string = ""` explicit |
| Detection        | `OnPush` always                    |
| Inputs           | `input.required<T>()`              |
| Outputs          | `output<T>()`                      |
| Control flow     | `@if`, `@for`, `@switch`           |
| Host             | `host: {}` not `@HostBinding`      |
| Classes          | `[class.x]` not `ngClass`          |
| Styles           | `[style.x]` not `ngStyle`          |
| Templates        | `computed()` not method calls      |
| Cleanup          | `takeUntilDestroyed()`             |
| Component naming | `*Page` only if model conflict     |

### Client File Locations

| Type             | Location in Domain      | Import From             |
| ---------------- | ----------------------- | ----------------------- |
| Route Pages      | `{domain}/pages/`       | Route `loadComponent`   |
| Subdomain Pages  | `{domain}/{sub}/pages/` | Route `loadComponent`   |
| Error Pages      | `shared/pages/`         | `@shared/pages`         |
| Domain DTOs      | `{domain}/models/`      | `@{domain}/models`      |
| Shared DTOs      | `shared/models/`        | `@shared/models`        |
| Domain Services  | `{domain}/services/`    | Route `providers` array |
| Persistent State | `{domain}/core/`        | `providedIn: 'root'` OK |
| Domain Models    | `{domain}/models/`      | `@{domain}/models`      |
| Domain Tests     | `{domain}/testing/`     | `@{domain}/testing`     |
| Shared Services  | `shared/services/`      | `providedIn: 'root'`    |

### Page Organization (CRITICAL)

**Rule**: All full route-level pages live in `pages/` folders

| Page Type      | Location                | Example                              |
| -------------- | ----------------------- | ------------------------------------ |
| Domain Page    | `{domain}/pages/`       | `admin/pages/admin-dashboard/`       |
| Subdomain Page | `{domain}/{sub}/pages/` | `admin/users/pages/user-management/` |
| Error Page     | `shared/pages/`         | `shared/pages/not-found/`            |

**Why**: Separates route-level pages from reusable components. Components folder contains composable UI pieces; pages folder contains full route destinations.

### Service Scoping (CRITICAL)

| Type           | Location             | Injectable              |
| -------------- | -------------------- | ----------------------- |
| App Singleton  | `@shared/services`   | `providedIn: 'root'`    |
| Domain Persist | `@{domain}/core`     | `providedIn: 'root'` OK |
| Domain Scoped  | `@{domain}/services` | Route `providers` ONLY  |

**Rule**: `@{domain}/services/` must NEVER use `providedIn: 'root'`

---

## SCSS

| Rule      | Pattern                             |
| --------- | ----------------------------------- |
| Sizing    | `rem` via `vars.$spacing-*`         |
| px OK     | border, radius, shadow, breakpoints |
| Colors    | `var(--color-info)` semantic        |
| Variables | `vars.$spacing-lg` not `1rem`       |
| Patterns  | Mixin after 3x repetition           |

---

## Testing

| Rule          | Pattern                            |
| ------------- | ---------------------------------- |
| Approach      | 80/20 - critical paths only        |
| TDD           | Failing test first                 |
| Failing tests | Fix immediately, never skip        |
| Async suffix  | `*Async` on all async tests        |
| Angular       | `npm test` (headless)              |
| Angular setup | `provideZonelessChangeDetection()` |
| .NET          | `dotnet test`                      |
| Libraries     | xUnit, NSubstitute, Shouldly       |
| Forbidden     | Moq, FluentAssertions              |

---

## Constants

-   C#: `RoleConstants.Developer` (PascalCase)
-   TS: `ROLE_DEVELOPER` (SCREAMING_SNAKE)
-   Never hardcode repeated strings

## Documentation

-   Inline JSDoc/XML comments only
-   Never create .md files unless asked
-   Self-documenting code preferred
