---
description: Commerce shared library patterns and rules for SeventySixCommerce
applyTo: "**/ECommerce/seventysixcommerce-shared/src/**/*.ts"
---

# Commerce Shared Library Instructions

## Purpose

`@seventysixcommerce/shared` is the foundational library shared between the SvelteKit and TanStack commerce apps. Changes here affect BOTH consumer apps simultaneously.

## Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Language | TypeScript 5.9+ (strict mode) |
| ORM | Drizzle ORM 0.45+ (peer dependency) |
| Validation | Zod 4+ |
| Observability | OpenTelemetry API |
| Date handling | date-fns v4 |
| Build | Source-level imports (no build step — compiled by consumer apps) |

## Project Structure

```
ECommerce/seventysixcommerce-shared/src/
├── analytics/          # Analytics event tracking
├── cart/               # Cart operations (add, remove, update, clear)
├── checkout/           # Checkout flow and order creation
├── integrations/       # External API wrappers (Printful)
├── observability/      # OpenTelemetry metrics (counters, histograms)
├── schema/             # Drizzle ORM schema definitions
├── types/              # Shared TypeScript types and DB enums
├── webhook/            # Stripe webhook event processing
├── constants.ts        # Shared constants
├── date.ts             # date-fns wrapper (only file allowed to use new Date())
└── __tests__/          # Unit tests
```

## Core Rules

| Rule | Required | Forbidden |
| ---- | -------- | --------- |
| Type safety | Explicit return types on all exports | Inferred return types |
| Null checks | `=== null`, `=== undefined`, `??` | `!value`, `!!value`, `\|\| "default"` |
| Constants | Import from `./constants` | Magic numbers/strings |
| Date/time | `date-fns` via `./date.ts` | `new Date()`, `Date.now()`, `Date.parse()` in any file except `date.ts` |
| Variable naming | 3+ character names | Single-letter variables (`x`, `p`, `s`) |
| Database | Drizzle ORM query builder | Raw SQL strings |
| Validation | Zod schemas for input validation | Unvalidated inputs to database operations |

## JSDoc Requirements

Every exported function, type, interface, and constant MUST have JSDoc:

```typescript
/** Adds an item to the cart, merging quantity if the product already exists. */
export async function addToCart(db: CommerceDb, sessionId: string, productId: string, quantity: number): Promise<CartItem[]> {
```

## Dependency Rules

| Type | Packages | Notes |
| ---- | -------- | ----- |
| Direct dependencies | `date-fns`, `zod`, `@opentelemetry/api` | Installed in shared `node_modules` |
| Peer dependencies | `drizzle-orm` | Resolved from consumer app `node_modules` |
| Import resolution | Via shared-module linking | Consumer apps must run `node scripts/link-commerce-shared-node-modules.mjs --app <sveltekit\|tanstack>` before building |

## Build Verification

This library has no standalone build step — it is compiled by consumer apps. To verify:
1. Link shared module resolution to the target app: `node scripts/link-commerce-shared-node-modules.mjs --app <sveltekit|tanstack>`
2. Run the consumer app's check/build command
3. Both consumer apps MUST compile successfully

## Security Rules

| Rule | Requirement |
| ---- | ----------- |
| Error responses | Never expose raw `error.message` — throw generic errors |
| PII logging | Mask emails: `email.replace(/^(.{2}).*@/, "$1***@")` |
| Input validation | Validate all inputs with Zod before database operations |
| SQL injection | Use Drizzle ORM query builder exclusively — no raw SQL |
| Transaction safety | Use `db.transaction()` for multi-step operations |

## Testing

- Unit tests use Vitest in `__tests__/` directories
- Test files: `*.test.ts`
- Mock external dependencies (database, external APIs)
- Never call real APIs or databases in tests