import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for SeventySixCommerce TanStack Start.
 *
 * `DATABASE_URL` is set automatically by `ECommerce/scripts/start.mjs` via user-secrets.
 * For standalone `npx drizzle-kit` commands, ensure `DATABASE_URL` is set:
 * ```sh
 * DATABASE_URL="postgresql://seventysixcommerce:seventysixcommerce_dev@localhost:5438/seventysixcommerce" npx drizzle-kit generate
 * ```
 */
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
