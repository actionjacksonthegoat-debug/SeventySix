# Implementation Plan — E2E Test Audit, Cleanup & Optimization

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.

---

## Executive Summary

### Problem

The E2E test suite (~262 tests across 34 spec files) runs in **7+ minutes** and contains code smells including ~25 inline selectors, ~6 inline text strings, fragile TOTP cleanup logic, conditional assertions that silently pass, and a hardcoded MailDev URL. While the suite has strong foundations (zero `waitForTimeout` calls, dedicated test users, page objects, centralized constants), these issues degrade maintainability and may cause intermittent failures.

### Goal

1. Establish a **baseline** of current pass/fail state and execution time
2. **Audit** every code smell and document findings
3. **Clean up** all issues so every test passes reliably following `.github` standards and Playwright best practices
4. **Research** speed optimizations to bring the suite under 5 minutes without sacrificing functionality

### Key Constraints

- Architecture must follow `.github/instructions/e2e.instructions.md` patterns
- All selectors via `SELECTORS`, all text via `PAGE_TEXT`, all routes via `ROUTES`
- Anti-flake rules: no `waitForTimeout`, no positional CSS selectors, no hardcoded strings
- CI compatibility: `retries: process.env.CI ? 1 : 0`, `workers: process.env.CI ? 4 : undefined`
- Cross-platform: must work on both Windows and Linux (`ubuntu-latest`)
- MailDev is the email capture tool (evaluate alternatives during audit)
- Playwright CLI for running tests — no Playwright MCP

### ⛔ Revert Discipline (CRITICAL — Read Before Every Change)

> **If a change doesn't work cleanly on first or second attempt, DELETE IT. Do not iterate on a hack.**

| Rule | Detail |
|------|--------|
| **No speculative server changes** | Do NOT add new API endpoints, seeders, or server-side code to fix E2E issues. Fix the tests themselves. If server changes are truly needed, STOP and discuss before writing code. |
| **Try simple first** | For every fix, try the simplest approach. If it works, ship it. If it doesn't, revert and try the next-simplest. Never layer workarounds. |
| **2-attempt limit** | If an approach doesn't work after 2 focused attempts, revert ALL code from that approach and try a different strategy. No polishing a bad idea. |
| **No "temporary" code** | Every line committed must be production-quality. No `// TODO: clean this up later`, no `// HACK:`, no experimental scaffolding left behind. |
| **Revert > Comment-out** | If something doesn't work, `git checkout` the file. Never comment code out and leave it. |
| **Run tests after every change** | After each individual fix, run the affected spec (`npx playwright test <file>`). If the fix breaks something else, revert before continuing. |
| **No scope creep** | If a fix starts touching files outside `e2e/`, STOP. That's a different problem. Document it and move on. |

---

## Implementation Files

| File | Scope | Status |
|------|-------|--------|
| `implementation-1.md` | **Phase 1: Baseline Run** — Execute full E2E suite, record time/failures | ✅ Complete |
| `implementation-2.md` | **Phase 2: Code Smell Audit** — Deep analysis of every issue, MailDev evaluation, recommendations | ✅ Complete |
| `implementation-3.md` | **Phase 3: Cleanup & Fix** — Fix all code smells, make all tests pass (GO/NO-GO gate) | 🔄 In Progress |
| `implementation-4.md` | **Phase 4: Speed Optimization Research** — Document performance findings and implement improvements | ⬜ Not Started |

---

## Speed Optimization Research Log

> This section is populated incrementally during Phases 1–3 with observations that will inform Phase 4.

### Baseline Metrics (Phase 1)

| Metric | Value |
|--------|-------|
| Total duration (Docker + tests) | ~4m 30s |
| Docker build (cached) | ~10s |
| Docker container startup + health | ~17s |
| API/Client health check wait | ~1s |
| Playwright-only duration | ~1.5m (1m 30s) |
| Docker teardown | ~5s |
| Total tests | 302 |
| Passed | 299 |
| Failed | 3 (consistent) + 1 (flaky) |
| Skipped | 0 |
| Flaky (passed on retry) | 0 |

### Baseline Failures

| # | Project | Spec File | Test Name | Error Summary | Category |
|---|---------|-----------|-----------|---------------|----------|
| 1 | developer | `developer-access.spec.ts:95` | should redirect user role from /developer/style-guide | `not.toHaveURL` fails — user stays on developer page | App bug (RBAC) |
| 2 | developer | `developer-access.spec.ts:95` | should redirect user role from /developer/architecture-guide | `not.toHaveURL` fails — user stays on developer page | App bug (RBAC) |
| 3 | developer | `developer-access.spec.ts:106` | should redirect user role to home from developer area | `waitForURL` timeout — user stays on /developer/style-guide | App bug (RBAC) |
| 4 | authenticated | `totp-setup.spec.ts:81` | should toggle to manual entry and show secret | `toHaveText` — expected "Set Up Authenticator App", got "Setting up Authenticator" | Flaky (heading text mismatch) |

> **Note:** Failures 1–3 are an app-level RBAC bug: the Angular route guard does not block `User` role from `/developer/*` routes. This is NOT a test issue. Failure 4 appeared in a direct Playwright run but did NOT reproduce in the full `npm run test:e2e` run — likely a timing/ordering issue.

### Observations (Populated During Phases 1–3)

| # | Finding | Phase | Impact Estimate | Notes |
|---|---------|-------|-----------------|-------|
| 1 | Docker build fully cached (0s on unchanged code, ~9s on client rebuild) | 1 | Low | Layer caching is working well |
| 2 | Container startup takes ~17s (API health check is the bottleneck) | 1 | Medium | Current health check interval=10s, start_period=30s |
| 3 | Playwright-only execution is ~1.5m for 302 tests — avg 0.3s/test | 1 | Low | Very fast per-test execution |
| 4 | TOTP enrollment test takes 15–20s (slowest single test) | 1 | Low | Complex teardown with API re-auth |
| 5 | Full password reset flow takes ~11s (second slowest) | 1 | Low | Multi-step email flow |
| 6 | Total overhead (build+startup+teardown) is ~33s of ~4m30s = 12% | 1 | Low | Majority of time is in tests |

### Potential Strategies (Pre-Research)

| Strategy | Description | Risk |
|----------|-------------|------|
| Parallel project execution | Ensure `fullyParallel: true` is leveraged across all 4 projects | Low |
| Reduce `test.slow()` usage | 13 tests currently use `test.slow()` — audit if still needed after cleanup | Low |
| API seeding over UI setup | Replace multi-step UI flows with API-level test data setup | Medium |
| Shared browser contexts | Reuse contexts within project where tests are independent | Medium |
| Selective test tagging | Separate smoke vs. full regression for faster feedback loops | Low |
| Docker build caching | Optimize `docker-compose.e2e.yml` build steps | Low |
| Global setup optimization | Parallel auth state creation (already done — verify efficiency) | Low |

---

## Final Validation Gate

> Runs AFTER ALL implementation files are complete.

### Test Suites (ALL 4 REQUIRED)

| Suite | Command | Must See |
|-------|---------|----------|
| Server | `dotnet test` | `Test summary: total: X, failed: 0` |
| Client | `npm test` | `X passed (X)` |
| E2E | `npm run test:e2e` | `[PASS] All E2E tests passed!` |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds |

### Documentation Check

- [ ] `.github/instructions/e2e.instructions.md` reflects current patterns
- [ ] `SeventySix.Client/e2e/README.md` matches implementation
- [ ] All fixture barrel exports (`fixtures/index.ts`) are current
- [ ] Speed optimization findings documented in this file

---

## Appendix A: File Inventory

### E2E Spec Files (34 total)

| Category | File | Approx Tests |
|----------|------|-------------|
| public | `login.spec.ts` | ~28 |
| public | `home.spec.ts` | 8 |
| public | `register.spec.ts` | ~21 |
| public | `forgot-password.spec.ts` | ~20 |
| public | `set-password.spec.ts` | 4 |
| public | `error-pages.spec.ts` | 5 |
| public | `sandbox.spec.ts` | 4 |
| public | `accessibility.spec.ts` | ~10 |
| public | `forced-password-change.spec.ts` | 8 |
| public | `oauth-login.spec.ts` | 3 |
| authenticated | `logout.spec.ts` | 9 |
| authenticated | `totp-setup.spec.ts` | 4 |
| authenticated | `user-access.spec.ts` | ~8 |
| authenticated | `session.spec.ts` | 3 |
| authenticated | `request-permissions.spec.ts` | 8 |
| authenticated | `profile.spec.ts` | 12 |
| authenticated | `navigation.spec.ts` | 6 |
| authenticated | `mfa-login.spec.ts` | 7 |
| authenticated | `change-password.spec.ts` | 4 |
| authenticated | `change-password-flow.spec.ts` | 2 |
| authenticated | `backup-codes.spec.ts` | 4 |
| authenticated | `accessibility.spec.ts` | 6 |
| admin | `admin-dashboard.spec.ts` | 15 |
| admin | `admin-access.spec.ts` | ~19 |
| admin | `user-management.spec.ts` | 15 |
| admin | `user-detail.spec.ts` | 5 |
| admin | `user-create.spec.ts` | 5 |
| admin | `permission-request-list.spec.ts` | 8 |
| admin | `log-management.spec.ts` | 15 |
| admin | `accessibility.spec.ts` | 8 |
| developer | `accessibility.spec.ts` | 3 |
| developer | `developer-access.spec.ts` | ~12 |
| developer | `architecture-guide.spec.ts` | 4 |
| developer | `style-guide.spec.ts` | 6 |

### E2E Fixture Files

| File | Purpose |
|------|---------|
| `fixtures/index.ts` | Barrel export |
| `fixtures/auth.fixture.ts` | Extends Playwright test with auth state |
| `fixtures/fresh-login.fixture.ts` | Fresh login for destructive tests |
| `fixtures/unauthenticated.fixture.ts` | Anonymous test fixture |
| `fixtures/email.fixture.ts` | MailDev email helper |
| `fixtures/config.constant.ts` | E2E environment config |
| `fixtures/routes.constant.ts` | Application routes |
| `fixtures/selectors.constant.ts` | Centralized selectors |
| `fixtures/page-text.constant.ts` | Expected text content |
| `fixtures/test-users.constant.ts` | Dedicated test users |
| `fixtures/timeouts.constant.ts` | Timeout constants |
| `fixtures/assertions.helper.ts` | Shared assertion helpers |
| `fixtures/page-helpers.fixture.ts` | Page helper factory |
| `fixtures/helpers/login.helper.ts` | Login automation |
| `fixtures/helpers/totp.helper.ts` | TOTP code generation |
| `fixtures/helpers/altcha.helper.ts` | Altcha challenge solver |
| `fixtures/helpers/accessibility.helper.ts` | axe-core accessibility |
| `fixtures/pages/auth.page.ts` | Auth page object |
| `fixtures/pages/home.page.ts` | Home page object |
| `fixtures/pages/admin-dashboard.page.ts` | Admin dashboard page object |
| `fixtures/pages/change-password.page.ts` | Change password page object |
| `reporters/concise-reporter.ts` | Custom CI reporter |

---

## Appendix B: Known Code Smells (Pre-Audit)

| # | Category | Count | Severity |
|---|----------|-------|----------|
| 1 | Inline selectors not in `SELECTORS` | ~25 | Medium |
| 2 | Inline text not in `PAGE_TEXT` | ~6 | Low |
| 3 | Hardcoded MailDev URL in `email.fixture.ts` | 1 | Low |
| 4 | Missing `registerComplete` route in `ROUTES` | 1 | Low |
| 5 | Hardcoded cookie name `"X-Refresh-Token"` | 2 | Low |
| 6 | TOTP cleanup — 95-line fragile teardown | 1 | High |
| 7 | Conditional assertions (OAuth, cross-tab logout) | 2 | Medium |
| 8 | Manual retry loop in `totp-setup.spec.ts` `beforeEach` | 1 | Medium |
| 9 | Negative email assertion via `try/catch` timeout | 1 | Medium |
| 10 | `eslint-disable` suppressions in test code | ~6 | Medium |
| 11 | `test.slow()` usage across 13 tests/10 files | 13 | Audit needed |

---

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.
