---
agent: agent
description: Generate E2E tests using Playwright following SeventySix patterns
---

# Generate E2E Test

Create E2E tests using Playwright for SeventySix application.

## MCP Tools

- Use **context7** to fetch up-to-date Playwright API docs before generating test code
- Use **playwright** MCP for browser automation debugging if tests need troubleshooting
- Use **chrome-devtools** MCP for live DOM inspection, network analysis, and performance tracing during test development

## Test Category Selection (REQUIRED)

Ask user which category this test belongs to:

| Category      | Location                   | Auth State     | Use Case                     |
| ------------- | -------------------------- | -------------- | ---------------------------- |
| public        | `e2e/specs/public/`        | None           | Unauthenticated flows        |
| authenticated | `e2e/specs/authenticated/` | User role      | General authenticated access |
| admin         | `e2e/specs/admin/`         | Admin role     | Admin-only features          |
| developer     | `e2e/specs/developer/`     | Developer role | Developer tools/features     |

## E2E Structure

```

SeventySix.Client/e2e/
├── global-setup.ts # Creates auth states before all tests
├── fixtures/
│ ├── index.ts # Barrel export - ALWAYS import from here
│ ├── auth.fixture.ts # Role-based authenticated pages
│ ├── fresh-login.fixture.ts # For destructive auth tests (logout)
│ ├── unauthenticated.fixture.ts
│ ├── page-helpers.fixture.ts # Page helper fixtures
│ ├── pages/ # Page Object Model classes
│ │ ├── index.ts
│ │ ├── auth.page.ts
│ │ ├── home.page.ts
│ │ └── admin-dashboard.page.ts
│ ├── selectors.constant.ts # Centralized CSS selectors
│ ├── routes.constant.ts # Application routes
│ ├── page-text.constant.ts # UI text constants
│ ├── timeouts.constant.ts # Timeout values
│ ├── test-users.constant.ts # Seeded test user credentials
│ └── assertions.helper.ts # Custom assertion helpers
└── specs/
├── public/ # No auth required
├── authenticated/ # User role auth
├── admin/ # Admin role auth
└── developer/ # Developer role auth

```

## Import Rules (CRITICAL)

**ALWAYS** import from barrel export:

```typescript
import { test, expect, SELECTORS, ROUTES, PAGE_TEXT, TIMEOUTS } from "../../fixtures";
```

**NEVER** import from individual fixture files directly.

## Spec File Template

```typescript
import {
    test,
    expect,
    ROUTES,
    PAGE_TEXT,
    SELECTORS
} from "../../fixtures";

/**
 * E2E Tests for {{Feature}}
 *
 * Priority: P0 (Critical Path) | P1 (Important) | P2 (Enhancement)
 * Brief description of what this test suite covers.
 */
test.describe("{{Feature Name}}",
    () =>
    {
        test.beforeEach(
            async ({ page }) =>
            {
                await page.goto(ROUTES.{{route}});
            });

        test.describe("Page Structure",
            () =>
            {
                test("should display {{element}}",
                    async ({ page }) =>
                    {
                        await expect(page.locator(SELECTORS.{{selector}}))
                            .toBeVisible();
                    });
            });

        test.describe("User Interactions",
            () =>
            {
                test("should {{action}} when {{trigger}}",
                    async ({ page }) =>
                    {
                        // Arrange - setup any preconditions
                        // Act - perform the action
                        // Assert - verify the result
                    });
            });
    });
```

## Using Page Helpers

Page helpers encapsulate common interactions:

```typescript
test("should submit login form", async ({ authPage }) => {
	// Injected via fixture
	await authPage.login("username", "password");
	await expect(authPage.snackbar).toBeVisible();
});

test("should navigate to feature", async ({ homePage }) => {
	await homePage.clickFeatureCard("Feature Name");
});
```

## Creating New Page Helper

Location: `e2e/fixtures/pages/{{name}}.page.ts`

```typescript
// <copyright file="{{name}}.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * {{Name}} page helper for {{description}}.
 * Encapsulates common {{feature}} page operations.
 */
export class {{Name}}PageHelper
{
    readonly page: Page;
    readonly heading: Locator;
    readonly submitButton: Locator;

    /**
     * Creates {{name}} page helper.
     * @param page
     * Playwright page instance.
     */
    constructor(page: Page)
    {
        this.page = page;
        this.heading = page.locator(SELECTORS.layout.pageHeading);
        this.submitButton = page.locator(SELECTORS.form.submitButton);
    }

    /**
     * Performs {{action}}.
     * @param param
     * Description of parameter.
     */
    async doAction(param: string): Promise<void>
    {
        await this.page.locator(`[data-testid="${param}"]`).click();
    }
}
```

Then add to:

1. `e2e/fixtures/pages/index.ts` - barrel export
2. `e2e/fixtures/page-helpers.fixture.ts` - fixture registration

## Adding Selectors

Location: `e2e/fixtures/selectors.constant.ts`

```typescript
export const SELECTORS =
    {
        // Group by feature area
        {{feature}}:
            {
                button: "[data-testid='{{feature}}-button']",
                input: "#{{feature}}Input",
                list: ".{{feature}}-list"
            },
    } as const;
```

**Prefer** `data-testid` attributes for test stability.

## Adding Routes

Location: `e2e/fixtures/routes.constant.ts`

```typescript
export const ROUTES =
    {
        {{feature}}:
            {
                list: "/{{feature}}",
                detail: "/{{feature}}/:id",
                create: "/{{feature}}/new"
            },
    } as const;
```

## Adding Page Text

Location: `e2e/fixtures/page-text.constant.ts`

```typescript
export const PAGE_TEXT =
    {
        headings:
            {
                {{feature}}: "{{Feature Title}}"
            },
        buttons:
            {
                {{action}}: "{{Button Text}}"
            },
        messages:
            {
                {{feature}}Success: "{{Success message}}"
            },
    } as const;
```

## Test Patterns

### Authenticated Test with Page Helper

```typescript
test("admin can access dashboard", async ({ adminDashboardPage }) => {
	await expect(adminDashboardPage.toolbarHeading).toHaveText(PAGE_TEXT.headings.adminDashboard);
});
```

### Testing Navigation

```typescript
test("should navigate to detail page",
    async ({ page }) =>
    {
        await page.goto(ROUTES.{{feature}}.list);
        await page.locator(SELECTORS.{{feature}}.listItem).first().click();
        await expect(page)
            .toHaveURL(/\/{{feature}}\/\d+/);
    });
```

### Testing Form Validation

```typescript
test("should show validation errors for empty form", async ({ authPage }) => {
	await authPage.submitEmpty();
	await expect(authPage.page.getByText(PAGE_TEXT.errors.required)).toBeVisible();
});
```

### Using Custom Timeouts

```typescript
import { TIMEOUTS } from "../../fixtures";

test("should wait for API response", async ({ page }) => {
	await page.waitForResponse((response) => response.url().includes("/api/"), { timeout: TIMEOUTS.api });
});
```

### Fresh Login Test (Destructive Auth)

Use `freshLoginTest` for tests that modify authentication state:

```typescript
import { freshLoginTest } from "../../fixtures";

freshLoginTest.describe("Logout Flow", () => {
	freshLoginTest("should log out and redirect to login", async ({ userPage }) => {
		// userPage has fresh login, safe to log out
	});
});
```

## Formatting Rules

- New line after every `=` with indented value
- Callback functions on new line after `(`
- Each param on new line when 2+ params
- Descriptive variable names (3+ chars): `page`, `authPage`, `response`

## Test Naming Convention

```typescript
test("should {expected behavior} when {condition/trigger}");
```

Examples:

- `should display login heading`
- `should redirect to home when login succeeds`
- `should show error when password is invalid`

## Priority Classification

| Priority | Description                   | Examples                     |
| -------- | ----------------------------- | ---------------------------- |
| P0       | Critical path, blocks release | Login, core navigation       |
| P1       | Important functionality       | CRUD operations, role access |
| P2       | Nice to have, enhancement     | UI polish, edge cases        |

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific category
npx playwright test --project=public
npx playwright test --project=admin

# Run specific spec file
npx playwright test e2e/specs/public/login.spec.ts

# Debug mode with browser visible
npx playwright test --headed --debug
```
