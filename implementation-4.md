# Implementation 4 — Phase 4: E2E Speed Optimization

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.

---

## Objective

Reduce E2E suite execution time from 7+ minutes toward a **5-minute target** without losing test functionality or coverage. This phase begins ONLY after Phase 3's GO/NO-GO gate passes. Optimizations are informed by the Speed Optimization Research Log populated during Phases 1–3.

> **⛔ Anti-Rabbit-Hole Rule:** Every optimization must be measured before and after. If it doesn’t produce a measurable improvement, revert it completely. No speculative changes. No new server endpoints. If an optimization introduces even 1 new test failure, revert immediately — do not debug the regression.

---

## Prerequisites

- [ ] Phase 3 GO/NO-GO gate passed: `[PASS] All E2E tests passed!`
- [ ] Speed Optimization Research Log in `Implementation.md` is populated
- [ ] Post-cleanup baseline metrics are recorded

---

## Phase 4.1: Performance Profiling

### Step 4.1.1 — Per-Project Timing Breakdown

Run each project individually to identify the slowest:

```powershell
cd SeventySix.Client

# Time each project separately
Measure-Command { npx playwright test --project=setup } | Select-Object TotalSeconds
Measure-Command { npx playwright test --project=public } | Select-Object TotalSeconds
Measure-Command { npx playwright test --project=authenticated } | Select-Object TotalSeconds
Measure-Command { npx playwright test --project=admin } | Select-Object TotalSeconds
Measure-Command { npx playwright test --project=developer } | Select-Object TotalSeconds
```

Record:

| Project | Duration | Test Count | Avg per Test |
|---------|----------|------------|-------------|
| setup (global auth) | _Xs_ | N/A | N/A |
| public | _Xs_ | ~111 | _Xs_ |
| authenticated | _Xs_ | ~73 | _Xs_ |
| admin | _Xs_ | ~90 | _Xs_ |
| developer | _Xs_ | ~25 | _Xs_ |

### Step 4.1.2 — Identify Slowest Individual Tests

Run with JSON reporter to get per-test timing:

```powershell
npx playwright test --reporter=json > test-timing.json
```

Parse for the top 20 slowest tests:

```powershell
# In Node.js or a quick script:
node -e "
const data = require('./test-timing.json');
const tests = data.suites.flatMap(s => s.specs).map(s => ({
    title: s.title,
    duration: s.tests[0]?.results[0]?.duration ?? 0,
    file: s.file
})).sort((a, b) => b.duration - a.duration).slice(0, 20);
console.table(tests);
"
```

### Step 4.1.3 — Docker Infrastructure Timing

Break down the non-test overhead:

| Phase | Duration |
|-------|----------|
| `docker compose build` (cached) | _Xs_ |
| `docker compose up` | _Xs_ |
| API health check polling | _Xs_ |
| Client health check polling | _Xs_ |
| Playwright global setup | _Xs_ |
| Playwright teardown | _Xs_ |
| `docker compose down` | _Xs_ |
| **Total non-test overhead** | _Xs_ |
| **Actual test execution** | _Xs_ |

### Deliverable

- Per-project timing table
- Top 20 slowest tests identified
- Non-test overhead measured

---

## Phase 4.2: Quick Wins (Low-Risk Optimizations)

### Step 4.2.1 — Review `test.slow()` Removals

From Phase 2's `test.slow()` audit, determine which tests can have `test.slow()` removed now that Phase 3 cleanup is done.

Each `test.slow()` triples the timeout (30s → 90s). While it doesn't directly slow execution, it masks tests that should run faster and prevents timeout-based failure detection.

### Step 4.2.2 — Optimize Global Setup Parallelization

**File:** `e2e/global-setup.ts`

Current behavior: Authenticates non-MFA users in parallel via `Promise.all()`. Verify this is working efficiently:
- Are all 3 auth states (user, admin, developer) created concurrently?
- Could the `chromium.launch()` be moved inside each promise to use separate browser instances?
- Is there unnecessary serialization?

### Step 4.2.3 — Review Worker Configuration

**File:** `playwright.config.ts`

Current: `workers: process.env.CI ? 4 : undefined` (undefined = auto-detect)

Options:
- Set `workers: process.env.CI ? 4 : 4` for consistent local performance
- If machine has more cores, increase workers
- Note: `fullyParallel: true` is already set — verify all tests handle parallelism

### Step 4.2.4 — Optimize Navigation

Check if tests are doing unnecessary navigation:
- Tests with `beforeEach` that navigates to the same page the previous test was on
- Tests that navigate to a page, then immediately navigate elsewhere
- Tests that wait for `networkidle` when `load` would suffice

### Deliverable

- `test.slow()` removals applied where safe
- Global setup efficiency verified
- Worker count optimized
- Unnecessary navigation removed

---

## Phase 4.3: Medium-Effort Optimizations

### Step 4.3.1 — API-Level Test Data Setup (RESEARCH ONLY)

> **⛔ Revert Discipline:** This step is RESEARCH and MEASUREMENT only. Do NOT add new server endpoints or modify server code. Only use APIs that ALREADY EXIST.

**Evaluate:** Can existing API endpoints (login, user management, etc.) replace multi-step UI setup in `beforeEach` hooks?

**Candidates to measure (using EXISTING endpoints only):**
1. TOTP enrollment — check if existing admin API can toggle MFA for a user
2. User creation — check if existing admin user-create API is faster than the UI wizard
3. Password reset — check if existing password-change API can shortcut the email flow

**Constraint:** Only for setup/teardown, NOT for the actual assertions. The UI interaction being tested must still exercise the UI.

**If no existing endpoints support the shortcut, document the finding and move on. Do NOT build new endpoints.**

### Step 4.3.2 — Reduce Redundant Accessibility Tests

Currently, 4 accessibility specs (one per project) each run axe-core on multiple pages. Evaluate:
- Are any pages tested multiple times across different projects?
- Can accessibility tests run as a single project with appropriate auth states?
- **Note:** Do NOT remove any accessibility coverage — only reduce duplication.

### Step 4.3.3 — Optimize Email Polling

**File:** `e2e/fixtures/email.fixture.ts`

Current: 500ms polling interval with 10s timeout.

Options:
- Reduce polling interval to 200ms (MailDev usually responds instantly)
- Add exponential backoff (200ms → 400ms → 800ms)
- Consider MailDev's webhook support if available

### Step 4.3.4 — Shared Context Within Projects (EVALUATE ONLY — HIGH REVERT RISK)

> **⛔ Revert Discipline:** Shared contexts are a known source of flaky tests. If attempted, run the full suite 3 times. If ANY run produces a failure that didn't exist before, revert the ENTIRE change immediately. Do not debug flaky shared-context issues.

Evaluate if tests within the same project that don't modify state can share a browser context. This is a measurement exercise — check if Playwright's `reuseExistingServer` or project-level `storageState` already provides this benefit.

**Risk:** High — shared contexts cause state leakage. Only consider for pure read-only accessibility scans. Likely not worth the risk.

### Deliverable

- API-level setup implemented for eligible multi-step flows
- Accessibility test duplication reduced (if any found)
- Email polling optimized
- Shared context evaluated (implement only if safe)

---

## Phase 4.4: Docker Infrastructure Optimization

### Step 4.4.1 — Layer Caching Optimization

Review `docker-compose.e2e.yml` and associated Dockerfiles:
- Are `.dockerignore` files excluding test results, node_modules, etc.?
- Is multi-stage build used for the API Dockerfile?
- Are NuGet/npm dependency layers cached separately from code?

### Step 4.4.2 — Reduce Health Check Poll Intervals

**Files:** `docker-compose.e2e.yml`, `scripts/wait-for-api.mjs`

Current API health check: `interval: 10s`, `timeout: 5s`, `retries: 10`, `start_period: 30s`

If the API typically starts in <30s, these can be tightened:
- Reduce `interval` to 3s
- Reduce `start_period` to 15s
- Reduce `retries` to 5

### Step 4.4.3 — Parallel Container Startup

Verify that containers start in parallel where dependencies allow:
- postgres-e2e and valkey-e2e should start simultaneously
- maildev should start simultaneously with the above
- api-e2e waits for postgres + valkey (correct)
- client-e2e waits for api-e2e (correct)

### Deliverable

- Docker build caching optimized
- Health check intervals tightened
- Container startup order verified

---

## Phase 4.5: Measurement & Comparison

### Step 4.5.1 — Run Full Optimized Suite

```powershell
$startTime = Get-Date
npm run test:e2e 2>&1 | Tee-Object -FilePath "e2e-optimized-output.txt"
$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "`nOptimized E2E duration (including Docker): $($duration.ToString('mm\:ss'))"
```

### Step 4.5.2 — Compare Metrics

| Metric | Baseline | Post-Cleanup | Optimized | Improvement |
|--------|----------|-------------|-----------|-------------|
| Total duration | _Phase 1_ | _Phase 3_ | _record_ | _X%_ |
| Playwright-only | _Phase 1_ | _Phase 3_ | _record_ | _X%_ |
| Docker overhead | _Phase 1_ | N/A | _record_ | _X%_ |
| Slowest test | _Phase 1_ | _Phase 3_ | _record_ | _Xs_ |
| Total tests | _Phase 1_ | _Phase 3_ | _record_ | _should match_ |

### Step 4.5.3 — Update Implementation.md

Update the orchestrator with final metrics and the optimization strategies that were applied.

### Deliverable

- Full optimized suite passes
- Comparison table completed
- `Implementation.md` updated with final results

---

## Phase 4.6: Final Validation (ALL 4 SUITES)

### Step 4.6.1 — Run All 4 Test Suites

This is the final gate before declaring the work complete.

| Suite | Command | Required Output |
|-------|---------|----------------|
| Server | `dotnet test` (from `SeventySix.Server/`) | `Test summary: total: X, failed: 0` |
| Client | `npm test` (from `SeventySix.Client/`) | `X passed (X)` |
| E2E | `npm run test:e2e` (from repo root) | `[PASS] All E2E tests passed!` |
| Load (quick) | `npm run loadtest:quick` (from repo root) | All scenarios pass thresholds |

> E2E and load tests CAN run in parallel.
> If infrastructure is not running, **start it**.

### Step 4.6.2 — Documentation Verification

- [ ] `.github/instructions/e2e.instructions.md` reflects current patterns
- [ ] `e2e/README.md` matches implementation
- [ ] `Implementation.md` has final metrics and optimization results
- [ ] All fixture barrel exports are current

### Deliverable

- All 4 test suites pass
- All documentation is current
- Work is complete

---

## Verification

- [ ] Per-project timing profiled
- [ ] Top 20 slowest tests identified and optimized where possible
- [ ] Docker infrastructure timing measured
- [ ] Quick wins applied (`test.slow()`, workers, navigation)
- [ ] API-level setup for eligible multi-step flows (if beneficial)
- [ ] Docker caching and health checks optimized
- [ ] Full E2E suite passes: `[PASS] All E2E tests passed!`
- [ ] All 4 test suites pass
- [ ] Comparison metrics recorded
- [ ] `Implementation.md` updated with final results

---

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.
