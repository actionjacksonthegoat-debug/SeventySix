---
description: Code formatting rules for all TypeScript and C# files
applyTo: "**/SeventySix.Client/src/**/*.{ts,cs},**/SeventySix.Server/**/*.{ts,cs}"
---

# Formatting Instructions

> **ESLint** is the enforced lint gate for CI and completion status. **dprint** is a local-only formatting tool — not enforced in CI or GitHub Actions.

## Variable Naming (CRITICAL - 3+ Characters)

| Context        | [NEVER]                 | [ALWAYS]                               |
| -------------- | ----------------------- | -------------------------------------- |
| Lambdas        | `x => x.Id`             | `user => user.Id`                      |
| Array methods  | `.filter(s => s.title)` | `.filter(section => section.title)`    |
| Loop variables | `for (int i = 0; ...)`  | `foreach` or `for (int index = 0;...)` |
| Destructuring  | `const { n, c } = obj`  | `const { name, config } = obj`         |

**Only Exception**: Angular dynamic imports `(m) => m.Component`

## Code Structure

| Rule           | Do                                 | Don't                  |
| -------------- | ---------------------------------- | ---------------------- |
| 2+ params      | Each on new line, indented         | Same line              |
| Lambda params  | Lambda on new line after `(`       | Lambda inline with `(` |
| Binary ops     | `\|\|`, `??` on LEFT of new line   | End of line            |
| Assignment `=` | New line after `=`, value indented | Value on same line     |
| Chains         | New line BEFORE `.`, indented      | One line               |
| Closing `)`    | On same line as last param/arg     | Alone on its own line  |

## Examples

```csharp
// [CORRECT] C#
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

```typescript
// [CORRECT] TypeScript
const userData: UserDto = await this.userService.getById(userId);

this.users.filter((user) => user.isActive).map((user) => user.name);

const isValid: boolean = isPresent(value) && value.length > 0;
```

## Null Coercion (BANNED)

| [NEVER]                | [ALWAYS]                        |
| ---------------------- | ------------------------------- |
| `!!value`              | `isPresent(value)`              |
| `if (!value)`          | `if (isNullOrUndefined(value))` |
| `value \|\| "default"` | `value ?? "default"`            |
| `items?.length \|\| 0` | `items?.length ?? 0`            |

**Import**: `import { isNullOrUndefined, isPresent } from "@shared/utilities/null-check.utility";`

**Exceptions** (allowed `||` and `!`):

- Boolean comparisons: `isLoading || isError`
- Value comparisons: `if (a === "x" || b === "y")`
- Boolean negation: `!isLoading`
- Method results: `!items.includes(x)`

## Constants (No Magic Values)

| [NEVER]              | [ALWAYS]                                |
| -------------------- | --------------------------------------- |
| `{ duration: 5000 }` | `{ duration: SNACKBAR_DURATION.error }` |
| `"Developer"` inline | `RoleConstants.Developer`               |
| Repeated literal 2x+ | Extract to constant                     |

## Method Return Types (REQUIRED)

All TypeScript method and function declarations MUST have explicit return types.

| Context           | [NEVER]          | [ALWAYS]                              |
| ----------------- | ---------------- | ------------------------------------- |
| Lifecycle hooks   | `ngOnInit() {`   | `ngOnInit(): void {`                  |
| Service methods   | `getUsers() {`   | `getUsers(): Observable<UserDto[]> {` |
| Boolean accessors | `canSubmit() {`  | `canSubmit(): boolean {`              |
| Async methods     | `async save() {` | `async save(): Promise<void> {`       |
| Void handlers     | `onClick() {`    | `onClick(): void {`                   |

**Exception**: Inline arrow callbacks where return type is inferred from typed context.

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

> **Reminder**: Do NOT create documentation files in `/docs/`. Update existing READMEs and instruction files instead. See `copilot-instructions.md` for the full documentation rules.
