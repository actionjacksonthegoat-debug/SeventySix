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


````

