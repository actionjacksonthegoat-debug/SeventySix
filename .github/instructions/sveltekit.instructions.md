---
description: SvelteKit patterns and rules for the SeventySixCommerce sandbox site
applyTo: "**/ECommerce/seventysixcommerce-sveltekit/src/**/*.{ts,svelte,css}"
---

# SvelteKit Instructions

## Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | SvelteKit 2+ with Svelte 5 (runes) |
| Language | TypeScript 5.9+ (strict mode) |
| ORM | Drizzle ORM 0.45+ |
| Database | PostgreSQL 18 |
| Payments | Stripe SDK |
| Email | Brevo transactional API |
| Fulfillment | Printful API |
| Build | Vite 7+ |
| Port | 3001 (dev) |

## Formatting

- Run `npm run format` for all code formatting changes (ESLint -> dprint -> ESLint)
- Do not run `dprint` directly
- Run `npm run lint` after structural refactors to catch style regressions early
- Root formatting command (`npm run format` at repo root) includes SvelteKit formatting via `format:svelte`

## Project Structure

```
ECommerce/seventysixcommerce-sveltekit/src/
├── lib/
│   ├── assets/           # Static SVGs and images
│   ├── components/       # Reusable Svelte components
│   ├── constants.ts      # Centralized constants (SINGLE SOURCE OF TRUTH)
│   ├── stores/           # Theme and UI state stores
│   ├── server/
│   │   ├── db/           # Drizzle schema, queries, migrations
│   │   ├── integrations/ # External API wrappers (Printful, Brevo)
│   │   ├── mock/         # Mock service implementations
│   │   ├── log-forwarder.ts # Warning/Error/Fatal log forwarding to SeventySix API
│   │   └── stripe.ts     # Stripe client factory
│   └── utils/            # Shared utility functions (SEO, formatting)
├── routes/               # File-based routing (SvelteKit conventions)
└── hooks.server.ts       # Server hooks (security headers, cart session)
```

## Core Patterns

| Pattern | Required | Forbidden |
| ------- | -------- | --------- |
| Reactivity | Svelte 5 runes (`$state`, `$derived`, `$effect`) | Svelte 4 stores |
| Server data | `+page.server.ts` load functions | Client-side fetch for initial data |
| Forms | SvelteKit form actions | Client-side form submission |
| API routes | `+server.ts` in `/api/` | Express-style middleware |
| Type safety | Explicit return types on all exports | Inferred returns |
| Constants | Import from `$lib/constants` | Magic numbers/strings |
| Null checks | `=== null`, `=== undefined`, `??` | `!value`, `!!value`, `\|\| "default"` |
| Environment | `$env/static/private`, `$env/dynamic/private` | `process.env` |

## Date/Time Handling (CRITICAL)

| Required | Forbidden |
| --- | --- |
| `date-fns` functions via `$lib/utils/date` | Native `new Date()`, `Date.now()`, `Date.parse()` |
| `date-fns` v4 for all date operations | `moment`, `dayjs`, `luxon`, or other date libraries |

**Rule**: All production code must use date-fns functions via the date utility. The `new Date()` constructor is banned by ESLint — only `$lib/utils/date.ts` is exempted.

## Variable Naming (3+ Characters)

| Context | [NEVER] | [ALWAYS] |
| ------- | ------- | -------- |
| Lambdas | `x => x.id` | `item => item.id` |
| Loop vars | `.map(p => p.slug)` | `.map(product => product.slug)` |
| Destructuring | `const { n } = obj` | `const { name } = obj` |

## JSDoc Requirements

Every exported function, type, interface, and constant MUST have JSDoc:

```typescript
/** Retrieves paginated products with optional category filter. */
export async function getProducts(input: ProductInput): Promise<ProductListResult> {
```

## Security Rules

| Rule | Requirement |
| ---- | ----------- |
| Error responses | Never expose raw `error.message` to clients |
| PII logging | Mask emails: `email.replace(/^(.{2}).*@/, "$1***@")` |
| Input validation | Validate all route params (UUID pattern, Stripe ID format) |
| XSS prevention | Sanitize dynamic content in SVG/HTML generation |
| CSRF | SvelteKit handles via SameSite cookies + origin check |
| Headers | Security headers set in `hooks.server.ts` |

## SEO Requirements

Every public page MUST include:
- `<title>` and `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`)
- Canonical URL (`<link rel="canonical">`)
- JSON-LD structured data where applicable

Transactional pages (cart, checkout, order) use `<meta name="robots" content="noindex">`.

## Mock Services

When `MOCK_SERVICES` is not explicitly set to `false`:
- Stripe uses mock client (no real charges)
- Printful calls are simulated (logged, not sent)
- Brevo emails are logged but not sent

All mock implementations must match the real service interface exactly.

## Architecture Tests

Architecture tests live in `src/__tests__/architecture`:

- `import-boundaries.test.ts`: validates allowed imports between route/server layers
- `file-structure.test.ts`: validates source layout and file placement constraints
- `code-quality.test.ts`: validates complexity thresholds and code quality allowlists

## Dark Mode

- Theme state is centralized in `src/lib/stores/theme.ts`
- Theme options include light, dark, and system
- Persist user selection and keep SSR-safe initialization to avoid flash of incorrect theme
- Prefer token-driven classes instead of one-off color literals

## Logging

- Configure forwarding in `hooks.server.ts` with `configureLogForwarder(env.SEVENTYSIX_API_URL ?? "")`
- Use `queueLog()` for server-side Warning/Error/Fatal telemetry
- Include `sourceContext` as `seventysixcommerce-sveltekit` for admin-side filtering
- Keep forwarding best-effort; logging failures must not break request handling

## Database Patterns

- Use Drizzle ORM query builder (not raw SQL)
- Define explicit TypeScript interfaces for all query return shapes
- Validate inputs with Zod before database operations
- Centralize queries in `$lib/server/db/` — no inline queries in routes

### Migration Naming (CRITICAL)

Drizzle Kit generates random codenames by default (e.g. `0000_daffy_captain_britain`). **Always** provide a descriptive `--name` when generating migrations:

```bash
# [ALWAYS] — descriptive name
npx drizzle-kit generate --name=initial_schema
npx drizzle-kit generate --name=add_order_notes

# [NEVER] — random codename
npx drizzle-kit generate
npm run db:generate
```

The `db:generate` script intentionally prints usage and exits — run `npx drizzle-kit generate --name=<descriptive_name>` directly.

## Testing

- Unit tests use Vitest
- Test files: `*.test.ts` alongside source in `__tests__/` directories
- Mock external services, never call real APIs in tests