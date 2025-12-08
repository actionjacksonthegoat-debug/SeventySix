# SeventySix Copilot Instructions

## CRITICAL RULES - Always Apply

### Core Principles (SOLID, KISS, DRY, YAGNI)

-   **SRP**: Each class/component has one reason to change
-   **KISS**: Simple solutions over complex ones
-   **DRY**: No code duplication (Rule of Three)
-   **YAGNI**: Don't build what you don't need yet

### Code Formatting (CRITICAL - All .ts and .cs files)

-   **ALWAYS** put each parameter on new line when 2+ parameters
-   **ALWAYS** place binary operators (`+`, `||`, `&&`, `??`) on LEFT of new lines
-   **ALWAYS** new line AFTER every `=` sign with continuation indented
-   **ALWAYS** new line BEFORE every `.` delimiter in method chains
-   **NEVER** put `)` alone on its own line - keep with last parameter
-   **ALWAYS** use null-conditional (`?.`) over verbose null checks in C#

### C# (.NET 10+)

-   **NEVER** use `var` - always explicit types: `string name = "test";`
-   **ALWAYS** use primary constructors: `public class Service(IRepo repo)`
-   **ALWAYS** use collection expressions: `int[] nums = [1, 2, 3];`
-   **ALWAYS** suffix async methods with `Async` (including tests)
-   **NEVER** verbose null checks - use `return user?.ToDto();` not `if (user == null) { return null; } return user.ToDto();`
-   **ALWAYS** use records for DTOs (positional): `public record UserDto(int Id, string Name);`
-   **ALWAYS** use records for Settings (init props): `public record AuthSettings { public int Timeout { get; init; } = 60; }`
-   **ALWAYS** use Fluent API for EF Core, not attributes
-   **ALWAYS** use `AsNoTracking()` for read-only queries
-   **ALWAYS** suffix FK properties with `Id`: `UserId`, `RoleId`, `ParentId`
-   **ALWAYS** use string for audit fields (`CreatedBy`, `ModifiedBy`) - NOT FKs

### Angular (20+)

-   **Zoneless only** - never use Zone.js, NgZone, fakeAsync, tick
-   **ALWAYS** use `inject()` function, never constructor injection
-   **ALWAYS** use explicit types: `const name: string = "test";`
-   **ALWAYS** use OnPush change detection
-   **ALWAYS** use signals, `input()`, `output()`, `computed()`
-   **ALWAYS** use `@if`/`@for`/`@switch`, not `*ngIf`/`*ngFor`
-   **ALWAYS** use `host` object, not `@HostBinding`/`@HostListener`
-   **NEVER** use `ngClass`/`ngStyle` - use `[class.x]`/`[style.x]`
-   **ALWAYS** use `takeUntilDestroyed()` for subscription cleanup
-   **NEVER** call methods in templates - use `computed()` signals or pre-compute in data model
-   **NEVER** use `providedIn: 'root'` for feature services - use route `providers` array
-   **ALWAYS** scope feature services (UserService, LogRepository) to their feature routes
-   **Component naming**: `*Page` suffix ONLY when model with same name exists (e.g., `UserDetailPage`); otherwise use `*Component` (e.g., `RegisterEmailComponent`)

### SCSS/CSS Styling

-   **ALWAYS** use `rem` for sizing (spacing, font-size, width, height)
-   **NEVER** use `px` except: border width, border-radius, box-shadow, breakpoints
-   **ALWAYS** use SCSS variables from `_variables.scss`: `vars.$spacing-lg` not `1rem`
-   **ALWAYS** use semantic color vars: `var(--color-info)`, `var(--color-error)`
-   **NEVER** hardcode hex colors - use CSS custom properties
-   **ALWAYS** prefer mixins over repeated CSS (Rule of Three: extract after 3rd occurrence)
-   **ALWAYS** use existing mixins from `_mixins.scss` for common patterns (loading states, icon sizing, page headers)

### Testing

-   **NEVER** skip failing tests - fix immediately
-   **ALWAYS** follow **80/20 rule** - test critical paths only, no exhaustive edge case testing
-   **ALWAYS** use **TDD** for fixes - write failing test first, then implement
-   **Angular**: `npm test` (headless, no-watch) - NOT runTests tool
-   **.NET**: `dotnet test` or runTests tool - Docker Desktop required
-   **ALWAYS** use `provideZonelessChangeDetection()` in Angular tests
-   **ALWAYS** suffix async test methods with `Async`

### Logging

-   **NEVER** use `LogDebug`
-   **NEVER** use `LogInformation` - EXCEPT background job completion messages
-   **LogInformation** - ONLY for background job completion (operational visibility)
-   **LogWarning** - Recoverable issues, business rule violations
-   **LogError** - Unrecoverable failures, exceptions
-   **Silent is OK** - No logging needed for disabled services or normal skips

### Database Transactions

-   **NEVER** wrap single-write operations in transactions - adds overhead with no benefit
-   **ALWAYS** consolidate multiple `SaveChangesAsync` calls into single call when possible
-   **ONLY** use `TransactionManager` for read-then-write atomicity (e.g., check duplicate → create)
-   **REMEMBER**: EF Core's `SaveChangesAsync` is already transactional - all pending changes committed atomically

### Configuration

-   **NEVER** hardcode configurable values (URLs, intervals, limits)
-   **ALWAYS** use `environment.ts` (Angular) or `appsettings.json` (.NET)

### Documentation

-   **NEVER** create new .md files unless explicitly asked
-   **ALWAYS** use inline JSDoc/XML comments instead
-   Keep code self-documenting with clear names
-   Ensure code, properties, and classes are documented but not overly verbose

### Architecture (Target State)

-   **Server**: Bounded contexts (Identity, Logging, ApiTracking)
-   **Client**: `infrastructure/` (renamed from `core/`) + self-contained features
-   Separate DbContext per bounded context
-   No generic repository pattern
-   PostgreSQL only
-   Features are self-contained (models, repos, services inside feature)
-   **DTOs** = API contracts (request/response), **Entities** = DB-persisted models, **Models** = internal non-persisted types
-   **Settings** = Configuration binding classes (bound from `appsettings.json`)
-   **Feature services scoped to routes** - NOT `providedIn: 'root'` (memory management, bounded context isolation)
-   Path aliases: `@infrastructure/*`, `@shared/*`, `@admin/*`, `@game/*`
-   Server-Client alignment: Identity → `@admin/users/`, Logging → `@admin/logs/`

### Type Organization (YAGNI)

-   **Feature types stay in feature** → Never move to `@infrastructure/` or `@shared/` unless cross-context
-   **Cross-context types** → `@shared/models/` (TS) or `Shared/Models/` (C#)
-   **Private types** → Inline in service/component is acceptable
-   **Same-folder imports** → Types can stay in service if only used within same folder
-   **Test-only types** → Keep in test file
-   **Extract only when**: Type is imported by a DIFFERENT module/folder

### Constants Organization (DRY)

-   **Feature constants** → `feature/constants/` folder (e.g., `Identity/Constants/RoleConstants.cs`)
-   **Cross-feature constants** → `Shared/Constants/` (C#) or `@shared/constants/` (TS)
-   **Test constants** → `TestUtilities/Constants/` (C#) or `src/app/testing/constants/` (TS)
-   **NEVER** hardcode strings like `"Developer"`, `"Admin"`, `"User"` - use constants
-   **NEVER** hardcode API endpoints in tests - use `ApiEndpoints` constants class
-   **ALWAYS** use `static class` with `const` fields for C# constants
-   **ALWAYS** use `export const` with SCREAMING_SNAKE_CASE for TS constants
-   **ALWAYS** group constants by domain: `RoleConstants`, `ClaimConstants`, `ApiEndpoints`
-   **C# naming**: PascalCase values, `*Constants` suffix → `RoleConstants.Developer`
-   **TS naming**: SCREAMING_SNAKE_CASE → `ROLE_DEVELOPER`, file suffix `.constants.ts`
-   **TS test constants**: SCREAMING_SNAKE_CASE → `TEST_ADMIN_USER`, file suffix `.constants.ts`

## References (Use #file: when needed)

-   **Full C# rules**: `.github/instructions/csharp.md`
-   **Full Angular rules**: `.github/instructions/angular.md`
-   **Testing details**: `.github/instructions/testing.md`
-   **Architecture**: `.github/instructions/architecture.md`
-   **Quick reference**: `.github/instructions/quick-reference.md`
-   **Detailed standards**: `.claude/CLAUDE.md`
