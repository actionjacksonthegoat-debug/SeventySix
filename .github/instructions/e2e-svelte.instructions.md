---
description: SvelteKit E2E test patterns and rules
applyTo: "**/ECommerce/seventysixcommerce-sveltekit/e2e/**/*.ts"
---

# SvelteKit E2E Instructions

## Import Rules

- Import ONLY from the barrel `../fixtures` (or `../fixtures/index`)
- NEVER import directly from individual fixture/constant files

## Anti-Flake Rules (CRITICAL)

| [NEVER] | [ALWAYS] |
| ------- | -------- |
| `page.waitForTimeout(N)` | `expect(locator).toBeVisible()` or `page.waitForURL()` |
| Hardcoded UI text in assertions | `PAGE_TEXT` constants from barrel |
| Hardcoded CSS selectors in specs | `SELECTORS` constants from barrel |
| Hardcoded route strings | `ROUTES` constants from barrel |
| `page.locator(...).nth(N)` for dynamic content | Stable `data-testid` selectors |
| Magic number timeouts | `TIMEOUTS` constants with CI multiplier |

## Fixture Chain

```
@playwright/test (base)
  └── diagnostics.fixture.ts (auto-failure: screenshot + console + network)
```

All specs use `test` from the barrel — this ensures diagnostics auto-attach on failure.

## CI Compatibility

- `retries: process.env.CI ? 1 : 0`
- `workers: process.env.CI ? 2 : undefined`
- Timeout adjustments via `TIMEOUTS` constants (1.5x in CI)
- `forbidOnly: !!process.env.CI`

## File Organization

```
e2e/
├── fixtures/
│   ├── index.ts                    (barrel — single import point)
│   ├── diagnostics.fixture.ts      (auto-failure capture)
│   ├── page-text.constant.ts       (UI text for assertions)
│   ├── routes.constant.ts          (route paths + ROUTE_GROUPS)
│   ├── selectors.constant.ts       (data-testid selectors)
│   └── timeouts.constant.ts        (CI-aware timeouts)
└── specs/
    ├── home.spec.ts
    ├── navigation.spec.ts
    ├── accessibility.spec.ts
    └── health.spec.ts
```

## Test Isolation

- E2E runs in isolated Docker environment (`docker-compose.e2e.yml`)
- Port 3011 (app), 5440 (DB) — no conflicts with dev (3001) or Angular E2E (4201)
- Each test is independent — no shared mutable state between specs

## Accessibility

- Use `@axe-core/playwright` with tags `["wcag2a", "wcag2aa", "wcag21aa"]`
- Filter for `critical` and `serious` impact violations
