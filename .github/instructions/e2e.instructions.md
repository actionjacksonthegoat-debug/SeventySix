---
description: E2E testing rules for Playwright tests
applyTo: "**/SeventySix.Client/e2e/**/*.ts"
---

# E2E Testing Instructions (Playwright)

## Structure

```
e2e/
├── global-setup.ts              # Creates auth states
├── fixtures/
│   ├── index.ts                 # Barrel export - ALWAYS import from here
│   ├── auth.fixture.ts          # Role-based page fixtures
│   ├── page-helpers.fixture.ts  # Page Object Model fixtures
│   ├── pages/                   # Page Object classes
│   ├── selectors.constant.ts    # CSS selectors
│   ├── routes.constant.ts       # App routes
│   ├── page-text.constant.ts    # UI text
│   └── timeouts.constant.ts     # Timeout values
└── specs/
    ├── public/                  # No auth
    ├── authenticated/           # User role
    ├── admin/                   # Admin role
    └── developer/               # Developer role
```

## Import Rule (CRITICAL)

```typescript
// ✅ ALWAYS import from barrel
import { test, expect, ROUTES, PAGE_TEXT, SELECTORS } from "../../fixtures";

// ❌ NEVER import from individual files
import { test } from "../../fixtures/auth.fixture";
```

## Test Categories

| Category      | Auth State | Use Case                |
| ------------- | ---------- | ----------------------- |
| public        | None       | Login, register, public |
| authenticated | User       | General user features   |
| admin         | Admin      | Admin-only features     |
| developer     | Developer  | Developer tools         |

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

## Adding Fixtures

1. Add to appropriate constant file in `fixtures/`
2. Export via `fixtures/index.ts` if new file
3. Use `data-testid` attributes for selector stability

