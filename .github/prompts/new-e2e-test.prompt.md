---
agent: agent
description: Generate E2E tests using Playwright following SeventySix patterns
---

# Generate E2E Test

Create E2E tests using Playwright for SeventySix application.

## Tools

- Use **context7** MCP to fetch up-to-date Playwright API docs before generating test code
- Use **Playwright CLI** (`npx playwright test`) for running and debugging tests
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

## Import Rules

See `e2e.instructions.md` Import Rule — ALWAYS import from `../../fixtures` barrel.

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

Location: `e2e/fixtures/pages/{{name}}.page.ts` — follow existing page helpers as templates. Export via `e2e/fixtures/pages/index.ts` and register in `e2e/fixtures/page-helpers.fixture.ts`.

## Adding Constants

Add selectors to `selectors.constant.ts`, routes to `routes.constant.ts`, text to `page-text.constant.ts`. Prefer `data-testid` attributes for selectors.

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

## Formatting & CLI

See `formatting.instructions.md` for code style rules and `e2e.instructions.md` for Playwright CLI commands and anti-flake rules.

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

See `e2e.instructions.md` Playwright CLI section for all run/debug commands.
