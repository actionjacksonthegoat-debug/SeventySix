# SeventySix Copilot Instructions

> **Context-specific rules** are in `.github/instructions/*.instructions.md` files.
> This file contains **critical global rules** that must ALWAYS be followed.

---

## 🚨 FORBIDDEN COMMANDS (NEVER EXECUTE)

> **ABSOLUTE PROHIBITION**: The following commands are **USER-ONLY** and must **NEVER** be executed by Copilot under any circumstances.

| Command                                 | Reason                                 |
| --------------------------------------- | -------------------------------------- |
| `npm run db:reset`                      | Destroys all database data - USER ONLY |
| `db:reset`                              | Alias - same prohibition               |
| Any command containing `reset-database` | PowerShell script - USER ONLY          |

**NO EXCEPTIONS. NO WORKAROUNDS. If a task requires database reset, STOP and ask the user to run it manually.**

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

> **ESLint** is the enforced lint gate for CI and completion status. **dprint** is a local formatting tool only — not enforced in CI or GitHub Actions.

| Rule           | Pattern                            |
| -------------- | ---------------------------------- |
| 2+ params      | Each on new line                   |
| Assignment `=` | New line after `=`, value indented |
| Chains         | New line BEFORE `.`                |
| Binary ops     | `\|\|`, `??` on LEFT of new line   |

### 5. Tests MUST Pass (GATE CONDITION)

| Suite  | Command            |
| ------ | ------------------ |
| Server | `dotnet test`      |
| Client | `npm test`         |
| E2E    | `npm run test:e2e` |

> ⚠️ **CRITICAL**: ALL three test suites MUST pass before ANY implementation plan is considered complete.
> Test failures MUST be fixed immediately when discovered, regardless of origin.
> Never skip or defer failing tests—fix before proceeding.

> 🚫 **NEVER** claim "done" or "complete" without actually running ALL test suites.
> Saying "tests will pass when infrastructure is running" is NOT acceptable.
> You MUST execute `npm run test:e2e` and see `[PASS] All E2E tests passed!` before marking complete.

### 6. Accessibility = WCAG AA Compliance (Client)

| ❌ NEVER                          | ✅ ALWAYS                                      |
| --------------------------------- | ---------------------------------------------- |
| `<mat-icon>save</mat-icon>` alone | `<mat-icon aria-hidden="true">save</mat-icon>` |
| Icon button without label         | `aria-label="Save"` on button                  |
| `matTooltip` as only label        | `aria-label` + optional `matTooltip`           |
| Toggle without state              | `[attr.aria-expanded]="isOpen()"`              |
| Spinner without label             | `aria-label="Loading"`                         |

**Rule**: All decorative icons MUST have `aria-hidden="true"`. Icon-only buttons MUST have `aria-label`.

See `.github/instructions/accessibility.instructions.md` for full patterns.

### 7. TypeScript Methods = Explicit Return Types (REQUIRED)

| ❌ NEVER             | ✅ ALWAYS                            |
| -------------------- | ------------------------------------ |
| `ngOnInit() {`       | `ngOnInit(): void {`                 |
| `getUser() {`        | `getUser(): Observable<UserDto> {`   |
| `isValid() {`        | `isValid(): boolean {`               |
| `async loadData() {` | `async loadData(): Promise<void> {`  |
| `transform(value) {` | `transform(value: string): string {` |

**Exception**: Inline arrow callbacks where the return type is inferred from a typed context
(e.g., `.subscribe(() => { ... })`, `.pipe(map(item => item.name))`)

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
ngOnInit(): void { }                        // Lifecycle hooks MUST have : void
getData(): Observable<UserDto[]> { }        // Service methods MUST have return type
isActive(): boolean { }                     // Computed methods MUST have return type
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

### 8. Exception Handling = Secure ProblemDetails (CRITICAL)

> **RULE**: API responses MUST NEVER expose raw `exception.Message` in `ProblemDetails.Detail`.
> Raw exception text (parameter names, stack traces, SQL, connection strings) is **Internal Only** — logged server-side, never returned to clients.

| ❌ NEVER (in ProblemDetails.Detail)     | ✅ ALWAYS                                                 |
| --------------------------------------- | --------------------------------------------------------- |
| `Detail = exception.Message`            | `Detail = ProblemDetailConstants.Details.BadRequest`      |
| `Detail = argumentException.Message`    | `Detail = ProblemDetailConstants.Details.*` constant      |
| `Detail = keyNotFoundException.Message` | Log raw message via `ILogger`, return safe constant       |
| Raw .NET runtime text in API response   | Curated human-readable text from `ProblemDetailConstants` |

**Message Classification:**

| Classification        | Rule                                                                  | Example                                        |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| **Public Safe**       | Display directly; hardcoded or constant-sourced                       | `"User already has this role."`                |
| **Public Actionable** | Display directly; curated `AuthResult.Error` + `errorCode`            | `"Invalid or expired token"` + `INVALID_TOKEN` |
| **Internal Only**     | NEVER display; replace with `ProblemDetailConstants`; log server-side | `exception.Message`, stack traces, SQL errors  |

**Server Pattern:**

```csharp
// Log the raw details for diagnostics
logger.LogWarning(exception, "Operation failed: {Error}", exception.Message);
// Return safe constant to client
return BadRequest(new ProblemDetails
{
    Detail = ProblemDetailConstants.Details.BadRequest,
});
```

**Client Pattern:**

- Display `detail` from 4xx responses (curated after server hardening)
- NEVER display `detail` from 5xx responses
- URL and HTTP status line go to `diagnosticDetails` (copy-only), never shown in toast
- Auth errors use `mapAuthError()` with explicit switch cases — default returns generic message, never passes through `error.error?.detail`

---

## Cross-Platform Compatibility (CRITICAL)

> All code MUST work on both **Windows** and **Linux** (CI runs on `ubuntu-latest`).

| Area             | ❌ NEVER                                    | ✅ ALWAYS                                                              |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| File paths (C#)  | `"folder\\file.txt"`, string concatenation  | `Path.Combine("folder", "file.txt")`                                   |
| File paths (TS)  | `"folder\\file.ts"`, hardcoded `\\`         | `path.join("folder", "file.ts")` or `/` separator                      |
| Line endings     | Assume `\r\n`                               | Use `.gitattributes`, `.editorconfig` for normalization                |
| Shell scripts    | PowerShell-only (`.ps1`) for CI/automation  | Dual support: `.ps1` + shell fallback, or cross-platform JS            |
| Case sensitivity | `"MyFile.ts"` vs `"myfile.ts"` interchanged | Consistent casing everywhere (Linux is case-sensitive)                 |
| Temp paths       | `C:\Temp\...`                               | `Path.GetTempPath()` (C#), `os.tmpdir()` (Node.js)                     |
| Path separators  | `Path.DirectorySeparatorChar` assumptions   | `Path.Combine` (C#), `path.join` (Node.js)                             |
| Environment vars | `%VAR%` (CMD-only)                          | `process.env.VAR` (Node.js), `Environment.GetEnvironmentVariable` (C#) |

**Rule**: Before merging, verify the code would work on Linux—CI will catch failures.

---

## E2E Testing (Quick Reference)

| Rule       | Pattern                                              |
| ---------- | ---------------------------------------------------- |
| Imports    | Always from `../../fixtures` barrel                  |
| Selectors  | Use `data-testid` attributes, add to `SELECTORS`     |
| Waits      | `waitForLoadState("load")`, never `waitForTimeout()` |
| Assertions | Assert final state, not transitions                  |
| Test Data  | Use unique prefixes (`e2e_`, `Date.now()`)           |

See `.github/instructions/e2e.instructions.md` for full patterns.
