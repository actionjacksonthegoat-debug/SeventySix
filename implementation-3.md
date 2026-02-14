# Implementation 3 — Phase 3: E2E Test Cleanup & All-Pass Gate

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.

---

## Objective

Fix every code smell identified in Phase 2, resolve all test failures from the Phase 1 baseline, and achieve a **GO** decision: every E2E test passes. This phase has a hard gate — no proceeding to Phase 4 until `npm run test:e2e` outputs `[PASS] All E2E tests passed!`.

> **⛔ Anti-Rabbit-Hole Rule:** Every change in this phase must follow the Revert Discipline from `Implementation.md`. If a fix doesn't work cleanly after 2 attempts, DELETE the code and try a different approach. No speculative server changes. No code left behind that “just exists to see if it works.” If it doesn't work — it doesn’t exist.

---

## Phase 3.1: Centralize All Magic Strings

### Step 3.1.1 — Add Missing Selectors to `SELECTORS` Constant

**File:** `e2e/fixtures/selectors.constant.ts`

Add the following selector groups (exact names from Phase 2 audit):

```typescript
// Add to existing SELECTORS object:

// Shared data table selectors (used by user-management + log-management)
dataTable: {
    // ... existing entries ...
    searchInput: "input[matinput]",
    chipOption: "mat-chip-option",
    rowActionsButton: "button[aria-label='Row actions']",
    table: "table[mat-table]",
    headerCell: "th[mat-header-cell]",
},

// Dialog selectors
dialog: {
    closeButton: "button[aria-label*='Close']",
},

// Menu selectors
menu: {
    menuItem: "button.mat-mdc-menu-item",
    warnMenuItem: "button.mat-mdc-menu-item.warn-action",
},

// Stepper selectors
stepper: {
    stepHeader: ".mat-step-header",
},

// Log management specific
logManagement: {
    // ... existing entries ...
    detailDialog: ".log-detail-dialog",
    messageContent: ".message-content",
},

// Developer pages
developer: {
    colorSchemeSelect: "mat-select[aria-label='Select color scheme']",
    tabGroup: "mat-tab-group",
    colorsTab: ".mat-mdc-tab:has-text('Colors')",
},

// TOTP setup
totpSetup: {
    // ... existing entries ...
    cantScanButton: "button.link-button:has-text('Can\\'t scan')",
    scannedCodeButton: "button:has-text('I\\'ve scanned the code')",
    verifyEnableButton: "button:has-text('Verify & Enable')",
},

// Form (add to existing)
form: {
    // ... existing entries ...
    errorMessage: "[role='alert'], .error-message, mat-error",
    matError: "mat-error",
},

// Sandbox
sandbox: {
    cardContent: "mat-card-content",
},

// Icon button (accessibility testing)
iconButton: "button[mat-icon-button]",
```

**Verification:** Search all spec files for any remaining inline selectors not in `SELECTORS`.

### Step 3.1.2 — Add Missing Text to `PAGE_TEXT` Constant

**File:** `e2e/fixtures/page-text.constant.ts`

```typescript
// Add to PAGE_TEXT.links:
returnToLogin: "Return to Login",

// Add to PAGE_TEXT.validation:
minimumCharacters: "8 characters",

// Add to PAGE_TEXT.confirmation:
userUpdated: "User updated successfully",
permissionRequestSubmitted: "Permission request submitted",

// Add new section:
filters: {
    warnings: "Warnings",
    errors: "Errors",
},
```

### Step 3.1.3 — Add Missing Routes

**File:** `e2e/fixtures/routes.constant.ts`

```typescript
// Add to ROUTES.auth:
registerComplete: "/auth/register/complete",
```

### Step 3.1.4 — Fix Hardcoded Constants

**File:** `e2e/fixtures/email.fixture.ts`
- Replace hardcoded `"http://localhost:1080"` with `E2E_CONFIG.mailDevUrl`

**File:** `e2e/fixtures/config.constant.ts` (or new `cookies.constant.ts`)
- Add `COOKIE_NAMES.refreshToken = "X-Refresh-Token"` or add to `E2E_CONFIG`

**File:** `e2e/specs/public/forced-password-change.spec.ts`
- Add API route to a new `API_ROUTES` constant or to `E2E_CONFIG.apiRoutes`

### Step 3.1.5 — Update All Spec Files

For each magic string identified in Phase 2, update the spec file to import from the centralized constant. This is a mechanical find-and-replace per file.

**Pattern:**
```typescript
// BEFORE (inline)
page.locator("input[matinput]")

// AFTER (centralized)
page.locator(SELECTORS.dataTable.searchInput)
```

### Step 3.1.6 — Verify No Remaining Magic Strings

Run a grep across all spec files to confirm no inline selectors/text remain:

```powershell
# Selectors: any page.locator("...") not using SELECTORS
Select-String -Path "SeventySix.Client/e2e/specs/**/*.ts" -Pattern 'page\.locator\("[^"]*"\)' -Recurse | Where-Object { $_.Line -notmatch "SELECTORS" }

# Text: any toHaveText("...") or toContainText("...") not using PAGE_TEXT
Select-String -Path "SeventySix.Client/e2e/specs/**/*.ts" -Pattern 'toHaveText\("' -Recurse | Where-Object { $_.Line -notmatch "PAGE_TEXT" }
```

**Note:** Some inline strings are acceptable (test-generated data like `e2e_test_${Date.now()}@test.local`, or intentionally invalid inputs). Only flag strings that represent UI copy or DOM structure.

### Deliverable

- All `SELECTORS`, `PAGE_TEXT`, `ROUTES` constants updated
- All spec files updated to use centralized imports
- Zero remaining magic strings (verified by grep)

---

## Phase 3.2: Fix Fragile Patterns

### Step 3.2.1 — Refactor TOTP Cleanup (HIGH)

**File:** `e2e/specs/authenticated/totp-setup.spec.ts`

> **⛔ Revert Discipline:** Do NOT add new server-side API endpoints to solve this. Fix the E2E test code only.

**Approach (in order — stop at the first one that works):**

1. **Check if an existing E2E seeder endpoint already handles TOTP reset.** Search the server for `E2ESeeder` and `totp`/`mfa` references. If one exists, use it. Do NOT create a new one.
2. **Extract cleanup into `fixtures/helpers/totp.helper.ts`** — move the 95-line block into a named function with clear error messages. Remove `eslint-disable` comments by fixing the underlying code (proper types, explicit returns). This is the most likely fix.
3. **If the cleanup is fundamentally broken** (can't be fixed without server changes), document it as a known limitation with a `// KNOWN-LIMITATION:` comment and move on. Do not rabbit-hole.

**Hard rules:**
- Remove all `eslint-disable` comments from the cleanup
- Add timeouts that fail explicitly rather than silently
- If the refactored helper is longer than 40 lines, it's too complex — simplify further

### Step 3.2.2 — Fix TOTP beforeEach Retry Loop (MEDIUM)

**File:** `e2e/specs/authenticated/totp-setup.spec.ts`

Replace manual retry loop with either:
1. A proper `test.beforeEach` that calls an API endpoint to ensure clean state
2. Use of `expect.toPass({ timeout })` for the retryable assertion
3. If using Playwright retries, rely on `retries: 1` config instead of manual loop

### Step 3.2.3 — Fix Conditional Assertions (MEDIUM)

> **⛔ Revert Discipline:** If making an assertion deterministic requires more than ~10 lines of new setup code, the complexity isn’t worth it. Use `test.skip()` with a clear reason instead.

**OAuth test:** `e2e/specs/public/oauth-login.spec.ts`
- Make the redirect capture deterministic by waiting for the navigation event
- If GitHub OAuth is genuinely untestable in E2E (redirect goes to external GitHub), mark with `test.skip("GitHub OAuth redirect is external and non-deterministic in E2E")` rather than a conditional that silently passes
- Do NOT build a mock OAuth server — that’s a rabbit hole

**Cross-tab logout:** `e2e/specs/authenticated/logout.spec.ts`
- Determine which server behavior is correct and assert only that
- If both behaviors are valid, split into two tests with clear names
- If the server behavior is genuinely non-deterministic, use `test.skip()` with explanation

### Step 3.2.4 — Fix Negative Email Assertion (MEDIUM)

**File:** `e2e/specs/public/forgot-password.spec.ts`

> **⛔ Revert Discipline:** Verify the MailDev API supports count-based checks before writing code. If it doesn't, keep the existing `try/catch` with a clear comment — don't invent a complex workaround.

**Approach:**
1. First, manually verify MailDev's `GET /email` returns an array (check `email.fixture.ts` — `getAllEmails()` already exists)
2. If it does, add a `getEmailCount()` method that calls `getAllEmails()` and returns `.length` (filtered by recipient)
3. Replace the `try/catch` with a before/after count comparison
4. If the count approach doesn't work reliably (e.g., race between email queue and check), **revert to the existing `try/catch`** with a `// KNOWN-LIMITATION:` comment explaining why

Do NOT spend more than 30 minutes on this. The existing pattern works — it's just not elegant.

### Step 3.2.5 — Fix User-Create Search Fallback (LOW)

**File:** `e2e/specs/admin/user-create.spec.ts`

Replace conditional `isVisible()` with proper wait:

```typescript
// BEFORE
if (await searchInput.isVisible()) { ... }

// AFTER
await expect(searchInput).toBeVisible();
await searchInput.fill(searchTerm);
```

### Step 3.2.6 — Remove All eslint-disable Comments

For each `eslint-disable` in E2E code:
1. If the underlying issue was fixed in a prior step → remove the disable
2. If the disable is for a legitimate Playwright pattern → replace with a targeted `eslint-disable-next-line` with a comment explaining why
3. Goal: zero broad `eslint-disable` blocks; only targeted `eslint-disable-next-line` with justification

### Deliverable

- TOTP cleanup refactored (either API seeder or simplified helper)
- No manual retry loops
- No conditional assertions that silently pass
- Negative email assertion is deterministic
- All `eslint-disable` blocks removed or converted to justified `eslint-disable-next-line`

---

## Phase 3.3: Fix Test Failures from Baseline

### Step 3.3.1 — Triage Baseline Failures

From Phase 1's failure list, categorize each failure:

| Category | Action |
|----------|--------|
| **Environment issue** | Fix Docker config, timing, or health check |
| **Flaky test** | Fix underlying race condition or wait |
| **Broken test** | Fix assertion or test logic |
| **Broken app** | Fix application code (separate PR if needed) |

### Step 3.3.2 — Fix Each Failure

For each failure (prioritized by category):

1. Reproduce the failure locally with `npx playwright test --grep "test name" --headed --debug`
2. Identify root cause using trace viewer or Chrome DevTools MCP
3. Implement fix (simple approach first)
4. Verify fix with 3 consecutive passes: `npx playwright test --grep "test name" --repeat-each=3`
5. **If the fix doesn’t pass 3/3 after 2 attempts, revert ALL changes from that fix and try a different approach**
6. **If no approach works after 3 different strategies, skip the test with `test.fixme("description of the issue")` and move on** — do not block the entire phase on one stubborn test

### Step 3.3.3 — Run Full Suite Locally

After all individual fixes:

```powershell
cd SeventySix.Client
npx playwright test
```

All tests must pass. If new failures appear, repeat Step 3.3.2.

### Deliverable

- Every baseline failure resolved
- Full local suite passes

---

## Phase 3.4: Update Documentation

### Step 3.4.1 — Update Fixture Barrel Exports

**File:** `e2e/fixtures/index.ts`

Ensure all new/modified exports are in the barrel:
- Any new constant exports (cookie names, API routes)
- Any new helper methods (e.g., `getEmailCount`)

### Step 3.4.2 — Update E2E README

**File:** `e2e/README.md`

If any patterns changed (new constants, new helpers), update the README to reflect current architecture.

### Step 3.4.3 — Update E2E Instructions

**File:** `.github/instructions/e2e.instructions.md`

If any new patterns were established (e.g., API seeder for cleanup, email count assertion), add them to the instructions.

### Deliverable

- All barrel exports current
- README matches implementation
- Instructions match patterns

---

## Phase 3.5: GO/NO-GO Gate — Full E2E Pass

### Step 3.5.1 — Run Full E2E Suite

From the **repository root**:

```powershell
npm run test:e2e
```

**Required output:** `[PASS] All E2E tests passed!`

### Step 3.5.2 — Record Post-Cleanup Metrics

| Metric | Baseline (Phase 1) | Post-Cleanup |
|--------|-------------------|-------------|
| Total duration | _from Phase 1_ | _record_ |
| Playwright-only duration | _from Phase 1_ | _record_ |
| Total tests | _from Phase 1_ | _record_ |
| Passed | _from Phase 1_ | _should be all_ |
| Failed | _from Phase 1_ | **0** |

### Step 3.5.3 — GO/NO-GO Decision

| Condition | Status |
|-----------|--------|
| All E2E tests pass | ⬜ |
| Zero `eslint-disable` blocks (only justified `eslint-disable-next-line`) | ⬜ |
| Zero inline selectors not in `SELECTORS` | ⬜ |
| Zero inline text not in `PAGE_TEXT` | ⬜ |
| Zero hardcoded URLs/constants | ⬜ |
| TOTP cleanup is clean and documented | ⬜ |
| No conditional assertions that silently pass | ⬜ |
| Barrel exports up to date | ⬜ |
| README and instructions updated | ⬜ |

**All boxes must be checked for GO.** If any condition fails, loop back to the relevant phase step.

### Step 3.5.4 — Update Speed Optimization Research Log

Log any performance observations from the cleanup run:
- Did removing `test.slow()` from any tests reduce total time?
- Did any refactored patterns (API seeder vs. UI cleanup) speed up tests?
- What is the new per-project timing breakdown?

### Deliverable

- `[PASS] All E2E tests passed!` output captured
- GO decision achieved with all conditions met
- Post-cleanup metrics recorded
- Speed observations logged in `Implementation.md` for Phase 4

---

## Verification

- [ ] All magic strings centralized into constants
- [ ] All fragile patterns fixed or documented
- [ ] All baseline failures resolved
- [ ] Full E2E suite passes: `[PASS] All E2E tests passed!`
- [ ] Documentation updated (barrel exports, README, instructions)
- [ ] GO/NO-GO gate passed
- [ ] Speed observations logged in `Implementation.md`

---

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.
