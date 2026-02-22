````instructions
---
description: E2E testing rules for Playwright tests
applyTo: "**/SeventySix.Client/e2e/**/*.ts"
---

# E2E Testing (Playwright)

## E2E Environment Isolation (CRITICAL)

E2E tests run in a **fully isolated Docker environment** (`docker-compose.e2e.yml`). You do NOT need to start the dev environment (`npm start`) for E2E tests. The E2E script handles all infrastructure automatically.

| Environment | Docker Compose File | Ports (DB / Cache / API / Client) |
|-------------|--------------------|-----------------------------|
| Dev | `docker-compose.yml` | 5433 / 6379 / 7074 / 4200 |
| E2E | `docker-compose.e2e.yml` | 5434 / 6380 / 7174 / 4201 |
| Load Test | `docker-compose.loadtest.yml` | 5435 / 6381 / 7175 / 4202 |

## KeepAlive Mode (For Debugging)

Use `--keepalive` to keep the E2E environment running after tests complete:

```bash
# Run all E2E tests, keep environment alive
npm run test:e2e -- --keepalive

# Run a single spec with keepalive
npm run test:e2e -- --keepalive specs/auth/login.spec.ts

# Run by grep with keepalive
npm run test:e2e -- --keepalive --grep "should display login form"

# Manual cleanup when done
docker compose -f docker-compose.e2e.yml down -v --remove-orphans
```

With the environment alive, use Playwright MCP or Playwright CLI to fine-tune tests interactively against `https://localhost:4201`.

## Import Rule (CRITICAL)

```typescript
//  ALWAYS import from barrel
import { test, expect, ROUTES, SELECTORS } from "../../fixtures";

//  NEVER import from individual files
```

## Test Categories

| Category | Auth | Location |
|----------|------|----------|
| public | None | `specs/public/` |
| authenticated | User | `specs/authenticated/` |
| admin | Admin | `specs/admin/` |
| developer | Developer | `specs/developer/` |

## Spec Pattern

```typescript
test.describe("{{Feature}}",
    () =>
    {
        test.beforeEach(
            async ({ page }) =>
            {
                await page.goto(ROUTES.{{route}});
            });

        test("should {{behavior}} when {{condition}}",
            async ({ page }) =>
            {
                await expect(page.locator(SELECTORS.{{selector}}))
                    .toBeVisible();
            });
    });
```

## Accessibility (axe-core)

```typescript
import AxeBuilder from "@axe-core/playwright";

const axeResults =
	await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();

const criticalViolations =
	axeResults.violations.filter(
		(violation) =>
			violation.impact === "critical"
				|| violation.impact === "serious");

expect(criticalViolations).toHaveLength(0);
```

## Adding Fixtures

1. Add to constant file in `fixtures/`
2. Export via `fixtures/index.ts`
3. Use `data-testid` for selectors

## Anti-Flake Rules (CRITICAL)

| [NEVER] | [ALWAYS] |
|----------|-----------|
| `page.waitForTimeout(N)` | `await expect(locator).toBeVisible()` or state-based wait |
| `page.waitForLoadState("load")` | `await expect(page.locator(firstElement)).toBeVisible()` — wait for specific element |
| `page.locator(".row:nth-child(2)")` | `page.locator("[data-testid='user-row']")` |
| `await page.waitForNavigation()` | `await expect(page).toHaveURL(/pattern/)` |
| Hardcoded strings | `PAGE_TEXT.headings.title` |
| Test order dependencies | Each test fully independent |
| `test.slow()` | Fix the root cause or use explicit `timeout` on the assertion |
| Save original → test → restore | Create dedicated test data instead |
| `toHaveCount(expect.any(Number))` | `toHaveCount(exactInt)` or `expect(locator.first()).toBeVisible()` |
| `waitForResponse` after trigger | Set up `waitForResponse` listener BEFORE the action that triggers it |
| Chip/tab selection by `.nth(N)` | `.filter({ hasText: /label/i })` or `aria-selected` attribute |

**Exception**: `waitForTimeout(≤100ms)` is acceptable ONLY for IntersectionObserver scroll timing where no observable state change exists to await (e.g., `@defer` block trigger via scroll).

## CI Compatibility (CRITICAL)

| Rule | Pattern |
|------|---------|
| Retries | `retries: process.env.CI ? 1 : 0` |
| Workers | `workers: process.env.CI ? 4 : undefined` |
| Platform-specific paths | Guard with `process.platform` check |
| SSL certificates | Tests use self-signed certs; CI generates via `openssl` |

**Rule**: E2E tests run on `ubuntu-latest` in CI. Never assume Windows-only tools.

## Page Object Pattern

```typescript
export class UserManagementPageHelper
{
    readonly page: Page;
    readonly dataTable: Locator;
    readonly createButton: Locator;

    constructor(page: Page)
    {
        this.page = page;
        this.dataTable = page.locator(SELECTORS.userManagement.dataTable);
        this.createButton = page.locator(SELECTORS.userManagement.createButton);
    }

    async waitForTableLoad(): Promise<void>
    {
        await expect(this.dataTable).toBeVisible();
        await expect(this.dataTable.locator("mat-row").first())
            .toBeVisible();
    }
}
```

## Test Isolation (CRITICAL)

### Own Your Test Data — Never Borrow and Return

> **PROHIBITED**: Reading original data → running test → restoring original data. This "save/restore" pattern is fragile, hides real bugs, leaks state on failure, and breaks parallel execution.

```typescript
// [PROHIBITED] Save-restore anti-pattern
const originalFullName = await input.inputValue();
await input.fill("new value");
// ... test ...
await input.fill(originalFullName); // fragile cleanup

// [CORRECT] Create dedicated test data — no cleanup needed
const testFullName = `E2E Detail ${Date.now()}`;
await input.fill(testFullName);
// ... assert against testFullName — done
```

**Rule**: Every test creates its own data with a unique prefix/timestamp. If a test mutates server state, use a **dedicated isolated user** or **dedicated test entity** — never the shared `e2e_user` / `e2e_admin` data.

### Isolated Users for State-Changing Tests

> Tests that **permanently mutate state** (granting roles, enabling MFA, changing passwords, editing profiles) MUST use a **dedicated isolated user** + `browser.newContext()` — never the shared auth users.

**Why**: Shared users cause cross-test pollution. Approving a permission request grants a role permanently, breaking subsequent RBAC tests. Editing a shared user's profile affects every test in the project that reads it.

**Pattern**:
1. **Define** a dedicated `TestUser` in `test-users.constant.ts` (e.g., `PERM_APPROVE_USER`)
2. **Export** via `fixtures/index.ts` barrel
3. **Seed** in the server's `E2ETestSeeder`
4. **Use** `browser.newContext({ storageState: undefined })` + `loginAsUser()` for an isolated session

```typescript
// Reference: permission-request-list.spec.ts
const isolatedContext: BrowserContext =
    await browser.newContext({
        baseURL: E2E_CONFIG.clientBaseUrl,
        storageState: undefined,
        ignoreHTTPSErrors: true
    });
const isolatedPage: Page = await isolatedContext.newPage();
try
{
    await loginAsUser(isolatedPage, PERM_APPROVE_USER);
    // ... state-changing action (no restore needed) ...
}
finally
{
    await isolatedContext.close();
}
```

### Decision Table — When Isolation is Required

| Scenario | Isolated user? | Why |
|----------|---------------|-----|
| Approve/reject permission request | **Yes** | Permanently changes roles |
| Enable/disable MFA | **Yes** | Changes auth state |
| Change password | **Yes** | Invalidates security stamp |
| Account lockout | **Yes** | Locks the account |
| Edit user profile (name, email) | **Yes** | Mutates shared data |
| Edit admin user detail | **Yes** | Mutates shared data |
| Read-only page navigation | No | No server state change |
| Form validation (no submit) | No | No server state change |
| Fill form without saving | No | Client-side only |

## Playwright CLI (Test Running)

Always use Playwright CLI for running and debugging E2E tests — never use a Playwright MCP for test execution:

| Task | Command |
|---|---|
| Run all tests | `npx playwright test` |
| Run one spec | `npx playwright test specs/auth/login.spec.ts` |
| Run by grep | `npx playwright test --grep "login"` |
| Run failed only | `npx playwright test --last-failed` |
| List all tests | `npx playwright test --list` |
| Run one project | `npx playwright test --project=admin` |
| Minimal output | `npx playwright test --reporter=line` |
| Debug (headed) | `npx playwright test --headed --debug` |
| JSON output | `npx playwright test --reporter=json` |
| Show report | `npx playwright show-report` |
| Show trace | `npx playwright show-trace test-results/*/trace.zip` |
| Run with keepalive | `npm run test:e2e -- --keepalive` |
| Single spec + keepalive | `npm run test:e2e -- --keepalive specs/auth/login.spec.ts` |

## MCP Tools for E2E Debugging

When E2E tests fail, use these MCP servers to diagnose:

- **Chrome DevTools MCP**: `list_console_messages` for JS errors, `list_network_requests` for API failures, `take_screenshot` for visual state. See `copilot-instructions.md` Chrome DevTools section.
- **Playwright MCP**: Fine-tune selectors and debug test flows interactively when the E2E environment is running (`--keepalive`). Never use Playwright MCP for running test suites.

## Known Flaky Patterns (AVOID)

| Flaky Pattern | Why It Fails | Preferred Alternative |
|---|---|---|
| `waitForLoadState("load")` after `goto()` | Waits for browser `load` event, not Angular render | `await expect(locator).toBeVisible()` on first meaningful element |
| `waitForResponse` registered AFTER the trigger action | Response may arrive before listener is registered | Register `waitForResponse` promise BEFORE `click()`/`fill()` |
| `waitForTimeout(N)` for any `N > 0` | Arbitrary delay — too short = flaky, too long = slow | State-based wait (visibility, URL, response). Exception: ≤100ms for IntersectionObserver |
| `toHaveCount(expect.any(Number))` | Invalid Playwright API — `toHaveCount` requires exact int | `expect(locator.first()).toBeVisible()` or `toHaveCount(exactInt)` |
| Chip/tab select by `.nth(N)` | Breaks if order changes, fragile | `.filter({ hasText: /label/i })` or `[aria-selected="true"]` |
| Click table row before data loads | Row may not exist or be a skeleton | `waitForTableReady()` helper or `expect(row.first()).toBeVisible()` first |
| TOTP code near time-step boundary | Code expires before server validates | Check remaining window; regenerate if < buffer |
| ALTCHA solve not idempotent | Second solve attempt fails if first partially completed | Guard with `isVisible()` + `isChecked()` checks before solving |
| Save original → test → restore | Leaks state on failure, breaks parallel | Create dedicated test data with unique prefix/timestamp |
| `test.slow()` to mask timing issues | Hides missing waits | Fix root cause — add explicit assertion timeout |
| Cross-tab assertion via `if/else` fallback | Pass-always logic hides real failure | Deterministic assertion with retry (poll or `expect().toBeHidden()`) |
| `waitForURL` with wrong type signature | Callback receives `URL` object, not `string` | Use `(url: URL) => boolean` predicate, access `url.pathname` |


````
