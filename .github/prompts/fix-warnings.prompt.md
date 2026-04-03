---
agent: agent
description: Find and fix all build/lint warnings across client and server
---

# Fix All Warnings

Find and fix ALL build and lint warnings across the entire codebase.

## MCP Tools

- Use **context7** to verify correct API patterns when fixing deprecated-usage or obsolete-API warnings

## Steps

1. Run `dotnet build` in `SeventySix.Server/` and fix ALL warnings
2. Run `npx ng build` in `SeventySix.Client/` and fix ALL warnings
3. Run `npx eslint "src/**/*.ts" --max-warnings 0` in `SeventySix.Client/` and fix ALL warnings
4. Run `get_errors` (no file filter) — fix ALL IDE/TypeScript/lint errors reported
5. Link shared modules then run SvelteKit check: `node scripts/link-commerce-shared-node-modules.mjs --app sveltekit && cd ECommerce/seventysixcommerce-sveltekit && npm run check` — fix ALL errors
6. Run SvelteKit lint: `cd ECommerce/seventysixcommerce-sveltekit && npm run lint` — fix ALL warnings
7. Link shared modules then run TanStack build + typecheck: `node scripts/link-commerce-shared-node-modules.mjs --app tanstack && cd ECommerce/seventysixcommerce-tanstack && npm run build && npm run typecheck` — fix ALL errors
8. Run TanStack lint: `cd ECommerce/seventysixcommerce-tanstack && npm run lint` — fix ALL warnings
9. Run shared library lint: `cd ECommerce/seventysixcommerce-shared && npm run lint` — fix ALL warnings

## Rules

- **Never suppress warnings** — always fix the root cause
- No `#pragma warning disable` in C#
- No `// @ts-ignore` or `// eslint-disable` in TypeScript
- **Exceptions**: Generated OpenAPI clients

## Validation

After fixing, re-run all build commands and `get_errors` (no file filter) — confirm zero warnings/errors.
