---
agent: agent
description: Execute all remaining phases in Implementation.md
---

# Execute Implementation Plan

Proceed through **all remaining phases** across all `implementation-N.md` files listed in the `Implementation.md` orchestrator, following every project rule. Execute each implementation file completely before moving to the next. A mandatory security review (OWASP/PII/Auth) runs after all implementation phases complete and before the final test gate. Final validation (all required test suites) runs ONLY after the security review passes.

## MCP Tools

- Use **context7** to verify up-to-date API usage for .NET, Angular, Wolverine, EF Core, TanStack Query
- Use **postgresql** to inspect existing schema when touching data-layer code
- Use **github** for PR context if needed

## Rules

1. **Read** `Implementation.md` (orchestrator) and ALL `implementation-N.md` files listed in it, plus all `.github/instructions/*.instructions.md` files (especially `formatting.instructions.md`) before starting
2. Follow **KISS, DRY, YAGNI** — simplest solution, no duplication, no speculative features
3. Follow **TDD-First 80/20** — write tests BEFORE implementation for the 20% of code carrying 80% of risk (Red → Green → Refactor)
4. Fix all IDE warnings — never suppress with `#pragma warning disable`, `// @ts-ignore`, or `[SuppressMessage]`
5. **Document all new code** — every class, method, function, property, and constant: XML doc (C#), JSDoc (TS/JS/MJS), comment-based help (PS). Tests exempt.
6. **Do NOT send commits** — I will handle these
6. **Do NOT run** `npm run db:reset`, `db:reset`, or any `reset-database` command
7. **Do NOT modify** READMEs or `docs/*.md` unless the **active** `implementation-N.md` contains an explicit documentation phase. When a docs phase IS present, use `/update-documentation` to align all READMEs and docs.

## Phase-Level Verification (During Implementation)

- Build the affected project (`dotnet build` or `ng build`)
- Run unit tests for changed code
- **Run `get_errors` (no file filter)** — confirm zero IDE/TypeScript/lint errors before moving to the next phase
- Do NOT run E2E or load tests until the final gate
- **[CRITICAL] NEVER** truncate terminal output — no `Select-Object -Last N`, `Select-Object -First N`, `Select-String`, or **any** filtering/piping of command output. Run raw commands and let them stream fully.

## Context Compaction (Between Major Boundaries)

At natural technology/domain boundaries (e.g., switching from server to client work):
1. Compact context — release completed phase details
2. Re-read `.github/copilot-instructions.md` and `formatting.instructions.md`
3. Re-read relevant `.github/instructions/*.instructions.md` for the upcoming work
4. Continue with the next phase

## [CRITICAL] Zero Warnings Gate — Runs Before Security Review

After completing ALL implementation phases but BEFORE the security review:

1. **Run `npm run format`** to normalize formatting
2. **Run `/fix-warnings`** — fix every build, lint, and IDE warning across server and client
3. **Run `get_errors` (no file filter)** — confirm zero errors/warnings in the IDE. If any remain, fix them before proceeding.

This gate is NON-NEGOTIABLE. Zero warnings must be verified before security review.

## [CRITICAL] Security Review Gate — Runs Before Final Tests

After the Zero Warnings Gate passes:

1. **Execute the `/security-review` prompt** — perform a full OWASP/PII/Auth security audit
2. **Fix ALL Critical and High findings** — these block release
3. **Document Medium findings** as GitHub issues if not fixable immediately
4. **Run `npm run format`** if security fixes changed code

This security review is NON-NEGOTIABLE. The codebase must be verified clean of:
- Hardcoded secrets, API keys, passwords, connection strings
- PII exposure (developer names, emails, machine paths)
- OWASP Top 10 vulnerabilities
- Authentication/authorization bypasses
- Sensitive data in logs or error responses

Only after the security review passes with zero Critical/High findings do you proceed to the test gate.

## [CRITICAL] Completion Gate — all required test suites, no exceptions

After the security review passes, run all required test suites and confirm they pass. The completion gate must closely mirror GitHub Actions quality gates for the main app and both commerce apps:

| Suite        | Command              | Must See                            |
| ------------ | -------------------- | ----------------------------------- |
| Client Build & Test | `cd SeventySix.Client && npm run lint && npm run build && npm run test:coverage` | lint/build pass and coverage run succeeds |
| Server Build & Test | `cd SeventySix.Server && dotnet restore SeventySix.Server.slnx && dotnet build SeventySix.Server.slnx --configuration Release --no-restore /p:TreatWarningsAsErrors=true && dotnet test SeventySix.Server.slnx --configuration Release --no-build --verbosity normal --collect:"XPlat Code Coverage" --settings ./coverlet.runsettings --results-directory ./TestResults --logger "trx"` | build passes with warnings as errors and tests/coverage succeed |
| Commerce SvelteKit Build & Test | `node scripts/link-commerce-shared-node-modules.mjs --app sveltekit && cd ECommerce/seventysixcommerce-sveltekit && npm run check && npm run test:coverage && npm run build` | `svelte-check found 0 errors`, coverage run succeeds, build succeeds |
| Commerce TanStack Build & Test | `node scripts/link-commerce-shared-node-modules.mjs --app tanstack && cd ECommerce/seventysixcommerce-tanstack && npm run build && npm run typecheck && npm run test:coverage` | build/typecheck/coverage succeed |
| Main App E2E | `npm run test:e2e` | `[PASS] All E2E tests passed!` |
| Commerce SvelteKit E2E | `npm run test:e2e:svelte` | Playwright suite passes |
| Commerce TanStack E2E | `npm run test:e2e:tanstack` | Playwright suite passes |
| Main App Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds |
| Commerce SvelteKit Load (quick) | `npm run loadtest:svelte:quick` | All scenarios pass thresholds |
| Commerce TanStack Load (quick) | `npm run loadtest:tanstack:quick` | All scenarios pass thresholds |

**All required test suites MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.**
- The gate is incomplete unless it includes the main app plus both commerce apps, including build/test, E2E, and quick load-test validation.
- For isolated commerce build/test/E2E/load validation, always run `node scripts/link-commerce-shared-node-modules.mjs --app <sveltekit|tanstack>` first.
- E2E and load tests CAN run in parallel to save time
- If infrastructure is not running, **start it** — do not skip the suite
- Never claim "done" without running and passing all required test suites
- **NEVER** label a test failure "pre-existing" or "unrelated" and move on — ALL failures must be fixed before claiming done
- E2E and load tests run in **fully isolated Docker environments** — no dev environment needed

**When an E2E test fails, run only the failing spec — never re-run the full suite to debug:**
```bash
npm run test:e2e -- specs/path/to/failing.spec.ts
npm run test:e2e -- --grep "exact test name"
npm run test:e2e -- --keepalive specs/failing.spec.ts  # keeps env alive for debugging
```
If the failure can't reproduce standalone, re-run the full suite — it may be a cross-test corruption issue.

**A full passing E2E suite run (`npm run test:e2e` with 0 failures) is REQUIRED before calling this plan complete. No exceptions.**

## [CRITICAL] Site Walkthrough Go/No-Go (MANDATORY FINAL CHECK)

After the full test suite passes AND before the Documentation Gate, run a complete runtime verification using `/run-site-base`. This is the primary functionality confirmation for the entire Ecosystem and is a hard go/no-go for declaring the plan complete.

1. `npm run stop`
2. `npm run start` — full dev stack (API + Angular + SvelteKit + TanStack + infrastructure).
3. Invoke the `/run-site-base` prompt. It MUST:
   - Walk the Angular app including admin (Steps 1–26 + 25B + 26A/26B).
   - Walk the **commerce admin dashboards** (Steps 22–25) — SvelteKit + TanStack dashboards and logs surfaced inside the SeventySix admin area.
   - Walk **SvelteKit** end-to-end (home → shop → product → cart → checkout).
   - Walk **TanStack** end-to-end (home → shop → product → cart → checkout).
   - Play both games (`Car-a-Lot`, `Spy And Fly`) to **completion and victory screens** — verify game state transitions to `Victory` / `Won` via Angular debug API.
   - Assert zero `error`-level console messages per page (excluding the known-safe Babylon/WebGL, Vite dev-mode CSP, and React SSR hydration patterns already enumerated in the prompt).
   - Emit a single report at `.dev-tools-output/walkthrough-report.md` with PASS/FAIL per step.
4. **If any step FAILs (other than the explicitly-permitted Step 9 intentional error-log button), the plan is NOT complete. Fix, then re-run.**

This gate is NON-NEGOTIABLE. Never declare `/execute-plan` complete without a passing `/run-site-base` walkthrough report.

## Documentation Gate (After Tests Pass)

Verify all documentation is current. If changes touched architecture, APIs, patterns, or configuration:
- Run `/update-documentation` to align all READMEs and docs
- Verify `.github/instructions/*.instructions.md` reflect current patterns
- Verify all `docs/*.md` files reference correct file locations and commands
