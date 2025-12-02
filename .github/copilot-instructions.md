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
-   **ALWAYS** use records for DTOs: `public record UserDto(int Id, string Name);`
-   **ALWAYS** use Fluent API for EF Core, not attributes
-   **ALWAYS** use `AsNoTracking()` for read-only queries

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
-   **Angular**: `npm test` (headless, no-watch) - NOT runTests tool
-   **.NET**: `dotnet test` or runTests tool - Docker Desktop required
-   **ALWAYS** use `provideZonelessChangeDetection()` in Angular tests

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

## References (Use #file: when needed)

-   **Full C# rules**: `.github/instructions/csharp.md`
-   **Full Angular rules**: `.github/instructions/angular.md`
-   **Testing details**: `.github/instructions/testing.md`
-   **Architecture**: `.github/instructions/architecture.md`
-   **Quick reference**: `.github/instructions/quick-reference.md`
-   **Detailed standards**: `.claude/CLAUDE.md`
