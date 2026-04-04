# SeventySixCommerce Shared Library

Framework-agnostic commerce utilities shared between the [ECommerce-Svelte](../seventysixcommerce-sveltekit/README.md) and [ECommerce-TanStack](../seventysixcommerce-tanstack/README.md) storefronts.

## Ecosystem Context

This library is part of the [SeventySix](../../README.md) Ecosystem. Both ECommerce storefronts delegate core business logic here rather than duplicating code. Framework-specific wrapping (middleware, HTTP responses, routing) stays in each app — shared logic lives here.

| Sibling Project | Path |
|----------------|------|
| ECommerce-Svelte | [`../seventysixcommerce-sveltekit/`](../seventysixcommerce-sveltekit/README.md) |
| ECommerce-TanStack | [`../seventysixcommerce-tanstack/`](../seventysixcommerce-tanstack/README.md) |

## What's Inside

| Export | Import Path | Purpose |
|--------|------------|---------|
| Analytics | `@seventysixcommerce/shared/analytics` | GA4 tracking, consent management, ecommerce events |
| Cart | `@seventysixcommerce/shared/cart` | Cart session CRUD (add, remove, get items) |
| Checkout | `@seventysixcommerce/shared/checkout` | Stripe line items, shipping options, checkout snapshots |
| Constants | `@seventysixcommerce/shared/constants` | Shared business constants (cookies, thresholds, URLs) |
| Integrations | `@seventysixcommerce/shared/integrations` | Stripe, Printful, Brevo client factories |
| Schema | `@seventysixcommerce/shared/schema` | Drizzle ORM table definitions (products, orders, variants) |
| Types | `@seventysixcommerce/shared/types` | Shared TypeScript interfaces (cart, order, fulfillment) |
| Observability | `@seventysixcommerce/shared/observability` | Log forwarding, OpenTelemetry metrics |
| Webhook | `@seventysixcommerce/shared/webhook` | Checkout completion, order creation, fulfillment callbacks |
| Date | `@seventysixcommerce/shared/date` | Date utility functions |

## Development

```bash
# From repo root — link shared module to a commerce app's node_modules
node scripts/link-commerce-shared-node-modules.mjs --app sveltekit
node scripts/link-commerce-shared-node-modules.mjs --app tanstack

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format (ESLint → dprint → ESLint)
npm run format
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@opentelemetry/api` | Observability instrumentation |
| `date-fns` | Date utilities |
| `zod` | Runtime schema validation |
| `drizzle-orm` (peer) | Database ORM — provided by consuming apps |

## Key Design Decisions

- **Framework-agnostic**: No SvelteKit or React imports. Pure TypeScript functions and types.
- **Database-first**: Drizzle ORM schema is the source of truth for both storefronts' databases.
- **Idempotent webhooks**: `isOrderProcessed()` prevents duplicate order creation from Stripe webhook retries.
- **Shared integrations**: Single Stripe, Printful, and Brevo client factory — no per-app duplication.