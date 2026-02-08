````instructions
---
description: E2E testing rules for Playwright tests
applyTo: "**/SeventySix.Client/e2e/**/*.ts"
---

# E2E Testing (Playwright)

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

| ❌ NEVER | ✅ ALWAYS |
|----------|-----------|
| `page.waitForTimeout(1000)` | `page.waitForLoadState("load")` |
| `page.locator(".row:nth-child(2)")` | `page.locator("[data-testid='user-row']")` |
| `await page.waitForNavigation()` | `await expect(page).toHaveURL(/pattern/)` |
| Hardcoded strings | `PAGE_TEXT.headings.title` |
| Test order dependencies | Each test fully independent |
| `TIMEOUTS.api` after full navigation | `TIMEOUTS.navigation` for post-navigation + auth checks |

## CI Compatibility (CRITICAL)

| Rule | Pattern |
|------|---------|
| Retries | `retries: process.env.CI ? 2 : 0` |
| Workers | `workers: process.env.CI ? 2 : undefined` |
| Post-navigation asserts | Use `TIMEOUTS.navigation` (15s), not `TIMEOUTS.api` (10s) |
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
        await this.page.waitForLoadState("load");
        await expect(this.dataTable).toBeVisible();
    }
}
```

## Test Isolation

```typescript
// ✅ Unique test data
const uniqueEmail = `e2e_test_${Date.now()}@test.local`;

// ✅ Filter by test prefix
await page.locator("[data-testid='search']").fill("e2e_");
```

## ⚠️ COMPLETION REQUIREMENT (MANDATORY)

> **NEVER claim implementation is complete without running `npm run test:e2e`.**
>
> You MUST:
> 1. Execute `npm run test:e2e` in the terminal
> 2. Wait for full test suite to complete
> 3. See `[PASS] All E2E tests passed!` in output
> 4. Fix ANY failures before claiming completion
>
> Stating "tests will pass when infrastructure runs" is **UNACCEPTABLE**.
> The E2E script handles its own Docker infrastructure.


````
