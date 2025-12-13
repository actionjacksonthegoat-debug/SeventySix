# SeventySix Copilot Instructions

## Code Formatting (CRITICAL - .ts and .cs)

| Rule | Do | Don't |
|------|-----|-------|
| 2+ params | Each on new line, indented | Same line |
| Lambda params | Lambda on new line after `(` | Lambda inline with `(` |
| Binary ops | `\|\|` on LEFT of new line | End of line |
| Assignment `=` | ALWAYS new line after `=`, value indented | Value on same line |
| Chains | New line BEFORE `.`, indented | One line |
| Closing `)` | With last param | Alone on line |
| Nulls (C#) | `x?.ToDto()` | `if (x == null)` |

### Formatting Examples

**Assignment:**
```csharp
// ✅ CORRECT
User? user =
    await repo.GetByIdAsync(id);

// ❌ WRONG
User? user = await repo.GetByIdAsync(id);
```

**Method chains:**
```csharp
// ✅ CORRECT - lambda param on new line
builder
    .Property(
        user => user.Username)
    .HasMaxLength(100)
    .IsRequired();

// ❌ WRONG
builder.Property(user => user.Username).HasMaxLength(100);
```

**Multi-params:**
```csharp
// ✅ CORRECT
await bus.InvokeAsync<UserDto?>(
    new GetUserByIdQuery(id),
    cancellationToken);

// ❌ WRONG
await bus.InvokeAsync<UserDto?>(new GetUserByIdQuery(id), cancellationToken);
```

## C# (.NET 10+)

| Rule | Pattern |
|------|---------|
| Types | `string x = ""` never `var` |
| Constructors | `class Svc(IRepo r)` primary only |
| Collections | `[1, 2, 3]` not `new List` |
| Async | Suffix `*Async` always |
| DTOs | `record UserDto(int Id)` positional |
| Settings | `record X { prop { get; init; } = default; }` |
| EF Config | Fluent API, never attributes |
| Queries | `AsNoTracking()` for reads |
| FK naming | Suffix `*Id`: `UserId`, `RoleId` |
| Audit fields | String `CreatedBy`, not FK |

### Logging

| Level | Usage |
|-------|-------|
| Debug | NEVER |
| Information | Background job completion ONLY |
| Warning | Recoverable issues |
| Error | Unrecoverable failures |

### Transactions

- Single write: Direct `SaveChangesAsync`
- Multiple entities: Consolidated `SaveChangesAsync`
- Read-then-write: `TransactionManager`

## Angular (20+)

| Rule | Pattern |
|------|---------|
| Zone | Zoneless only, never Zone.js |
| DI | `inject(Service)` not constructor |
| Types | `const x: string = ""` explicit |
| Detection | `OnPush` always |
| Inputs | `input.required<T>()` |
| Outputs | `output<T>()` |
| Control flow | `@if`, `@for`, `@switch` |
| Host | `host: {}` not `@HostBinding` |
| Classes | `[class.x]` not `ngClass` |
| Styles | `[style.x]` not `ngStyle` |
| Templates | `computed()` not method calls |
| Cleanup | `takeUntilDestroyed()` |
| Feature services | Route `providers` not `providedIn: 'root'` |
| Component naming | `*Page` only if model conflict |

## SCSS

| Rule | Pattern |
|------|---------|
| Sizing | `rem` via `vars.$spacing-*` |
| px OK | border, radius, shadow, breakpoints |
| Colors | `var(--color-info)` semantic |
| Variables | `vars.$spacing-lg` not `1rem` |
| Patterns | Mixin after 3x repetition |

## Testing

| Rule | Pattern |
|------|---------|
| Approach | 80/20 - critical paths only |
| TDD | Failing test first |
| Failing tests | Fix immediately, never skip |
| Async suffix | `*Async` on all async tests |
| Angular | `npm test` (headless) |
| Angular setup | `provideZonelessChangeDetection()` |
| .NET | `dotnet test` |
| Libraries | xUnit, NSubstitute, Shouldly |
| Forbidden | Moq, FluentAssertions |

## Architecture

| Concept | Pattern |
|---------|---------|
| Contexts | Identity, Logging, ApiTracking, ElectronicNotifications |
| DbContext | Separate per context |
| Repository | Domain-specific, no generic |
| CQRS | Wolverine handlers |
| Validators | Colocate with handlers |
| Path aliases | `@infrastructure`, `@shared`, `@admin`, `@game` |
| Feature imports | From `@infrastructure` and `@shared` only |

### Type Organization

| Type | Location | Record Pattern |
|------|----------|----------------|
| DTOs | `Context/DTOs/` | Positional params |
| Entities | `Context/Entities/` | Class |
| Models | `Context/Models/` | Varies |
| Settings | `Context/Settings/` | Init props with defaults |
| Constants | `Context/Constants/` | Static class |

### Constants

- C#: `RoleConstants.Developer` (PascalCase)
- TS: `ROLE_DEVELOPER` (SCREAMING_SNAKE)
- Never hardcode repeated strings

## Documentation

- Inline JSDoc/XML comments only
- Never create .md files unless asked
- Self-documenting code preferred
