# SeventySix Copilot Instructions

> **Context-specific rules** are in `.github/instructions/*.instructions.md` files (auto-applied by `applyTo` globs).
> This file contains **global rules only**. Each concept lives in exactly ONE file � never duplicated.

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

- **`Implementation.md`** is the **orchestrator** � it tracks all `implementation-N.md` files and runs final validation after all complete
- **`implementation-1.md`, `implementation-2.md`, etc.** are focused, completable plan files � each covers one logical unit of work
- Writing throwaway docs is expensive � avoid unless `/create-plan` is explicitly run
- If a change is complex enough to need user-facing documentation, **ASK the user first** before writing it
- `.github/instructions/*.instructions.md` files are the authoritative reference � keep them current, don't duplicate into `/docs/`

---

## Core Principles

- **KISS, DRY, YAGNI** � simplest solution, no duplication, no speculative features
- **TDD 80/20** � focus tests on the 20% of code carrying 80% of risk
- **IDE Warnings = MUST FIX** � never suppress with `#pragma warning disable`, `// @ts-ignore`, `[SuppressMessage]`, or `.editorconfig` severity overrides
    - **Exceptions**: Generated OpenAPI clients
    - **Format Violations**: NEVER add `.editorconfig` rules to suppress format violations (IDE1006, etc.). Always fix violations manually in source files. If `dotnet format` reports "Unable to fix [RULE]", manually correct all instances in the source code.- **`npm run format` is the ONLY format command** ― `dprint` must NEVER be run standalone outside this pipeline:
    - `npm run format:client` runs: ESLint → dprint → ESLint (in this exact order)
    - Running `dprint` directly bypasses ESLint pre/post passes and breaks the required flow
    - Format runs at the end of implementation phases, right before running the test gate
    - During active development, correct formatting manually rather than running format mid-phase- **All required test suites MUST pass** before claiming completion (see below)

> **[CRITICAL] CI/CD ENVIRONMENT VERIFICATION**: Tests passing locally on Windows is necessary but NOT sufficient.
> All tests must also be verified to pass in an environment matching CI/CD (`ubuntu-latest`, Linux Docker).
> This applies to ALL plan completion gates — E2E, load tests, server tests, and client tests.

## [CRITICAL] Tests MUST Pass (GATE CONDITION)

| Suite        | Command              | Must See                            |
| ------------ | -------------------- | ----------------------------------- |
| Server       | `dotnet test`        | `Test summary: total: X, failed: 0` |
| Client       | `npm test`           | `X passed (X)`                      |
| E2E          | `npm run test:e2e`   | `[PASS] All E2E tests passed!`      |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds   |

> **All required test suites MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.**
> - E2E and load tests CAN run in parallel to save time
> - Saying "tests will pass when infrastructure is running" is **NOT acceptable**
> - If infrastructure is not running, **start it** � do not skip the suite
> - **NEVER** claim "done" or "complete" without actually running and passing all required test suites
> **UBUNTU CI/CD ENVIRONMENT (CRITICAL — REQUIRED FOR COMPLETION)**
> All tests must ALSO pass in an environment matching GitHub Actions CI (`ubuntu-latest` / Linux).
> A passing local Windows run is a good sign, but NOT sufficient to declare a plan complete.
>
> Acceptable verification approaches (in order of preference):
> 1. **Push to GitHub** and confirm all four CI jobs pass (`client-build`, `server-build`, `e2e`, `load-test`).
> 2. **Run locally in WSL (Ubuntu)** — E2E and load tests in Docker on a Linux host.
> 3. **Run in a Linux VM** or Docker dev container.
>
> This is non-negotiable. The app is cross-platform and must run identically on Linux (CI) and Windows (dev).
## Documentation MUST Be Current (GATE CONDITION)

After all tests pass, verify:
- All `.github/instructions/*.instructions.md` reflect current patterns
- All `.github/prompts/*.prompt.md` reference current file locations and commands
- All READMEs match implementation
- All `docs/*.md` files are current

---

## Architecture (Quick Reference)

- **Server**: `Shared ? Domains ? Api` (never reverse)
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

## E2E Test Isolation Pattern

> **PROHIBITED**: The "save original ? test ? restore" anti-pattern. Tests MUST create their own data, never borrow-and-return shared state.
> State-changing E2E tests (approve/reject, MFA toggle, password change, profile edit) MUST use a **dedicated isolated user** + `browser.newContext({ storageState: undefined })` � never the shared `e2e_user`. See `e2e.instructions.md` � "Test Isolation" for the full pattern. Reference: `PERM_APPROVE_USER` in `permission-request-list.spec.ts`.

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

## MCP Servers (Available in Agent Mode)

| Server            | Purpose                                                | Activation                     |
| ----------------- | ------------------------------------------------------ | ------------------------------ |
| `github`          | Issues, PRs, repo operations                           | On-demand � needs PAT (first use) |
| `postgresql`      | Read-only DB queries for debugging/exploration         | On-demand � needs connection string |
| `chrome-devtools` | Live browser inspection, console, network, screenshots | On-demand � needs Chrome open  |
| `context7`        | Up-to-date library documentation                       | On-demand — stateless          |
| `playwright`      | Browser automation for E2E test debugging               | On-demand — needs E2E environment running |
Use **context7** when unsure about current API for Angular, Wolverine, TanStack Query, or Playwright. Not needed for stable APIs like `Path.Combine` or standard HTTP.

## MCP Activation Rules (CRITICAL � ABSOLUTE REQUIREMENT)

> **RULE**: ALL MCP servers listed above MUST remain enabled at all times. NEVER disable individual MCP tools in the VS Code chat panel. Before performing a task that an MCP server supports, ALWAYS activate and use that MCP server. Never perform the task manually when an MCP tool exists for it.

> **TOOL AVAILABILITY**: All MCP tools MUST be kept toggled ON in the VS Code chat panel. If any MCP tool appears disabled, RE-ENABLE it immediately � do not proceed without it. Disabling MCP tools is PROHIBITED.

| Task | Required MCP | Tool Examples |
|------|-------------|---------------|
| Verify client-side changes visually | `chrome-devtools` | `take_screenshot`, `evaluate_script`, `list_console_messages` |
| Check network requests/responses | `chrome-devtools` | `list_network_requests` |
| Verify accessibility tree | `chrome-devtools` | `take_snapshot` |
| Look up library API patterns | `context7` | `resolve-library-id`, `query-docs` |
| Create/update PRs and issues | `github` | `create_pull_request`, `list_issues` |
| Inspect database schema/data | `postgresql` | `query` |
| Fine-tune E2E test selectors/flows | `playwright` | Browser automation tools |

**If an MCP server is not running when needed, start it. If it prompts for credentials, ask the user to provide them. NEVER skip the MCP and do the task manually or theoretically. If a tool reports "disabled by the user", STOP and ask the user to re-enable it in the VS Code chat panel before continuing.**

## Known Issue: MCP Tools Reset on VS Code Restart

VS Code may reset MCP tool toggles in the Chat panel on restart. This is a known VS Code behavior � the `chat.mcp.access` and `chat.agent.allowedTools` settings control **authorization** (whether tools are allowed), not **activation** (whether toggles are on in the UI). Additionally, the `github` and `postgresql` servers require credential prompts (`${input:...}`) that VS Code intentionally does not persist across sessions for security.

**Workaround**: After opening VS Code, open the Chat panel and re-enable any disabled MCP tools. The workspace settings already grant full access (`chat.mcp.access: "all"`, `chat.agent.allowedTools: ["*"]`), so re-enabling is a single click per tool.

## Chrome DevTools Verification (REQUIRED for Client Changes)

> **RULE**: After any client-side code change (component, service, route, style, template), use Chrome DevTools MCP to verify the change works. NEVER rely on "it should work" � prove it.

### Verification Checklist

| Check | Tool | When |
|-------|------|------|
| Visual state correct | `take_screenshot` | Always |
| No console errors | `list_console_messages` | Always |
| API calls succeed | `list_network_requests` | When change involves API |
| Accessibility tree valid | `take_snapshot` | When change involves interactive elements |
| Signal/state values correct | `evaluate_script` | When change involves reactive state |

### When to Skip (only these cases)

- Server-only changes (C# code with no client impact)
- Documentation-only changes
- Build/config changes that don't affect rendered output

---

## Chrome DevTools Login Note

> To verify client changes via Chrome DevTools MCP, the app must be running.

> **ABSOLUTE PROHIBITION**: Chrome DevTools MCP must **NEVER** change the seeded admin user's password. The admin credential from user secrets must remain valid at all times. If the app redirects to a change-password page, STOP and ask the user — do NOT fill and submit a new password.

1. Run `npm start` to start the full dev stack (API + Client + infrastructure)
2. Log in with seeded admin credentials from user secrets (`AdminSeeder:Email` / `AdminSeeder:InitialPassword`)
3. Complete MFA — find the code via PostgreSQL MCP:
   ```sql
   SELECT "TemplateData"->>'code' AS "MfaCode"
   FROM "ElectronicNotifications"."EmailQueue"
   WHERE "EmailType" = 'MfaVerification'
   ORDER BY "CreateDate" DESC
   LIMIT 1;
   ```
4. These credentials are **dev-only** — never use in production
5. If the user secret password does not work, ask the user for the current admin password

---

## Package.json Commands Reference

> **RULE**: Always use these `npm run` commands instead of running raw scripts or building manually.

| Command | Purpose |
|---------|---------|
| `npm start` | Start full dev stack (API + Client + Infrastructure) |
| `npm stop` | Stop all dev services |
| `npm test` | Run server + client tests sequentially |
| `npm run test:server` | Run server tests only (starts Docker if needed) |
| `npm run test:client` | Run client tests only |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:keepalive` | Run E2E tests, keep environment alive for debugging |
| `npm run start:client` | Start Angular dev server only |
| `npm run start:api-debug` | Start infrastructure (DB, cache) for API debugging |
| `npm run stop:api` | Stop API and infrastructure containers |
| `npm run format` | Format server + client code — **USE THIS, never run dprint directly** |
| `npm run format:server` | Format server code (analyzers + dotnet format) |
| `npm run format:client` | Format client code (ESLint → dprint → ESLint — required order) |
| `npm run loadtest:quick` | Quick load test profile |
| `npm run loadtest:smoke` | Smoke load test profile |
| `npm run loadtest:load` | Standard load test profile |
| `npm run loadtest:stress` | Stress load test profile |
| `npm run secrets:init` | Initialize user secrets |
| `npm run secrets:list` | List current user secrets |
| `npm run secrets:set` | Set a user secret value |
| `npm run secrets:delete` | Delete a user secret |
| `npm run generate:ssl-cert` | Generate dev SSL certificate |
| `npm run generate:dataprotection-cert` | Generate data protection certificate |
| `npm run generate:icons` | Generate PWA icons |
| `npm run clean:docker` | Clean Docker containers and images |
| `npm run clean:docker:full` | Clean Docker including volumes |
| `npm run db:reset` | **USER ONLY � NEVER run via Copilot** |

---

## E2E Debugging Note

> When debugging E2E test failures, run individual spec files or filter by test name � never run the full suite for debugging.

```bash
# Run a single spec file
npm run test:e2e -- specs/auth/login.spec.ts

# Filter by test name
npm run test:e2e -- --grep "should display login form"

# Keep environment alive for Playwright MCP debugging
npm run test:e2e -- --keepalive specs/failing-test.spec.ts
```

Only run the full `npm run test:e2e` suite for final validation.

### Auto-Failure Diagnostics

The E2E test reporter automatically prints failure diagnostics (screenshot path, URL, console errors, failed network requests) for every failed test. No extra instrumentation needed — it's built into the fixture chain via `diagnostics.fixture.ts`.

Use the Playwright MCP server for interactive selector debugging when the E2E environment is kept alive with `--keepalive`.

---

## E2E and Load Test Environment Isolation (CRITICAL)

E2E tests (`npm run test:e2e`) and load tests (`npm run loadtest:*`) run in **fully isolated Docker environments** with their own database, cache, API, and client containers. You do NOT need to start the dev environment (`npm start`) for either.

| Environment | Docker Compose File | Ports (DB / Cache / API / Client) |
|-------------|--------------------|------------------------------------|
| Dev | `docker-compose.yml` | 5433 / 6379 / 7074 / 4200 |
| E2E | `docker-compose.e2e.yml` | 5434 / 6380 / 7174 / 4201 |
| Load Test | `docker-compose.loadtest.yml` | 5435 / 6381 / 7175 / 4202 |

Use `--keepalive` flag with E2E tests to keep the environment running for Playwright MCP debugging:
```bash
npm run test:e2e -- --keepalive
```

---

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
| `new-domain.instructions.md`     | Manual reference � domain blueprints           |
| `load-testing.instructions.md`   | `**/SeventySix.Client/load-testing/**/*.js` � k6 load test patterns |
