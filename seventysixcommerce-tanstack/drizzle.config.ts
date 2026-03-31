import { defineConfig } from 'drizzle-kit';

/** Drizzle Kit configuration for SeventySixCommerce TanStack Start. */
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
