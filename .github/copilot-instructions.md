# SeventySix Copilot Instructions

## CRITICAL RULES - Always Apply

### Core Principles (SOLID, KISS, DRY, YAGNI)

-   **SRP**: Each class/component has one reason to change
-   **KISS**: Simple solutions over complex ones
-   **DRY**: No code duplication (Rule of Three)
-   **YAGNI**: Don't build what you don't need yet

### C# (.NET 10+)

-   **NEVER** use `var` - always explicit types: `string name = "test";`
-   **ALWAYS** use primary constructors: `public class Service(IRepo repo)`
-   **ALWAYS** use collection expressions: `int[] nums = [1, 2, 3];`
-   **ALWAYS** suffix async methods with `Async` (including tests)
-   **NEVER** excessive null checks - no `?? throw new ArgumentNullException`
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

### Architecture (Target State)

-   **Server**: Bounded contexts (Identity, Logging, ApiTracking)
-   **Client**: `infrastructure/` (renamed from `core/`) + self-contained features
-   Separate DbContext per bounded context
-   No generic repository pattern
-   PostgreSQL only
-   Features are self-contained (models, repos, services inside feature)
-   Path aliases: `@infrastructure/*`, `@shared/*`, `@admin/*`, `@game/*`
-   Server-Client alignment: Identity → `@admin/users/`, Logging → `@admin/logs/`

## References (Use #file: when needed)

-   **Full C# rules**: `.github/instructions/csharp.md`
-   **Full Angular rules**: `.github/instructions/angular.md`
-   **Testing details**: `.github/instructions/testing.md`
-   **Server architecture**: `.github/instructions/architecture-server.md`
-   **Client architecture**: `.github/instructions/architecture-client.md`
-   **Overall architecture**: `.github/instructions/architecture-overall.md`
-   **Quick reference**: `.github/instructions/quick-reference.md`
-   **Detailed standards**: `.claude/CLAUDE.md`
