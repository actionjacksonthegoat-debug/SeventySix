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
- Use **playwright** MCP for fine-tuning selectors interactively when the E2E environment is alive

## E2E Debugging Workflow

1. Run failing test with keepalive: `npm run test:e2e -- --keepalive specs/failing-test.spec.ts`
2. Environment stays alive at `https://localhost:4201`
3. Use Playwright CLI or Playwright MCP to iterate on selectors and flows
4. When done: `docker compose -f docker-compose.e2e.yml down -v --remove-orphans`

> **Note**: E2E and Load Tests run in their own isolated Docker environments. You do NOT need to start dev environments for either.

## Test Category Selection (REQUIRED)

Ask user which category this test belongs to:

| Category      | Location                   | Auth State     | Use Case                     |
| ------------- | -------------------------- | -------------- | ---------------------------- |
| public        | `e2e/specs/public/`        | None           | Unauthenticated flows        |
| authenticated | `e2e/specs/authenticated/` | User role      | General authenticated access |
| admin         | `e2e/specs/admin/`         | Admin role     | Admin-only features          |
| developer     | `e2e/specs/developer/`     | Developer role | Developer tools/features     |
| home          | `e2e/specs/home/`          | User role      | Landing/home page features   |

## E2E Structure

```

SeventySix.Client/e2e/
├── global-setup.ts                  # Creates auth states before all tests
├── fixtures/
│   ├── index.ts                     # Barrel export - ALWAYS import from here
│   ├── diagnostics.fixture.ts       # Auto-failure diagnostics (photos, console, network)
│   ├── auth.fixture.ts              # Role-based authenticated pages
│   ├── fresh-login.fixture.ts       # For destructive auth tests (logout)
│   ├── unauthenticated.fixture.ts
│   ├── page-helpers.fixture.ts      # Page helper fixtures
│   ├── helpers/
│   │   ├── scroll.helper.ts         # scrollUntilVisible, triggerAllDeferBlocks
│   │   └── user-create.helper.ts    # fillUserCreateStepper
│   ├── pages/                       # Page Object Model classes
│   │   ├── index.ts
│   │   ├── auth.page.ts
│   │   ├── home.page.ts
│   │   └── admin-dashboard.page.ts
│   ├── selectors.constant.ts        # Centralized CSS selectors
│   ├── routes.constant.ts           # Application routes
│   ├── page-text.constant.ts        # UI text constants
│   ├── timeouts.constant.ts         # Timeout values
│   ├── test-users.constant.ts       # Seeded test user credentials
│   └── assertions.helper.ts         # Custom assertion helpers
└── specs/
    ├── public/                      # No auth required
    ├── authenticated/               # User role auth
    ├── admin/                       # Admin role auth
    ├── developer/                   # Developer role auth
    └── home/                        # Home/landing page (User role)

```

> **Auto-Failure Diagnostics**: Every test automatically captures a screenshot, current URL, console errors, and failed network requests on failure. These appear in the reporter output. No extra code needed — it's injected via `diagnostics.fixture.ts`.

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

freshLoginTest.describe("Logout Flow", () =>
{
    freshLoginTest("should log out and redirect to login", async ({ userPage }) =>
    {
        // userPage has fresh login, safe to log out
    });
});
```

### Isolated Fresh Context (Approve/Reject as Different User)

Use `loginInFreshContext` when a test step must run as a **different user** while the main test page remains active:

```typescript
import { test, loginInFreshContext, ISOLATED_USER } from "../../fixtures";

test("should approve request",
    async ({ userPage, browser }) =>
    {
        // 2 logins + isolated context creation
        test.setTimeout(90_000);

        // ... userPage performs setup actions ...

        const { page: adminPage, context: adminContext } =
            await loginInFreshContext(browser, ISOLATED_USER);
        try
        {
            // ... adminPage performs state-changing action ...
        }
        finally
        {
            await adminContext.close();
        }
    });
```

### Multi-Step Test Timeouts

Add `test.setTimeout()` with a comment when a test has multiple sequential steps:

```typescript
test("should complete wizard",
    async ({ adminPage }) =>
    {
        // 4-step stepper + API validation + search verification
        test.setTimeout(60_000);
        // ...
    });
```

| Scenario | Timeout |
|----------|---------|
| Default single-flow | 45s (no override needed) |
| Multi-step wizard/stepper | 60s |
| 2+ logins or ALTCHA solves | 90s |

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
