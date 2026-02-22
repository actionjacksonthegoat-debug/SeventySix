---
description: Code formatting rules for all TypeScript and C# files
applyTo: "**/SeventySix.Client/src/**/*.{ts,cs},**/SeventySix.Server/**/*.{ts,cs}"
---

# Formatting Instructions

> **ESLint** is the enforced lint gate for CI and completion status. **dprint** is a local-only formatting tool — not enforced in CI or GitHub Actions.

## Format Command (CRITICAL — NEVER Run dprint Directly)

> **`npm run format` is the ONLY command for formatting files. `dprint` must NEVER be run standalone.**

| [NEVER] | [ALWAYS] |
| ------- | -------- |
| Run `dprint` standalone | `npm run format` (full pipeline) |
| Run `npx dprint fmt` | `npm run format:client` (ESLint → dprint → ESLint) |
| Run `dprint` as a pre-step | Manually fix formatting during development |

**Why**: `npm run format:client` runs ESLint → dprint → ESLint in that exact order. Running `dprint` directly bypasses the ESLint pre/post passes and leaves lint violations unfixed.

**When to run format**: Only at the end of implementation phases, right before running the test gate. During active development, manually correct formatting in source files rather than running the format command mid-phase.

## End-of-File Newlines (CRITICAL — NO TRAILING NEWLINE)

> **Policy**: Files MUST NOT end with a newline character.

| Layer | Enforcement | Rule |
| ----- | ----------- | ---- |
| TypeScript/JS/SCSS | ESLint `@stylistic/eol-last: ["error", "never"]` | Second ESLint pass in `npm run format:client` removes any final newline dprint adds |
| C# | `.editorconfig` `insert_final_newline = false` | `dotnet format whitespace` strips final newlines |
| All files | `.editorconfig` `insert_final_newline = false` | VS Code respects this for manual edits |

**Why dprint doesn't conflict**: dprint unconditionally adds a trailing newline, but it runs
BETWEEN the two ESLint passes. The second `eslint --fix` pass removes it. **Never add
`insert_final_newline` back to `.editorconfig`.** Never add `finalNewline` to `dprint.json`.

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

## SCSS Color Patterns (CRITICAL — MD3)

> **Rule**: Angular Material 3 does NOT emit RGB-split custom properties. The `rgba(var(--mat-*-rgb), N)` pattern produces **invisible** colors and must NEVER be used.

| [NEVER] | [ALWAYS] |
| ------- | -------- |
| `rgba(var(--mat-sys-primary-rgb), 0.12)` | `color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)` |
| `rgba(var(--mat-outline-rgb), 0.6)` | `color-mix(in srgb, var(--mat-sys-outline) 60%, transparent)` |
| `rgb(var(--mat-sys-primary-rgb))` | `var(--mat-sys-primary)` |
| `var(--mat-primary-default)` | `var(--mat-sys-primary)` — use stable MD3 token |

`color-mix()` is already used throughout `_base.scss` and is fully supported in all modern browsers.

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
