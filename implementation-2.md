# Implementation 2 — Phase 2: Code Smell Audit & Tooling Evaluation

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.

---

## Objective

Perform a comprehensive audit of all E2E test code against `.github/instructions/e2e.instructions.md` standards and Playwright best practices. Evaluate MailDev and tooling alternatives. Produce a prioritized remediation list for Phase 3.

---

## Phase 2.1: Magic Strings Audit

### Step 2.1.1 — Inline Selectors Not in `SELECTORS`

Search every spec file for locator strings that are not imported from `SELECTORS`:

```powershell
cd SeventySix.Client
# Find all locator/selector strings in spec files that don't reference SELECTORS
npx grep -rn "page\.locator(" e2e/specs/ | Select-String -NotMatch "SELECTORS"
```

**Known instances to verify (~25):**

| File | Selector | Action |
|------|----------|--------|
| `login.spec.ts` | `"[role='alert'], .error-message, mat-error"` | Add to `SELECTORS.form.errorMessage` |
| `sandbox.spec.ts` | `"mat-card-content"` | Add to `SELECTORS.sandbox.cardContent` |
| `change-password.spec.ts` | `"#newPassword-hint"` | Add to `SELECTORS.changePassword.passwordHint` |
| `totp-setup.spec.ts` | `"button.link-button"` with `"Can't scan"` | Add to `SELECTORS.totpSetup.cantScanButton` |
| `totp-setup.spec.ts` | `"button"` with `"I've scanned the code"` | Add to `SELECTORS.totpSetup.scannedCodeButton` |
| `totp-setup.spec.ts` | `"button"` with `"Verify & Enable"` | Add to `SELECTORS.totpSetup.verifyEnableButton` |
| `user-management.spec.ts` | `"input[matinput]"` (×3) | Add to `SELECTORS.dataTable.searchInput` |
| `user-management.spec.ts` | `"mat-chip-option"` (×3) | Add to `SELECTORS.dataTable.chipOption` |
| `log-management.spec.ts` | `"input[matinput]"` (×2) | Reuse `SELECTORS.dataTable.searchInput` |
| `log-management.spec.ts` | `"mat-chip-option"` (×2) | Reuse `SELECTORS.dataTable.chipOption` |
| `log-management.spec.ts` | `".log-detail-dialog"` | Add to `SELECTORS.logManagement.detailDialog` |
| `log-management.spec.ts` | `".message-content"` | Add to `SELECTORS.logManagement.messageContent` |
| `log-management.spec.ts` | `"button[aria-label*='Close']"` | Add to `SELECTORS.dialog.closeButton` |
| `user-create.spec.ts` | `".mat-step-header"` | Add to `SELECTORS.stepper.stepHeader` |
| `permission-request-list.spec.ts` | `"button[aria-label='Row actions']"` (×4) | Add to `SELECTORS.dataTable.rowActionsButton` |
| `permission-request-list.spec.ts` | `"button.mat-mdc-menu-item"` | Add to `SELECTORS.menu.menuItem` |
| `permission-request-list.spec.ts` | `"button.mat-mdc-menu-item.warn-action"` | Add to `SELECTORS.menu.warnMenuItem` |
| `profile.spec.ts` | `"mat-error"` | Add to `SELECTORS.form.matError` |
| `accessibility.spec.ts` (admin) | `"table[mat-table]"`, `"th[mat-header-cell]"`, `"button[mat-icon-button]"` | Add to `SELECTORS.accessibility.*` or `SELECTORS.dataTable.table` |
| `style-guide.spec.ts` | `"mat-select[aria-label='...']"`, `"mat-tab-group"`, `".mat-mdc-tab:has-text('Colors')"` | Add to `SELECTORS.developer.*` |

### Step 2.1.2 — Inline Text Not in `PAGE_TEXT`

| File | String | Action |
|------|--------|--------|
| `set-password.spec.ts` | `"Return to Login"` | Add to `PAGE_TEXT.links.returnToLogin` |
| `change-password.spec.ts` | `"8 characters"` | Add to `PAGE_TEXT.validation.minimumCharacters` |
| `log-management.spec.ts` | `"Warnings"`, `"Errors"` | Add to `PAGE_TEXT.filters.*` |
| `user-detail.spec.ts` | `"User updated successfully"` | Add to `PAGE_TEXT.confirmation.userUpdated` |
| `request-permissions.spec.ts` | `"Permission request submitted"` | Add to `PAGE_TEXT.confirmation.permissionRequestSubmitted` |

### Step 2.1.3 — Hardcoded Constants

| File | Value | Action |
|------|-------|--------|
| `email.fixture.ts` | `"http://localhost:1080"` | Replace with `E2E_CONFIG.mailDevUrl` |
| `login.spec.ts` | `"X-Refresh-Token"` (×2) | Add to `E2E_CONFIG.cookies.refreshToken` or constants |
| `register.spec.ts` | `/complete?token=` suffix | Add `ROUTES.auth.registerComplete` |
| `forced-password-change.spec.ts` | `"/api/v1/auth/trusted-devices"` | Add to an `API_ROUTES` constant |

### Deliverable

- Complete inventory of every magic string with its remediation action
- Grouped by constant file where the fix belongs

---

## Phase 2.2: Fragile Pattern Audit

### Step 2.2.1 — TOTP Cleanup Analysis (HIGH)

**File:** `e2e/specs/authenticated/totp-setup.spec.ts` (lines 203–297)

Analyze the 95-line cleanup block:
- 5 `eslint-disable` suppressions
- 35-second TOTP code rotation polling
- Re-authentication via API with raw cookie headers
- Multiple conditional early returns

**Evaluate:** Can this be replaced with an API seeder endpoint that resets TOTP enrollment for a test user? Check if `E2ESeeder` in the server has any TOTP management capability.

### Step 2.2.2 — TOTP beforeEach Retry Loop (MEDIUM)

**File:** `e2e/specs/authenticated/totp-setup.spec.ts` (lines 43–67)

Manual retry loop (`maxAttempts = 2`) in `beforeEach`. Should be replaced with either:
- Playwright's built-in `retries` configuration
- More robust API-level cleanup between tests

### Step 2.2.3 — Conditional Assertions (MEDIUM)

**OAuth test:** `e2e/specs/public/oauth-login.spec.ts` (lines 102–108)
- Conditional expect with `eslint-disable` — if redirect not captured, test passes without verifying anything
- **Decision needed:** Remove conditional and make deterministic, or document as known limitation

**Cross-tab logout:** `e2e/specs/authenticated/logout.spec.ts` (lines 349–360)
- Accommodates two possible server behaviors
- **Decision needed:** Split into two tests with explicit conditions, or accept dual behavior

### Step 2.2.4 — Negative Email Assertion (MEDIUM)

**File:** `e2e/specs/public/forgot-password.spec.ts` (lines 325–342)
- `try/catch` to assert no email was sent
- Relies on `TIMEOUTS.negativeTest` (3s) — if MailDev is slow, could false-pass
- **Evaluate:** Is there a better pattern? Could MailDev's API return message count for comparison?

### Step 2.2.5 — User-Create Search Fallback (LOW)

**File:** `e2e/specs/admin/user-create.spec.ts` (lines 250–254)
- Conditional `isVisible()` check with `eslint-disable` — skips search if element not visible
- Should use `await expect(locator).toBeVisible()` with proper wait

### Step 2.2.6 — eslint-disable Audit

Grep all `eslint-disable` comments in E2E code:

```powershell
Select-String -Path "SeventySix.Client/e2e/**/*.ts" -Pattern "eslint-disable" -Recurse
```

For each suppression, determine if it can be removed by fixing the underlying issue.

### Deliverable

- Severity-ranked list of all fragile patterns
- Recommended fix for each
- Binary decision (fix/accept) for each conditional assertion

---

## Phase 2.3: MailDev Evaluation

### Step 2.3.1 — Current MailDev Usage Assessment

MailDev is used for:
1. Registration email verification (`register.spec.ts`)
2. Password reset email (`forgot-password.spec.ts`)
3. Negative email assertions (no email sent)

**Current implementation quality:**
- `EmailTestHelper` class with polling-based wait
- REST API integration (`/email`, `/email/all`)
- Link extraction via regex on HTML body
- One hardcoded URL bug (should use `E2E_CONFIG.mailDevUrl`)

### Step 2.3.2 — MailDev vs. Alternatives

| Tool | Pros | Cons | Verdict |
|------|------|------|---------|
| **MailDev** (current) | Simple Docker image, REST API, Web UI for debugging, well-understood | Polling-based (no webhooks), maintenance unknown | **Keep** |
| **Mailpit** | Active maintenance, REST API, faster, supports webhooks | Migration effort, new Docker image | Evaluate if MailDev becomes unmaintained |
| **MailHog** | Popular, REST API | Archived/unmaintained | **No** |
| **Ethereal (nodemailer)** | No Docker needed | Cloud-only, latency, no self-hosted | **No** |
| **smtp4dev** | .NET native, good tooling | Heavier, less common in E2E setups | **No** |

**Recommendation:** Keep MailDev. It works well, has minimal issues (one hardcoded URL), and the `EmailTestHelper` abstraction means switching later is trivial — only the fixture file changes.

### Step 2.3.3 — MailDev Improvements

1. Fix hardcoded URL → use `E2E_CONFIG.mailDevUrl`
2. Consider adding `getEmailCount()` method for better negative assertions
3. Add JSDoc to all `EmailTestHelper` methods (if missing)

### Deliverable

- MailDev evaluation complete with recommendation
- Improvement list for email fixture

---

## Phase 2.4: Playwright MCP Evaluation

### Step 2.4.1 — Should We Add Playwright MCP?

Per `.github/instructions/e2e.instructions.md`:
> **Always use Playwright CLI for running and debugging E2E tests — never use a Playwright MCP**

The E2E instructions explicitly prohibit Playwright MCP for test running. However, Chrome DevTools MCP is recommended for **debugging** failing tests:
> When E2E tests fail, use Chrome DevTools MCP to diagnose — `list_console_messages` for JS errors, `list_network_requests` for API failures, `take_screenshot` for visual state.

**Recommendation:** Do NOT add Playwright MCP. Use Chrome DevTools MCP for debugging when tests fail in headed mode. The existing Playwright CLI + `--debug` flag + trace viewer cover all debugging needs.

### Deliverable

- Playwright MCP evaluation complete
- Decision documented: Use Chrome DevTools MCP for debugging, not Playwright MCP

---

## Phase 2.5: `test.slow()` Audit

### Step 2.5.1 — Catalog All `test.slow()` Usage

Search all spec files:

```powershell
Select-String -Path "SeventySix.Client/e2e/**/*.ts" -Pattern "test\.slow\(\)" -Recurse
```

For each occurrence, evaluate:
1. Is the test genuinely slow due to multi-step flow? (Keep `test.slow()`)
2. Is it slow due to poor waits or unnecessary steps? (Fix and remove `test.slow()`)
3. Could the test be split into smaller, faster tests?

### Deliverable

- Table of all `test.slow()` usages with keep/remove decision
- Removal candidates flagged for Phase 3

---

## Phase 2.6: Compile Remediation Plan

### Step 2.6.1 — Prioritized Fix List for Phase 3

Create a ranked list of all fixes needed, organized by:

1. **P1 (Must Fix)** — Test failures, security issues, broken patterns
2. **P2 (Should Fix)** — Code smells that degrade maintainability
3. **P3 (Nice to Have)** — Minor improvements, documentation

Each item must include:
- File path
- Line number(s)
- Current code (brief)
- Proposed fix (brief)
- Risk level of the change

### Step 2.6.2 — Update Speed Optimization Research Log

Add any performance-relevant findings to `Implementation.md`'s Speed Optimization Research Log.

### Deliverable

- Complete remediation plan ready for Phase 3 execution
- Speed observations logged in orchestrator

---

## Verification

- [ ] Every spec file audited for magic strings
- [ ] Every fixture file audited for hardcoded values
- [ ] All fragile patterns cataloged with severity and fix recommendation
- [ ] MailDev evaluation complete with keep/switch decision
- [ ] Playwright MCP evaluation complete
- [ ] `test.slow()` audit complete
- [ ] `eslint-disable` audit complete
- [ ] Prioritized remediation list produced for Phase 3
- [ ] Speed observations logged in `Implementation.md`

---

> **⚠️ CRITICAL: ALL 4 TEST SUITES MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS.**
> If infrastructure is not running, **start it**. Never claim "done" without all 4 passing.
