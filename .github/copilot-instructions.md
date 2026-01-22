# SeventySix Copilot Instructions

## ⚠️ CRITICAL: Variable Naming (NEVER VIOLATE - CHECK FIRST)

**RULE:** All variable names MUST be 3+ characters and descriptive. Single/two-letter variables are code smells.

| Context          | ❌ NEVER                         | ✅ ALWAYS                                                 |
| ---------------- | -------------------------------- | --------------------------------------------------------- |
| C# Lambdas       | `x => x.Id`, `t => t.Name`       | `user => user.Id`, `token => token.Name`                  |
| C# Lambdas       | `u => u.IsActive`, `l => l.Date` | `user => user.IsActive`, `logEntry => logEntry.Date`      |
| C# LINQ          | `.Where(r => r.ApiName)`         | `.Where(request => request.ApiName)`                      |
| TS Arrow Funcs   | `n => n.id`, `c => c.key`        | `notification => notification.id`, `column => column.key` |
| TS Array Methods | `.filter(s => s.title)`          | `.filter(section => section.title)`                       |
| Loop Variables   | `for (int i = 0; ...)`           | `foreach` OR `for (int index = 0; ...)`                   |
| Destructuring    | `const { n, c } = obj`           | `const { name, config } = obj`                            |

**Only Exception:** Angular dynamic imports `(m) => m.Component` - framework idiom.

---

## Code Formatting (CRITICAL - .ts and .cs)

| Rule           | Do                                        | Don't                          |
| -------------- | ----------------------------------------- | ------------------------------ |
| Variable names | Descriptive: `service`, `index`, `user`   | Abbreviations: `svc`, `i`, `u` |
| 2+ params      | Each on new line, indented                | Same line                      |
| Lambda params  | Lambda on new line after `(`              | Lambda inline with `(`         |
| Binary ops     | `\|\|` on LEFT of new line                | End of line                    |
| Assignment `=` | ALWAYS new line after `=`, value indented | Value on same line             |
| Chains         | New line BEFORE `.`, indented             | One line                       |
| Closing `)`    | On same line as last param/arg            | Alone on its own line          |
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

**Bounded Contexts**: Identity, Logging, ApiTracking, ElectronicNotifications

### Client Structure (SeventySix.Client/src/app/)

```
shared/     → @shared/*   (cross-cutting, NO domain refs)
domains/    → @admin/*, @sandbox/*, @developer/*
```

### Import Rules (CRITICAL)

**Server**: `Shared ← Domains ← Api` (never reverse)

**Client**: Each domain imports ONLY `@shared/*` + itself. NEVER another domain.

| From → To  | @shared | @admin | @sandbox | @developer |
| ---------- | ------- | ------ | -------- | ---------- |
| @shared    | ✅      | ❌     | ❌       | ❌         |
| @admin     | ✅      | ✅     | ❌       | ❌         |
| @sandbox   | ✅      | ❌     | ✅       | ❌         |
| @developer | ✅      | ❌     | ❌       | ✅         |

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

| Type         | Location in Domain          | Namespace                     |
| ------------ | --------------------------- | ----------------------------- |
| Commands     | `{Domain}/Commands/`        | `SeventySix.{Domain}`         |
| Queries      | `{Domain}/Queries/`         | `SeventySix.{Domain}`         |
| DTOs         | `{Domain}/POCOs/DTOs/`      | `SeventySix.{Domain}`         |
| Requests     | `{Domain}/POCOs/Requests/`  | `SeventySix.{Domain}`         |
| Responses    | `{Domain}/POCOs/Responses/` | `SeventySix.{Domain}`         |
| Results      | `{Domain}/POCOs/Results/`   | `SeventySix.{Domain}`         |
| Entities     | `{Domain}/Entities/`        | `SeventySix.{Domain}`         |
| DbContext    | `{Domain}/Infrastructure/`  | `SeventySix.{Domain}`         |
| Repositories | `{Domain}/Repositories/`    | `SeventySix.{Domain}`         |
| Services     | `{Domain}/Services/`        | `SeventySix.{Domain}`         |
| Settings     | `{Domain}/Settings/`        | `SeventySix.{Domain}`         |
| Registration | `Api/Registration/`         | `SeventySix.Api.Registration` |

### POCO Naming Conventions (Folder = Suffix)

| Type     | Folder             | Suffix      | Example                            |
| -------- | ------------------ | ----------- | ---------------------------------- |
| DTO      | `POCOs/DTOs/`      | `*Dto`      | `UserDto`, `LogDto`                |
| Request  | `POCOs/Requests/`  | `*Request`  | `LoginRequest`, `UserQueryRequest` |
| Response | `POCOs/Responses/` | `*Response` | `AuthResponse`                     |
| Result   | `POCOs/Results/`   | `*Result`   | `AuthResult`, `Result<T>`          |

**Key Distinctions:**

- **Commands/Queries**: CQRS objects stay colocated with handlers (NOT in POCOs)
- **Entities**: Domain entities stay in `Entities/` folder (NOT POCOs)
- **Request vs Response**: `*Request` = input (body/query), `*Response` = API contract output
- **Response vs Result**: `*Response` = external API contract, `*Result` = internal outcome

### Logging

| Level       | Usage                          |
| ----------- | ------------------------------ |
| Debug       | NEVER                          |
| Information | Background job completion ONLY |
| Warning     | Recoverable issues             |
| Error       | Unrecoverable failures         |

### Transactions

- Single write: Direct `SaveChangesAsync`
- Multiple entities: Consolidated `SaveChangesAsync`
- Read-then-write: `TransactionManager`

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

| Type                | Location in Domain      | Import From             |
| ------------------- | ----------------------- | ----------------------- |
| Route Pages         | `{domain}/pages/`       | Route `loadComponent`   |
| Subdomain Pages     | `{domain}/{sub}/pages/` | Route `loadComponent`   |
| Error Pages         | `shared/pages/`         | `@shared/pages`         |
| Domain DTOs         | `{domain}/models/`      | `@{domain}/models`      |
| Shared DTOs         | `shared/models/`        | `@shared/models`        |
| Contract Interfaces | `shared/interfaces/`    | `@shared/interfaces`    |
| Domain Services     | `{domain}/services/`    | Route `providers` array |
| Persistent State    | `{domain}/core/`        | `providedIn: 'root'` OK |
| Domain Models       | `{domain}/models/`      | `@{domain}/models`      |
| Domain Tests        | `{domain}/testing/`     | `@{domain}/testing`     |
| Shared Services     | `shared/services/`      | `providedIn: 'root'`    |

### Models vs Interfaces (CLIENT CRITICAL)

| Type       | Location      | File Naming           | Example                         |
| ---------- | ------------- | --------------------- | ------------------------------- |
| DTOs/POCOs | `models/`     | `{name}.model.ts`     | `user.model.ts`, `log.model.ts` |
| Contracts  | `interfaces/` | `{name}.interface.ts` | `can-deactivate.interface.ts`   |

**DTOs/POCOs** (`models/`): Data transfer objects, response types, state shapes
**Contracts** (`interfaces/`): Component/class behavioral contracts (e.g., `CanComponentDeactivate`)

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

### Single Export Per File (CLIENT CRITICAL)

**RULE**: Each `.ts` file exports ONE primary item.

| ❌ NEVER                                | ✅ ALWAYS                                  |
| --------------------------------------- | ------------------------------------------ |
| `export interface X` + `export class Y` | Separate: `x.model.ts` + `y.service.ts`    |
| `export enum E` + `export class S`      | Separate: `e.constant.ts` + `s.service.ts` |

**Exceptions** (approved patterns):

- `index.ts` barrel exports
- Type re-exports from generated code (`generated-open-api.model.ts`)
- Error class hierarchies (`app-error.model.ts`)
- Environment config interfaces (`environment.interface.ts`)
- Animation constants (`*.animations.ts`)
- Cohesive type sets (`table.model.ts`)
- Utility function collections (`*.utility.ts`)
- Test data builders with factories (`*.builder.ts`)
- Cohesive constant sets (`http.constants.ts`, `role.constants.ts`)
- All `testing/` folder files

**File Naming**: `{name}.model.ts` (interface/type), `{name}.constant.ts` (enum/const), `{name}.service.ts` (class)

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
| E2E           | `npm run test:e2e` (Playwright)    |
| Libraries     | xUnit, NSubstitute, Shouldly       |
| Forbidden     | Moq, FluentAssertions              |

### ⚠️ Work Completion Requirements (CRITICAL)

**ALL THREE** test suites must pass for work to be considered complete:

| Suite  | Command            | Location                   |
| ------ | ------------------ | -------------------------- |
| Server | `dotnet test`      | `SeventySix.Server/Tests/` |
| Client | `npm test`         | `SeventySix.Client/`       |
| E2E    | `npm run test:e2e` | `SeventySix.Client/e2e/`   |

**Never** mark work complete with failing tests in any suite.

---

## E2E Testing (Playwright)

### Structure

```
SeventySix.Client/e2e/
├── global-setup.ts              # Creates auth states
├── fixtures/
│   ├── index.ts                 # Barrel export - ALWAYS import from here
│   ├── auth.fixture.ts          # Role-based page fixtures
│   ├── page-helpers.fixture.ts  # Page Object Model fixtures
│   ├── pages/                   # Page Object classes
│   ├── selectors.constant.ts    # CSS selectors
│   ├── routes.constant.ts       # App routes
│   ├── page-text.constant.ts    # UI text
│   ├── timeouts.constant.ts     # Timeout values
│   └── test-users.constant.ts   # Test credentials
└── specs/
    ├── public/                  # No auth
    ├── authenticated/           # User role
    ├── admin/                   # Admin role
    └── developer/               # Developer role
```

### Import Rule (CRITICAL)

```typescript
// ✅ ALWAYS import from barrel
import { test, expect, ROUTES, PAGE_TEXT, SELECTORS } from "../../fixtures";

// ❌ NEVER import from individual files
import { test } from "../../fixtures/auth.fixture";
```

### Test Categories

| Category      | Auth State | Use Case                |
| ------------- | ---------- | ----------------------- |
| public        | None       | Login, register, public |
| authenticated | User       | General user features   |
| admin         | Admin      | Admin-only features     |
| developer     | Developer  | Developer tools         |

### Spec File Pattern

```typescript
test.describe("{{Feature}}",
    () =>
    {
        test.beforeEach(
            async ({ page }) =>
            {
                await page.goto(ROUTES.{{route}});
            });

        test("should {{behavior}} when {{condition}}",
            async ({ page }) =>
            {
                await expect(page.locator(SELECTORS.{{selector}}))
                    .toBeVisible();
            });
    });
```

### Page Helpers

Use injected page helpers instead of raw page:

```typescript
test("should submit form", async ({ authPage }) => {
	await authPage.login("user", "pass");
	await expect(authPage.snackbar).toBeVisible();
});
```

### Adding New Fixtures

When adding selectors, routes, or text:

1. Add to appropriate constant file in `fixtures/`
2. Export via `fixtures/index.ts` if new file
3. Use `data-testid` attributes for selector stability

---

## Constants & Type Safety (CRITICAL)

| Rule            | ❌ NEVER                            | ✅ ALWAYS                               |
| --------------- | ----------------------------------- | --------------------------------------- |
| Magic numbers   | `{ duration: 5000 }`                | `{ duration: SNACKBAR_DURATION.error }` |
| Magic strings   | `ReturnType<Service["methodName"]>` | `ReturnType<typeof service.methodName>` |
| C# constants    | `"Developer"` inline                | `RoleConstants.Developer` (PascalCase)  |
| TS constants    | `"DEVELOPER"` inline                | `ROLE_DEVELOPER` (SCREAMING_SNAKE)      |
| Repeated values | Same literal 2+ times               | Extract to constant                     |

### ReturnType Pattern (CRITICAL)

```typescript
// ❌ NEVER - String-based access, no compile-time safety
readonly userQuery: ReturnType<UserService["getUserById"]> =
    this.userService.getUserById(this.userId);

// ✅ ALWAYS - typeof provides compile-time type checking
readonly userQuery: ReturnType<typeof this.userService.getUserById> =
    this.userService.getUserById(this.userId);
```

**Why**: String-based property access (`Service["method"]`) bypasses TypeScript's type system. If method is renamed, no compile error occurs. Using `typeof` ensures refactoring safety.

### Duration/Timing Constants

```typescript
// ❌ NEVER - Magic numbers
snackBar.open(message, "Close", { duration: 5000 });

// ✅ ALWAYS - Named constants
snackBar.open(message, "Close", { duration: SNACKBAR_DURATION.error });
```

## Documentation

- Never create .md files unless asked
- **CRITICAL: XML and JSDoc documentation** - All public classes, methods, properties, and parameters must have XML documentation comments.
- **CRITICAL: XML and JSDoc documentation style** — All `<param>` and `<returns>` tags must be placed on their own lines, and the description text must be on the line between the opening and closing tags (example below). This is enforced as a critical docstyle rule for Raptor.

Example:

```xml
/// <param name="userId">
/// A unique identifier for the user.
/// </param>

/// <returns>
/// The user DTO when found; otherwise null.
/// </returns>
```
