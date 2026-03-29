---
description: TanStack Start patterns and rules for the SeventySixCommerce sandbox site
applyTo: "**/seventysixcommerce-tanstack/src/**/*.{ts,tsx,css}"
---

# TanStack Start Instructions

## Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | TanStack Start 1.167+ / TanStack Router 1.168+ |
| UI | React 19.2+ |
| Language | TypeScript 6.0+ (strict mode) |
| ORM | Drizzle ORM 0.45+ |
| Database | PostgreSQL 17 |
| Payments | Stripe SDK 21+ |
| Email | Brevo transactional API |
| Fulfillment | Printful API |
| Styling | Tailwind CSS 4.2+ |
| Validation | Zod 4+ |
| Build | Vite |
| Port | 3002 (dev) |

## Formatting

- Run `npm run format` for all code formatting changes (ESLint -> dprint -> ESLint)
- Do not run `dprint` directly
- Run `npm run lint` after structural refactors to catch style regressions early
- Root formatting command (`npm run format` at repo root) includes TanStack formatting via `format:tanstack`

## Project Structure

```
seventysixcommerce-tanstack/src/
├── components/
│   ├── layout/           # Header, Footer, Layout
│   ├── seo/              # JsonLd, structured data helpers
│   └── ui/               # Reusable UI components
├── lib/
│   ├── constants.ts      # Centralized constants (SINGLE SOURCE OF TRUTH)
│   ├── brevo.ts          # Brevo email integration
│   └── printful.ts       # Printful fulfillment integration
├── hooks/
│   └── use-theme.ts      # Theme state and persistence hook
├── routes/               # File-based routing (TanStack Router)
│   ├── api/              # API endpoints (placeholder, sitemap, etc.)
│   ├── shop/             # Product listing and detail pages
│   └── checkout/         # Cart and checkout flow
├── server/
│   ├── db/               # Drizzle schema, connection, seed
│   ├── functions/        # Server functions (createServerFn)
│   ├── lib/              # Server-side utilities (Stripe, mocks)
│   ├── middleware/       # CSRF, cart session middleware
│   └── log-forwarder.ts  # Warning/Error/Fatal log forwarding to SeventySix API
├── styles/               # Global CSS / Tailwind
└── router.tsx            # Router configuration
```

## Core Patterns

| Pattern | Required | Forbidden |
| ------- | -------- | --------- |
| Server functions | `createServerFn()` | Direct DB calls from routes |
| Data loading | Route `loader` with `serverFn` | `useEffect` for initial data |
| Validation | Zod schemas on `inputValidator` | Unvalidated user input |
| Type safety | Explicit return types on all exports | Inferred returns |
| Constants | Import from `~/lib/constants` | Magic numbers/strings |
| Null checks | `=== null`, `=== undefined`, `??` | `!value`, `!!value`, `\|\| "default"` |
| State | React signals / `useState` | Global mutable state |
| Middleware | `createMiddleware()` for cross-cutting | Inline auth/session checks |

**Exception for `||`**: `Number(x) || defaultValue` and `string.join("") || fallback` are valid falsy-default patterns, not null coercion.

## Date/Time Handling (CRITICAL)

| Required | Forbidden |
| --- | --- |
| `date-fns` functions via `~/lib/date` | Native `new Date()`, `Date.now()`, `Date.parse()` |
| `date-fns` v4 for all date operations | `moment`, `dayjs`, `luxon`, or other date libraries |

**Rule**: All production code must use date-fns functions via the date utility. The `new Date()` constructor is banned by ESLint — only `~/lib/date.ts` is exempted.

## Variable Naming (3+ Characters)

| Context | [NEVER] | [ALWAYS] |
| ------- | ------- | -------- |
| Lambdas | `x => x.id` | `item => item.id` |
| Loop vars | `.map(p => p.slug)` | `.map(product => product.slug)` |
| Destructuring | `const { n } = obj` | `const { name } = obj` |

## Route Conventions

### File-based Routes

| Pattern | File | Example |
| ------- | ---- | ------- |
| Static page | `routes/about.tsx` | `/about` |
| Dynamic param | `routes/shop/$category/index.tsx` | `/shop/prints` |
| Nested param | `routes/shop/$category/$slug.tsx` | `/shop/prints/sunset-poster` |
| Catch-all | `routes/api/placeholder/$.ts` | `/api/placeholder/600/400/Label` |
| Layout | `routes/__root.tsx` | Root layout wrapper |

### SEO in Routes

Every public page route MUST include `head()` returning:
- `<title>` via `meta: [{ title: "..." }]`
- `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`)
- Canonical URL via `links: [{ rel: "canonical", href: "..." }]`

Transactional pages (cart, checkout, order) include `{ name: "robots", content: "noindex" }`.

## Server Functions

### Pattern

```typescript
/** Retrieves paginated products with optional category filter. */
export const getProducts = createServerFn({ method: "GET" })
    .inputValidator(z.object({ /* ... */ }))
    .middleware([someMiddleware])
    .handler(async ({ data, context }): Promise<ResultType> => {
        // Implementation
    });
```

### Rules

- Every server function MUST have a JSDoc description
- Every handler MUST have an explicit return type annotation
- Use `.inputValidator()` with Zod for ALL inputs
- Use `.middleware()` for cross-cutting concerns (auth, CSRF, cart session)
- Never expose raw error messages — throw generic errors to clients

## JSDoc Requirements

Every exported function, type, interface, constant, and server function MUST have JSDoc:

```typescript
/** Maximum quantity allowed per cart line item. */
export const MAX_CART_ITEM_QUANTITY: number = 10;

/** Cart item with associated product details for display. */
export interface CartItem {
    id: string;
    // ...
}
```

## Security Rules

| Rule | Requirement |
| ---- | ----------- |
| CSRF | `csrfMiddleware` on ALL mutation server functions |
| Error responses | Never expose raw `error.message` to clients |
| PII logging | Mask emails in all log output |
| Input validation | Zod schema on every server function input |
| XSS prevention | Sanitize JSON-LD output, SVG content |
| Cart session | HttpOnly, Secure, SameSite=Lax cookies |
| Environment | `process.env` with fallback defaults for dev only |

## Mock Services

When `MOCK_SERVICES` is not explicitly set to `false`:
- Stripe uses mock client (no real charges)
- Printful calls are simulated (logged, not sent)
- Brevo emails are logged but not sent

All mock implementations in `src/server/lib/mock-*.ts` must match real service interfaces.

## Architecture Tests

Architecture tests live in `src/__tests__/architecture`:

- `import-boundaries.test.ts`: validates route/server import boundaries
- `file-structure.test.ts`: validates source tree and allowed root files
- `code-quality.test.ts`: validates complexity thresholds and allowlists

## Dark Mode

- Use `useTheme` hook from `src/hooks/use-theme.ts`
- Keep theme options limited to light, dark, and system
- Persist explicit user preference and use system preference when unset
- Prefer token-driven classes over hard-coded color literals

## Logging

- Configure forwarding in `src/server.ts` with `configureLogForwarder(process.env.SEVENTYSIX_API_URL ?? "")`
- Use `queueLog()` for server-side Warning/Error/Fatal telemetry
- Include `sourceContext` as `seventysixcommerce-tanstack` for admin-side filtering
- Keep forwarding best-effort; logging failures must not break request handling

## Database Patterns

- Use Drizzle ORM query builder (not raw SQL)
- Define explicit TypeScript interfaces for all query return shapes
- Schema in `src/server/db/schema.ts`
- Queries in `src/server/functions/` via server functions
- Seed data in `src/server/db/seed.ts` (idempotent)

### Migration Naming (CRITICAL)

Drizzle Kit generates random codenames by default (e.g. `0000_nice_grey_gargoyle`). **Always** provide a descriptive `--name` when generating migrations:

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
- Test files: `*.test.ts` or `*.test.tsx`
- Mock external services, never call real APIs in tests