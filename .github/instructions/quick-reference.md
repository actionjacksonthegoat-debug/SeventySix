# Quick Reference Card

> Ultra-compact rules. No code examples. See domain files for details.

## Code Formatting (CRITICAL - .ts and .cs)

| Rule             | Do                                | Don't                             |
| ---------------- | --------------------------------- | --------------------------------- |
| 2+ Parameters    | Each on new line                  | Multiple on same line             |
| Binary Operators | `\|\|`, `&&`, `+` on LEFT of line | Operators on right of line        |
| Assignment       | New line AFTER `=`                | Value on same line as `=`         |
| Method Chains    | New line BEFORE each `.`          | All on one line                   |
| Closing Paren    | `)` with last param               | `)` alone on line                 |
| Null Checks (C#) | `return x?.ToDto();`              | `if (x == null) { return null; }` |

## C# Rules

| Rule         | Do                            | Don't                |
| ------------ | ----------------------------- | -------------------- |
| Variables    | `string name = "x";`          | `var name = "x";`    |
| Constructors | Primary: `class Svc(IRepo r)` | Traditional ctors    |
| Collections  | `[1, 2, 3]`                   | `new List<int>{...}` |
| Async        | `GetUserAsync`                | `GetUser` for async  |
| DTOs         | `record UserDto(...)`         | class with props     |
| Queries      | `AsNoTracking()` for reads    | Track read-only data |
| Config       | Fluent API                    | Data annotations     |

## Angular Rules

| Rule      | Do                                  | Don't                 |
| --------- | ----------------------------------- | --------------------- |
| DI        | `inject(Service)`                   | Constructor injection |
| Signals   | `input()`, `output()`, `computed()` | `@Input`, `@Output`   |
| Templates | `@if`, `@for`, `@switch`            | `*ngIf`, `*ngFor`     |
| Host      | `host: { ... }`                     | `@HostBinding`        |
| Classes   | `[class.active]="x"`                | `ngClass`             |
| Styles    | `[style.width]="x"`                 | `ngStyle`             |
| Cleanup   | `takeUntilDestroyed()`              | Manual unsubscribe    |
| Templates | `computed()` signals                | Method calls          |
| Zone      | Zoneless only                       | Zone.js, NgZone       |

## SCSS Rules

| Rule     | Do                                   | Don't          |
| -------- | ------------------------------------ | -------------- |
| Sizing   | `rem`                                | `px`           |
| px OK    | borders, shadows, radii, breakpoints | spacing, fonts |
| Colors   | `var(--color-info)`                  | `#hex`         |
| Spacing  | `vars.$spacing-lg`                   | `1rem`         |
| Patterns | Mixins after 3x                      | Repeat CSS     |

## Testing Rules

| Context       | Command                            |
| ------------- | ---------------------------------- |
| Angular       | `npm test` (headless, no-watch)    |
| .NET          | `dotnet test` or runTests          |
| Angular setup | `provideZonelessChangeDetection()` |

## Architecture Rules

| Rule          | Pattern                                         |
| ------------- | ----------------------------------------------- |
| Boundaries    | Features self-contained                         |
| Cross-feature | Via @shared only                                |
| Path aliases  | `@infrastructure`, `@shared`, `@admin`, `@game` |
| Contexts      | Identity, Logging, ApiTracking                  |
| DB            | Separate DbContext per context                  |
| Generic repos | Never                                           |

## File References

| Topic           | File              |
| --------------- | ----------------- |
| C# details      | `csharp.md`       |
| Angular details | `angular.md`      |
| Testing details | `testing.md`      |
| Architecture    | `architecture.md` |
| Full guide      | `CLAUDE.md`       |
