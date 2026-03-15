# SeventySix Copilot Instructions

> **Context-specific rules** are in `.github/instructions/*.instructions.md` files (auto-applied by `applyTo` globs).
> This file contains **global rules only**. Each concept lives in exactly ONE file — never duplicated.

---

## [CRITICAL] FORBIDDEN COMMANDS (NEVER EXECUTE)

> **ABSOLUTE PROHIBITION**: The following commands are **USER-ONLY** and must **NEVER** be executed by Copilot under any circumstances.

| Command                                 | Reason                                 |
| --------------------------------------- | -------------------------------------- |
| `npm run db:reset`                      | Destroys all database data - USER ONLY |
| `db:reset`                              | Alias - same prohibition               |
| Any command containing `reset-database` | PowerShell script - USER ONLY          |
| `git commit` / `git push`               | All commits are USER-GATED — NEVER commit or push on behalf of the user |
| `git push --force` / `git push -f`      | Destructive — absolutely forbidden     |
| `git add` / `git stage`                 | Staging is USER-ONLY — NEVER stage files on behalf of the user |
| `git add -A` / `git add .`              | Same prohibition — staging any files is forbidden |

**NO EXCEPTIONS. NO WORKAROUNDS. If a task requires a database reset or a commit/push/stage, STOP and ask the user to run it manually.**

> **STAGE/COMMIT/PUSH PROHIBITION (CRITICAL)**: Copilot must **NEVER** run `git add`, `git stage`, `git commit`, or `git push` under any circumstances. The user owns the **entire** Git workflow — staging, committing, and pushing. When file changes are complete, instruct the user to review the diff and stage/commit manually.

---

## [CRITICAL] DOCUMENTATION RULES

> **DO NOT** create files in the `/docs/` folder. Plans are written to `Implementation.md` (orchestrator) and `implementation-N.md` (individual plan files) at the repo root, and ONLY when the `/create-plan` prompt is invoked.

- **`Implementation.md`** is the **orchestrator** — it tracks all `implementation-N.md` files and runs final validation after all complete
- **`implementation-1.md`, `implementation-2.md`, etc.** are focused, completable plan files — each covers one logical unit of work
- Writing throwaway docs is expensive — avoid unless `/create-plan` is explicitly run
- If a change is complex enough to need user-facing documentation, **ASK the user first** before writing it
- `.github/instructions/*.instructions.md` files are the authoritative reference — keep them current, don't duplicate into `/docs/`
- **During `/execute-plan`**: Do NOT modify READMEs or `docs/*.md` unless the active `implementation-N.md` contains an explicit documentation phase. The orchestrator's final documentation gate verifies currency — incidental doc edits during code phases cause merge noise and scope creep.

---

## Core Principles

- **KISS, DRY, YAGNI** — simplest solution, no duplication, no speculative features
- **TDD-First 80/20** — write tests first for the 20% of code carrying 80% of risk (Red → Green → Refactor)
- **IDE Warnings = MUST FIX** — never suppress with `#pragma warning disable`, `// @ts-ignore`, `[SuppressMessage]`, or `.editorconfig` severity overrides
    - **Exceptions**: Generated OpenAPI clients
    - **Format Violations**: NEVER add `.editorconfig` rules to suppress format violations (IDE1006, etc.). Always fix violations manually. If `dotnet format` reports "Unable to fix [RULE]", manually correct all instances.
- **`npm run format` is the ONLY format command** — `dprint` must NEVER be run standalone. `npm run format:client` runs: ESLint → dprint → ESLint. Run format at the end of implementation phases, right before the test gate.
- **All required test suites MUST pass** in the final validation phase before claiming completion (see below)

## [CRITICAL] Key Formatting Rules (ALWAYS FOLLOW)

> Full examples in `formatting.instructions.md`, `csharp.instructions.md`, and `testing-server.instructions.md`. **NEVER skip — violation = blocker.**

| Rule | [NEVER] | [ALWAYS] |
| ---- | ------- | -------- |
| Code documentation | No docs on new class/method/property/constant | XML doc (C#), JSDoc (TS/JS/MJS), comment-based help (PS) — tests exempt |
| C# XML doc tags | `<param name="x">text</param>` (single line) | Multi-line: open tag → indented description → close tag |
| TS variable types | `const value = ...` | `const value: Type = ...` (`@typescript-eslint/typedef`) |
| TS null checks | `!value`, `!!value`, `value \|\| "x"` | `isNullOrUndefined(value)`, `isPresent(value)`, `value ?? "x"` |
| C# `var` | `var name = "test"` | `string name = "test"` (always explicit) |
| C# `[InlineData]` multi-arg | All args on one line | Each arg on its own line — see `testing-server.instructions.md` |

> **[CRITICAL] CI/CD ENVIRONMENT VERIFICATION**: Tests passing locally on Windows is necessary but NOT sufficient.
> All tests must also be verified to pass in an environment matching CI/CD (`ubuntu-latest`, Linux Docker).

## [CRITICAL] Security Review Gate

> Before running the final test gate, execute the `/security-review` prompt to perform a comprehensive OWASP/PII/Auth security audit. Fix ALL Critical and High findings before proceeding to tests. This gate is mandatory for all plan executions — the workflow is: **Implementation phases → Zero Warnings Gate → `/security-review` → Test Gate**.

## [CRITICAL] Zero Warnings Gate (Before Security Review)

After all implementation phases complete, BEFORE security review:
1. Run `npm run format`
2. Run `/fix-warnings` — fix every build, lint, and IDE warning
3. Run `get_errors` (no file filter) — confirm zero errors/warnings

This gate is NON-NEGOTIABLE. Zero warnings must be verified before security review.

## [CRITICAL] Final Validation Gate (Plan Completion ONLY)

This gate runs **once** at the end of a plan — not during every phase.

**During implementation phases**: run relevant build/unit tests to verify your work (`dotnet build`, `ng build`, unit tests for changed code). Run `get_errors` (no file filter) after each phase to catch IDE/TypeScript warnings. Do NOT run E2E or load tests mid-phase.

**Final validation** (after all implementation phases + security review + `npm run format`):

| Suite        | Command              | Must See                            |
| ------------ | -------------------- | ----------------------------------- |
| Server       | `dotnet test`        | `Test summary: total: X, failed: 0` |
| Client       | `npm test`           | `X passed (X)`                      |
| E2E          | `npm run test:e2e`   | `[PASS] All E2E tests passed!`      |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds   |

> **All required test suites MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> - E2E and load tests CAN run in parallel to save time
> - If infrastructure is not running, **start it** — do not skip the suite
> - **NEVER** claim "done" without actually running and passing all required test suites
>
> **CI/CD verification**: Tests must also pass on `ubuntu-latest` (GitHub Actions CI).
> Preferred: push to GitHub and confirm CI passes. Alternatives: WSL Ubuntu or Linux VM.

## Documentation MUST Be Current (GATE CONDITION)

After all tests pass, verify:
- All `.github/instructions/*.instructions.md` reflect current patterns
- All `.github/prompts/*.prompt.md` reference current file locations and commands
- All READMEs match implementation
- All `docs/*.md` files are current

---

## Architecture (Quick Reference)

- **Server**: `Shared ← Domains ← Api` (never reverse)
- **Client**: Domains import ONLY `@shared/*` + itself, NEVER another domain

## Technology Stack

| Layer  | Technology                                                                      |
| ------ | ------------------------------------------------------------------------------- |
| Server | .NET 10 LTS, Wolverine CQRS, EF Core, PostgreSQL, FusionCache, FluentValidation |
| Client | Angular 21 LTS, Zoneless, Signals, TanStack Query, Material Design 3, Babylon.js |
| IDE    | VS Code 1.100+                                                                  |

## Domains

| Server                    | Client      |
| ------------------------- | ----------- |
| `Identity`                | `admin`     |
| `Logging`                 | `auth`      |
| `ApiTracking`             | `account`   |
| `ElectronicNotifications` | `developer` |
|                           | `games`     |
|                           | `sandbox`   |
|                           | `home`      |

## E2E Test Isolation Pattern

> **PROHIBITED**: The "save original → test → restore" anti-pattern. Tests MUST create their own data.
> State-changing E2E tests MUST use a **dedicated isolated user** + `browser.newContext({ storageState: undefined })` — never the shared `e2e_user`. See `e2e.instructions.md` for the full pattern.

## Cross-Platform Compatibility

All code MUST work on both **Windows** and **Linux** (CI runs on `ubuntu-latest`).

| Area | [NEVER] | [ALWAYS] |
|------|---------|----------|
| C# paths | `"folder\\file.txt"` | `Path.Combine("folder", "file.txt")` |
| C# temp | `C:\Temp\...` | `Path.GetTempPath()` |
| TS paths | `"folder\\file.ts"` | `path.join("folder", "file.ts")` or `/` |
| Line endings | Assume `\r\n` | Use `.gitattributes` normalization |
| Case | Mix casing across references | Consistent casing (Linux is case-sensitive) |
| Shell | `.ps1`-only for CI | Cross-platform or dual support |

---

## MCP Servers

| Server | Purpose | Task |
|--------|---------|------|
| `context7` | Up-to-date library docs | Angular, Wolverine, TanStack, Playwright APIs |
| `chrome-devtools` | Browser inspection, screenshots | Visual verification of client changes |
| `postgresql` | Read-only DB queries | Debug/explore schema |
| `playwright` | Browser automation | E2E test selector debugging (`--keepalive`) |
| `github` | Issues, PRs, repo ops | PR context, issue tracking |

Use **context7** when unsure about current API for Angular, Wolverine, TanStack Query, or Playwright. Not needed for stable APIs like `Path.Combine`.
If a server needs credentials, ask the user. After VS Code restart, MCP tool toggles may need re-enabling in the Chat panel.
## Chrome DevTools Verification (REQUIRED for Client Changes)

> After any client-side change (component, service, route, style, template), verify with Chrome DevTools MCP. Never rely on "it should work."

| Check | Tool | When |
|-------|------|------|
| Visual state | `take_screenshot` | Always |
| No console errors | `list_console_messages` | Always |
| API calls succeed | `list_network_requests` | When change involves API |
| Accessibility tree | `take_snapshot` | When change involves interactive elements |

**Skip only for**: server-only changes, documentation-only changes, build/config changes with no rendered output.

## Chrome DevTools Login

> **ABSOLUTE PROHIBITION**: Chrome DevTools MCP must **NEVER** change the seeded admin user's password. If redirected to password change, STOP and ask the user.

1. Run `npm start` to start the full dev stack
2. Log in with seeded admin credentials from user secrets (`AdminSeeder:Email` / `AdminSeeder:InitialPassword`)
3. For MFA, retrieve code via PostgreSQL MCP:
   ```sql
   SELECT "TemplateData"->>'code' AS "MfaCode"
   FROM "ElectronicNotifications"."EmailQueue"
   WHERE "EmailType" = 'MfaVerification'
   ORDER BY "CreateDate" DESC
   LIMIT 1;
   ```
4. If the user secret password does not work, ask the user for the current admin password

---

## Test & Output Integrity (CRITICAL — NEVER VIOLATE)

| Rule | Requirement |
|------|-------------|
| **No output truncation** | NEVER pipe build/test/E2E/load output through `Select-Object`, `Select-String`, `Where-Object`, or ANY filter. Run raw commands, full output, no exceptions. Use timeout `0` when unsure. |
| **Zero broken tests** | A failing test MUST be fixed — no "pre-existing", "flaky", or "unrelated" excuses. STOP and fix before claiming done. A broken test is broken code. |
| **Debug single specs** | Run only the failing spec: `npm run test:e2e -- specs/path/to.spec.ts` or `--grep "test name"` or `--keepalive specs/file.spec.ts`. If the failure can't reproduce standalone, re-run the full suite — it may be a cross-test corruption issue. |
| **Full suite gate** | A full passing E2E suite run (`npm run test:e2e` with 0 failures) is REQUIRED before calling `/execute-plan` or `/code-review` complete. No exceptions. |

## Context Compaction Strategy

When executing multi-phase plans that span different technology boundaries:

1. **When to compact**: At natural boundaries — switching from server to client work, switching between unrelated domains, or when context is heavily loaded with completed work
2. **After every compaction**: Re-read `.github/copilot-instructions.md` and the relevant `.github/instructions/*.instructions.md` files for the upcoming work
3. **What to preserve**: The current plan file, phase status, and any pending decisions
4. **What to release**: Completed phase details, resolved debugging context, finished file contents

Plans created by `/create-plan` include explicit compaction checkpoints at major boundaries.

## Package.json Commands Reference

> Use `npm run <script>` commands defined in `package.json`. Read `package.json` for the full list.
> **CRITICAL**: `npm run db:reset` is **USER ONLY — NEVER run via Copilot**.
> **`npm run format` is the ONLY format command** — never run `dprint` directly.

---

## E2E, Load Test, and DAST Environment Isolation (CRITICAL)

E2E, load tests, and DAST scans run in **fully isolated Docker environments** — do NOT start the dev environment for any of them.

| Environment | Docker Compose File | Ports (DB / Cache / API / Client) |
|-------------|--------------------|---------------------------------|
| Dev | `docker-compose.yml` | 5433 / 6379 / 7074 / 4200 |
| E2E | `docker-compose.e2e.yml` | 5434 / 6380 / 7174 / 4201 |
| Load Test | `docker-compose.loadtest.yml` | 5435 / 6381 / 7175 / 4202 |
| DAST | `docker-compose.dast.yml` | 5436 / 6382 / 7274 / 4301 |

## File Index (Auto-Applied via `applyTo` Globs)

| File                             | Scope                                          |
| -------------------------------- | ---------------------------------------------- |
| `formatting.instructions.md`     | `**/SeventySix.Client/src/**/*.{ts,html,scss,css},**/SeventySix.Server/**/*.cs` — naming, structure, operators  |
| `angular.instructions.md`        | `**/SeventySix.Client/src/**/*.ts`             |
| `csharp.instructions.md`         | `**/SeventySix.Server/**/*.cs`                 |
| `security.instructions.md`       | `**/SeventySix.Client/src/**/*.ts,**/SeventySix.Server/**/*.cs` — ProblemDetails, auth errors   |
| `accessibility.instructions.md`  | `**/SeventySix.Client/src/**/*.{ts,html,scss}` |
| `testing-server.instructions.md` | `**/SeventySix.Server/Tests/**/*.cs`           |
| `testing-client.instructions.md` | `**/SeventySix.Client/src/**/*.spec.ts`        |
| `e2e.instructions.md`            | `**/SeventySix.Client/e2e/**/*.ts`             |
| `new-domain.instructions.md`     | Manual reference — domain blueprints           |
| `games.instructions.md`          | `**/SeventySix.Client/src/app/domains/games/**/*.{ts,html,scss}` — game domain architecture |
| `babylonjs.instructions.md`      | `**/SeventySix.Client/src/app/domains/games/**/*.ts` — Babylon.js patterns & CC BY 4.0 |
| `load-testing.instructions.md`   | `**/SeventySix.Client/load-testing/**/*.js` — k6 load test patterns |

## Prompt Index (Invoked via `/prompt-name` in Chat)

### Core Workflow

| Prompt | Description |
| ------ | ----------- |
| `/create-plan` | Create a new Implementation.md plan for upcoming work |
| `/review-plan` | Review an Implementation.md plan against all project rules |
| `/execute-plan` | Execute all remaining phases in Implementation.md |
| `/security-review` | Comprehensive OWASP/PII/Auth security audit (mandatory gate before final tests) |

**Workflow**: `/create-plan` → `/review-plan` → `/execute-plan` (which calls `/security-review` before final tests)

### Scaffolding

| Prompt | Description |
| ------ | ----------- |
| `/new-domain-feature` | Scaffold full-stack feature (Angular + .NET) |
| `/new-server-domain` | Scaffold a new .NET bounded context |
| `/new-client-domain` | Scaffold a new Angular domain module |
| `/new-component` | Scaffold an Angular component with tests |
| `/new-angular-service` | Scaffold an Angular service with domain scoping |
| `/new-service` | Scaffold a .NET service with repository |
| `/new-e2e-test` | Scaffold a Playwright E2E test |
| `/new-load-test` | Scaffold a k6 load test scenario |

### Quality & Verification

| Prompt | Description |
| ------ | ----------- |
| `/code-review` | Review and auto-fix staged changes against all project rules |
| `/fix-warnings` | Find and fix all build/lint warnings (never suppress) |
| `/review-solution` | Deep review of entire codebase against all rules |
| `/run-site-base` | Full-site Chrome DevTools walkthrough with screenshots and report |
| `/update-documentation` | Study and align all READMEs and documentation |
