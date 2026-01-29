# SeventySix Copilot Instructions

> **Context-specific rules** are in `.github/instructions/*.instructions.md` files.
> This file contains **critical global rules** that must ALWAYS be followed.

---

## ⚠️ CRITICAL RULES (NEVER VIOLATE)

### 1. IDE Warnings = MUST FIX (No Suppressions)

| ❌ NEVER                  | ✅ ALWAYS             |
| ------------------------- | --------------------- |
| `#pragma warning disable` | Fix the root cause    |
| `// @ts-ignore`           | Fix the type error    |
| `[SuppressMessage(...)]`  | Refactor to comply    |
| Ignoring yellow squiggles | Fix before committing |

**Exceptions**: EF Core Migrations, Generated OpenAPI clients

### 2. Variable Names = 3+ Characters, Descriptive

| ❌ NEVER              | ✅ ALWAYS                              |
| --------------------- | -------------------------------------- |
| `x => x.Id`           | `user => user.Id`                      |
| `for (int i = 0;...)` | `foreach` or `for (int index = 0;...)` |
| `.filter(s => ...)`   | `.filter(section => ...)`              |

**Exception**: Angular `(m) => m.Component`

### 3. Null Coercion = BANNED

| ❌ NEVER               | ✅ ALWAYS                       |
| ---------------------- | ------------------------------- |
| `!!value`              | `isPresent(value)`              |
| `value \|\| "default"` | `value ?? "default"`            |
| `if (!value)`          | `if (isNullOrUndefined(value))` |

```typescript
import { isNullOrUndefined, isPresent } from "@shared/utilities/null-check.utility";
```

**Exceptions**: Boolean comparisons (`isLoading || isError`), boolean negation (`!isLoading`), method results (`!items.includes(x)`)

### 4. Code Formatting

| Rule           | Pattern                            |
| -------------- | ---------------------------------- |
| 2+ params      | Each on new line                   |
| Assignment `=` | New line after `=`, value indented |
| Chains         | New line BEFORE `.`                |
| Binary ops     | `\|\|`, `??` on LEFT of new line   |

### 5. Tests MUST Pass

| Suite  | Command            |
| ------ | ------------------ |
| Server | `dotnet test`      |
| Client | `npm test`         |
| E2E    | `npm run test:e2e` |

> ⚠️ **CRITICAL**: Test failures MUST be fixed immediately when discovered, regardless of origin. Never skip or defer failing tests. If a test fails, fix it before proceeding—no exceptions.

---

## Architecture

### Server: `Shared ← Domains ← Api` (never reverse)

### Client: Domains import ONLY `@shared/*` + itself, NEVER another domain

---

## Quick Patterns

### C# (.NET 10+)

```csharp
string name = "";                    // Explicit types, never var
class UserService(IRepo repo);       // Primary constructors
int[] items = [1, 2, 3];             // Collection expressions
Task<User> GetUserAsync();           // Async suffix always
record UserDto(int Id);              // Positional records for DTOs
```

### Angular (20+)

```typescript
private readonly service = inject(UserService);  // inject() only
readonly name = input.required<string>();        // Signal inputs
readonly clicked = output<void>();               // Signal outputs
@if (condition) { } @for (item of items; track item.id) { }  // Control flow
```

---

## Documentation Style

### C# XML (tags on own lines)

```xml
/// <param name="userId">
/// The unique identifier for the user.
/// </param>
///
/// <returns>
/// The user DTO when found; otherwise null.
/// </returns>
```

### TypeScript JSDoc

```typescript
/**
 * @param {string} userId
 * The unique identifier.
 *
 * @returns {UserDto | null}
 * The user when found.
 */
```

---

## Constants (No Magic Values)

| ❌ NEVER             | ✅ ALWAYS                               |
| -------------------- | --------------------------------------- |
| `{ duration: 5000 }` | `{ duration: SNACKBAR_DURATION.error }` |
| `"Developer"` inline | `RoleConstants.Developer`               |
| Repeated literal 2x+ | Extract to constant                     |
