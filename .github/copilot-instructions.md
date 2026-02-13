# SeventySix Copilot Instructions

> **Context-specific rules** are in `.github/instructions/*.instructions.md` files (auto-applied by `applyTo` globs).
> This file contains **global rules only**. Each concept lives in exactly ONE file — never duplicated.

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

## Core Principles

- **KISS, DRY, YAGNI** — simplest solution, no duplication, no speculative features
- **TDD 80/20** — focus tests on the 20% of code carrying 80% of risk
- **IDE Warnings = MUST FIX** — never suppress with `#pragma warning disable`, `// @ts-ignore`, `[SuppressMessage]`
    - **Exceptions**: EF Core Migrations, Generated OpenAPI clients
- **All 3 test suites MUST pass** before claiming completion (see below)

## Tests MUST Pass (GATE CONDITION)

| Suite  | Command            | Must See                            |
| ------ | ------------------ | ----------------------------------- |
| Server | `dotnet test`      | `Test summary: total: X, failed: 0` |
| Client | `npm test`         | `X passed (X)`                      |
| E2E    | `npm run test:e2e` | `[PASS] All E2E tests passed!`      |

> 🚫 **NEVER** claim "done" or "complete" without actually running ALL test suites.
> Saying "tests will pass when infrastructure is running" is **NOT acceptable**.

---

## Architecture (Quick Reference)

- **Server**: `Shared ← Domains ← Api` (never reverse)
- **Client**: Domains import ONLY `@shared/*` + itself, NEVER another domain

## Technology Stack

| Layer  | Technology                                                                      |
| ------ | ------------------------------------------------------------------------------- |
| Server | .NET 10 LTS, Wolverine CQRS, EF Core, PostgreSQL, FusionCache, FluentValidation |
| Client | Angular 21 LTS, Zoneless, Signals, TanStack Query, Material Design 3            |
| IDE    | VS Code 1.100+                                                                  |

## Domains

| Server                    | Client      |
| ------------------------- | ----------- |
| `Identity`                | `admin`     |
| `Logging`                 | `auth`      |
| `ApiTracking`             | `account`   |
| `ElectronicNotifications` | `developer` |
|                           | `sandbox`   |
|                           | `home`      |

---

## `#githubRepo` Hints

Use `#githubRepo` with these repos when searching for framework-specific patterns:

- `JasperFx/wolverine` — Wolverine CQRS handler patterns
- `angular/angular` — Angular 21 patterns
- `TanStack/query` — TanStack Query patterns

## MCP Servers (Available in Agent Mode)

| Server            | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `github`          | Issues, PRs, repo operations                           |
| `playwright`      | Browser automation for E2E debugging                   |
| `postgresql`      | Read-only DB queries for debugging/exploration         |
| `chrome-devtools` | Live browser inspection, console, network, screenshots |
| `context7`        | Up-to-date library documentation (use context7)        |
| `figma`           | Design-to-code from Figma files                        |

**Always use context7** when generating code that references Angular, .NET, Wolverine, TanStack Query, Playwright, or any other library — to ensure up-to-date API usage and avoid hallucinated APIs.

---

## File Index (Auto-Applied via `applyTo` Globs)

| File                             | Scope                                          |
| -------------------------------- | ---------------------------------------------- |
| `formatting.instructions.md`     | `**/*.{ts,cs}` — naming, structure, operators  |
| `angular.instructions.md`        | `**/SeventySix.Client/src/**/*.ts`             |
| `csharp.instructions.md`         | `**/SeventySix.Server/**/*.cs`                 |
| `security.instructions.md`       | `**/*.{ts,cs}` — ProblemDetails, auth errors   |
| `accessibility.instructions.md`  | `**/SeventySix.Client/src/**/*.{ts,html,scss}` |
| `testing-server.instructions.md` | `**/SeventySix.Server/Tests/**/*.cs`           |
| `testing-client.instructions.md` | `**/SeventySix.Client/src/**/*.spec.ts`        |
| `e2e.instructions.md`            | `**/SeventySix.Client/e2e/**/*.ts`             |
| `cross-platform.instructions.md` | `**/*.{ts,cs,ps1,sh,mjs}`                      |
| `new-domain.instructions.md`     | Manual reference — domain blueprints           |
