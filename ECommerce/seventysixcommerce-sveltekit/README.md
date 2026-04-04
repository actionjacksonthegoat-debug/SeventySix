# SeventySixCommerce - SvelteKit

Art merchandise e-commerce storefront built with SvelteKit 2, Svelte 5, Drizzle ORM, PostgreSQL, Stripe Checkout, Printful POD fulfillment, and Brevo transactional email.

## Ecosystem Context

This is one of two satellite e-commerce sites in the [SeventySix](../../README.md) ecosystem. Both storefronts share production infrastructure (Hetzner server, Caddy reverse proxy, Cloudflare DNS) and forward application logs to the SeventySix API for centralized observability. Each site uses its own PostgreSQL database, separate from the main SeventySix database. The sister site — [SeventySixCommerce (TanStack)](../seventysixcommerce-tanstack/README.md) — provides the same feature set built with React 19 and TanStack Start.

Both sites consume the [`@seventysixcommerce/shared`](../seventysixcommerce-shared/README.md) library for framework-agnostic utilities — Drizzle ORM schema, Stripe/Printful/Brevo integrations, cart logic, analytics, and webhook handling.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | SvelteKit 2 + Svelte 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 18 + Drizzle ORM |
| Payments | Stripe Checkout (SAQ-A) |
| Fulfillment | Printful (mocked by default) |
| Email | Brevo (mocked by default) |
| Deployment | Docker (Node 22 Alpine) + Caddy |

## Quick Start

```sh
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (port 3001) |
| `npm run build` | Production build |
| `npm run check` | Svelte and TypeScript checks |
| `npm test` | Run unit and architecture tests |
| `npm run test:watch` | Watch mode tests |
| `npm run format` | ESLint -> dprint -> ESLint |
| `npm run lint` | ESLint only |
| `npm run db:up` | Start dev PostgreSQL |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:seed` | Seed product data |
| `npm run db:studio` | Open Drizzle Studio |

## Architecture

- Routes: SvelteKit file-based routing with form actions (progressive enhancement)
- Cart: server-side session via HttpOnly cookie and `use:enhance`
- Checkout: Stripe Checkout redirect (hosted page, SAQ-A compliant)
- Webhooks: Stripe (`/api/webhook/stripe`) and Printful (`/api/webhook/printful`)
- SEO: JSON-LD structured data, dynamic sitemap, OG tags

## Formatting

Use project formatting and lint commands:

```sh
npm run format
npm run lint
```

The format pipeline applies ESLint fixes, dprint formatting, and a final ESLint pass.

## Architecture Tests

Architecture tests live under `src/__tests__/architecture` and enforce:

- Import boundaries between route/server layers
- File structure and source root constraints
- Code quality thresholds (function/module size, logging rules)

## Dark Mode

Dark mode is implemented via the theme store and design tokens:

- Theme toggle supports light, dark, and system modes
- User choice is persisted in local storage
- System preference is used as fallback when no explicit selection exists

## Logging

Server-side warning/error logs can be forwarded to SeventySix API when configured:

- Set `SEVENTYSIX_API_URL` to enable forwarding
- Warning, Error, and Fatal logs are batched and posted to SeventySix logging endpoint
- Leave `SEVENTYSIX_API_URL` empty to disable forwarding

## Tests

```sh
npm test
npm run check
```

## Environment Variables

| Variable | Required | Default in `.env.example` | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://ssxc_dev:dev_password_only@localhost:5439/seventysixcommerce_sveltekit_dev` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Only when `MOCK_SERVICES=false` | `sk_test_mock_key` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Only when `MOCK_SERVICES=false` | `whsec_mock_secret` | Stripe webhook signature secret |
| `PRINTFUL_API_KEY` | Only when `MOCK_SERVICES=false` | `mock_printful_key` | Printful API access key |
| `PRINTFUL_WEBHOOK_SECRET` | Only when `MOCK_SERVICES=false` | `mock_webhook_secret` | Printful webhook secret |
| `BREVO_API_KEY` | Only when `MOCK_SERVICES=false` | `mock_brevo_key` | Brevo API key |
| `BASE_URL` | Yes | `https://localhost:3001` | Canonical base URL for redirects and metadata |
| `MOCK_SERVICES` | Yes | `true` | Server-side integration mode toggle |
| `SEVENTYSIX_API_URL` | No | empty | Optional SeventySix log-forwarding endpoint |
