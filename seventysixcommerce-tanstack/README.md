# SeventySixCommerce - TanStack Start

![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.167+-0ea5e9)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)
![Vitest](https://img.shields.io/badge/Vitest-4-6e9f18)

Art merchandise storefront built with TanStack Start, React 19, PostgreSQL, and mocked third-party integrations by default.

## Ecosystem Context

This is one of two satellite e-commerce sites in the [SeventySix](../README.md) ecosystem. Both storefronts share production infrastructure (Hetzner server, Caddy reverse proxy, Cloudflare DNS) and forward application logs to the SeventySix API for centralized observability. Each site uses its own PostgreSQL database, separate from the main SeventySix database. The sister site — [SeventySixCommerce (SvelteKit)](../seventysixcommerce-sveltekit/README.md) — provides the same feature set built with Svelte 5 and SvelteKit 2.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start 1.167 + TanStack Router |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript 6 |
| Data | PostgreSQL 18 + Drizzle ORM |
| Payments | Stripe Checkout (SAQ-A) |
| Fulfillment | Printful (mocked by default) |
| Email | Brevo (mocked by default) |
| Testing | Vitest |

## Quick Start

### Prerequisites

- Node.js 22+
- Docker Desktop

### Setup

```sh
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

### Local URLs

- App: https://localhost:3002
- Database: localhost:5438

## Architecture

- File-based routing with TanStack Router route modules under `src/routes`
- Server-first operations implemented with `createServerFn` in `src/server/functions`
- CSRF protection middleware under `src/server/middleware/csrf.ts`
- Database access isolated to `src/server/db`
- Mock-service toggle controlled by `MOCK_SERVICES` (safe default behavior is mock unless explicitly set to `false`)
- Client demo banner controlled by `VITE_MOCK_SERVICES` (UI indicator only)

## Features

- Product catalog and detail pages
- Session-backed shopping cart
- Stripe checkout flow
- Printful fulfillment workflow
- Brevo transactional email workflow
- Dark mode and responsive design
- Structured SEO metadata and JSON-LD
- Server error log forwarding to SeventySix API (optional)

## Testing

Current baseline: 107 tests across 17 test files.

```sh
npm test
npm run test:watch
```

Coverage focus areas:

- Architecture boundary enforcement
- Checkout, fulfillment, and webhook server workflows
- Security middleware (CSRF, cart session)
- SEO and structured data components
- Theme behavior and log-forwarding infrastructure

## Formatting

Formatting and linting commands:

```sh
npm run format
npm run lint
```

`npm run format` runs ESLint -> dprint -> ESLint to ensure all project style rules are applied.

## Architecture Tests

Architecture tests live under `src/__tests__/architecture` and enforce:

- No forbidden cross-route imports
- Route components cannot import DB modules directly
- File structure boundaries and root-file allowlist
- God-file, god-function, and god-module thresholds
- No `console.log` in production source (allowlist-based exceptions only)

## Docker

Development database:

```sh
npm run db:up
```

This starts PostgreSQL using `docker-compose.dev.yml`.

Production deployment uses the root compose stack from this repository:

```sh
# from repo root
# docker compose -f docker-compose.SeventySixCommerce.yml up -d
```

## Environment Variables

| Variable | Required | Default in `.env.example` | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://SeventySixCommerce:SeventySixCommerce_dev@localhost:5438/SeventySixCommerce` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Only when `MOCK_SERVICES=false` | `sk_test_mock_key` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Only when `MOCK_SERVICES=false` | `whsec_mock_secret` | Stripe webhook signature secret |
| `PRINTFUL_API_KEY` | Only when `MOCK_SERVICES=false` | `mock_printful_key` | Printful API access key |
| `PRINTFUL_WEBHOOK_SECRET` | Only when `MOCK_SERVICES=false` | `mock_webhook_secret` | Printful webhook verification secret |
| `BREVO_API_KEY` | Only when `MOCK_SERVICES=false` | `mock_brevo_key` | Brevo API key |
| `BASE_URL` | Yes | `https://localhost:3002` | Canonical base URL for redirects and webhook metadata |
| `MOCK_SERVICES` | Yes | `true` | Server-side integration mode toggle |
| `VITE_MOCK_SERVICES` | Recommended | `true` | Client-side demo-mode badge toggle (UI only) |
| `SEVENTYSIX_API_URL` | No | empty | Optional log-forwarding endpoint |

## Mock Services

When `MOCK_SERVICES` is not explicitly set to `false`:

- Stripe uses the local mock Stripe client
- Printful order creation is simulated
- Brevo email sends are simulated
- Checkout flow remains fully testable without external credentials

To use real integrations, explicitly set:

```env
MOCK_SERVICES=false
```

Then provide real third-party keys/secrets.

## SEO

- Product and organization JSON-LD metadata
- Canonical URLs and social metadata
- Server-rendered route metadata for indexability
- Structured data tests in `src/components/seo/__tests__`
