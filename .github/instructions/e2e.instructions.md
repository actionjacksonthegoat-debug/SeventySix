````instructions
---
description: E2E testing rules for Playwright tests
applyTo: "**/SeventySix.Client/e2e/**/*.ts"
---

# E2E Testing (Playwright)

## E2E Environment Isolation (CRITICAL)

E2E tests run in a **fully isolated Docker environment** (`docker-compose.e2e.yml`). You do NOT need to start the dev environment (`npm start`) for E2E tests.

> Port mapping: see `copilot-instructions.md` → "E2E and Load Test Environment Isolation".

<!-- original port table removed (single source of truth is copilot-instructions.md) -->

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
| home | User | `specs/home/` |

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

## Auto-Failure Diagnostics (Built-In)

Every test automatically captures failure context via `diagnostics.fixture.ts`. On failure, the test attaches:

| Attachment | Content |
|------------|--------|
| `failure-screenshot` | PNG screenshot at failure moment |
| `failure-url` | The current page URL |
| `failure-console-errors` | All `console.error()` messages captured during test |
| `failure-network-errors` | All failed network requests (4xx/5xx + request failures) |

The enhanced `concise-reporter.ts` reads these attachments and prints verbose diagnostics for **failures only** — passing tests show single-line output.

**No action required** — this fixture is injected via `page-helpers.fixture.ts` → `diagnostics.fixture.ts` → `@playwright/test`. Automatic for ALL tests.

## Fixture Chain

```
@playwright/test
  └── diagnostics.fixture.ts    (auto-failure screenshots, console, network)
       └── page-helpers.fixture.ts (AuthPageHelper, HomePageHelper, etc.)
            └── auth.fixture.ts           (userPage, adminPage, developerPage)
            └── unauthenticated.fixture.ts (unauthenticatedPage)
            └── fresh-login.fixture.ts     (freshLoginTest)
```

When creating new fixtures, extend `page-helpers.fixture.ts` (or `diagnostics.fixture.ts` if page helpers aren't needed).

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
| `test.setTimeout()` without comment | Always add a comment: `// 2 logins + ALTCHA + MFA verify` |

**Exception**: `waitForTimeout(≥10ms)` is acceptable ONLY for IntersectionObserver scroll timing where no observable state change exists to await (e.g., `@defer` block trigger via scroll).

### Multi-Step Test Timeouts

Tests with multiple sequential user flows (login + MFA + stepper + verify) need explicit timeouts. Use `test.setTimeout()` with a comment explaining the flow:

```typescript
test("should complete multi-step flow",
    async ({ adminPage }) =>
    {
        // 4-step stepper + API validation + search verification
        test.setTimeout(60_000);
        // ...
    });
```

**Guideline**: Default timeout (45s) covers most single-flow tests. Add explicit timeouts for:
- Tests with 2+ ALTCHA solves (90s)
- Tests with multi-step wizard/stepper (60s)
- Tests creating isolated contexts + login (90s)

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
const { page: isolatedPage, context: isolatedContext } =
    await loginInFreshContext(browser, PERM_APPROVE_USER);
try
{
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

Always use Playwright CLI — never Playwright MCP — for running tests.

```bash
npx playwright test                                           # all tests
npx playwright test specs/auth/login.spec.ts                 # single spec
npx playwright test --grep "login" --last-failed --headed    # filter / debug
npm run test:e2e -- --keepalive specs/auth/login.spec.ts     # keep env alive
```

## MCP Tools for E2E Debugging

When tests fail: Chrome DevTools MCP (`list_console_messages`, `list_network_requests`, `take_screenshot`). Playwright MCP for interactive selector debugging with `--keepalive`. See `copilot-instructions.md` for details.



````
