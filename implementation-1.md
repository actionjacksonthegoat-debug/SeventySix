# Implementation 1 — Phase 1: Baseline E2E Run

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.

---

## Objective

Execute the full E2E test suite against the current codebase to establish a baseline of:
- Total execution time (end-to-end, including Docker setup/teardown)
- Playwright-only execution time (tests only, excluding infrastructure)
- Number of passing tests
- Number of failing tests with specific failure names and error messages
- Which projects (public/authenticated/admin/developer) have failures

This baseline is the reference point for all subsequent work.

---

## Phase 1.1: Pre-Flight Checks

### Step 1.1.1 — Verify E2E Prerequisites

1. Confirm Docker Desktop is running:
   ```powershell
   docker info | Select-String "Server Version"
   ```
2. Confirm Node.js 22+:
   ```powershell
   node --version
   ```
3. Confirm Playwright browsers are installed:
   ```powershell
   cd SeventySix.Client
   npx playwright --version
   ```
4. Confirm SSL certificate exists:
   ```powershell
   Test-Path "SeventySix.Client/ssl/dev-certificate.pfx"
   ```

### Step 1.1.2 — Clean Slate

1. Ensure no stale E2E containers are running:
   ```powershell
   docker compose -f docker-compose.e2e.yml down -v --remove-orphans
   ```
2. Clear previous test results:
   ```powershell
   Remove-Item -Recurse -Force SeventySix.Client/playwright-report -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force SeventySix.Client/test-results -ErrorAction SilentlyContinue
   ```

### Deliverable

- All prerequisites confirmed
- No stale containers or previous results

---

## Phase 1.2: Execute Full Baseline Run

### Step 1.2.1 — Run Full E2E Suite with Timing

From the **repository root**:

```powershell
$startTime = Get-Date
npm run test:e2e 2>&1 | Tee-Object -FilePath "e2e-baseline-output.txt"
$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "`nTotal E2E duration (including Docker): $($duration.ToString('mm\:ss'))"
```

### Step 1.2.2 — Record Results

Capture the following from the output:

| Metric | Value |
|--------|-------|
| Total duration (Docker + tests) | _Record from timing above_ |
| Playwright-only duration | _Record from Playwright output_ |
| Setup duration | _Record from Docker setup phase_ |
| Teardown duration | _Record from Docker teardown phase_ |
| Total tests | _Record from Playwright summary_ |
| Passed | _Record_ |
| Failed | _Record_ |
| Skipped | _Record_ |
| Flaky (passed on retry) | _Record_ |

### Step 1.2.3 — Document Failures

For each failing test, record:

| # | Project | Spec File | Test Name | Error Summary |
|---|---------|-----------|-----------|---------------|
| 1 | _project_ | _file_ | _test name_ | _error message_ |

### Step 1.2.4 — Generate HTML Report

```powershell
cd SeventySix.Client
npx playwright show-report
```

Save a screenshot or note of the report for reference.

### Deliverable

- Complete baseline table filled in
- Failure list with specific error messages
- HTML report generated

---

## Phase 1.3: Document Baseline in Implementation.md

### Step 1.3.1 — Update Orchestrator

Add the baseline results to the **Speed Optimization Research Log** in `Implementation.md`:

```markdown
### Baseline Metrics (Phase 1)

| Metric | Value |
|--------|-------|
| Total duration (Docker + tests) | Xm Xs |
| Playwright-only duration | Xm Xs |
| Docker setup duration | Xm Xs |
| Docker teardown duration | Xs |
| Total tests | X |
| Passed | X |
| Failed | X |
| Skipped | X |
| Flaky (passed on retry) | X |
```

### Step 1.3.2 — Note Speed Observations

While running, observe and document in the orchestrator's Speed Optimization Research Log:

- How long Docker build takes (are layers cached?)
- How long API health check polling takes
- How long global setup (auth state creation) takes
- Which project takes the longest?
- Are there idle gaps between projects?

### Deliverable

- `Implementation.md` updated with baseline metrics
- Speed observations logged for Phase 4

---

## Verification

- [ ] Full E2E suite executed to completion (pass or fail)
- [ ] All metrics recorded in structured format
- [ ] Every failure documented with project, file, test name, and error
- [ ] `Implementation.md` updated with baseline data
- [ ] Speed observations logged for Phase 4 research

---

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.
