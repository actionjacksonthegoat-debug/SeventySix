import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for SeventySixCommerce SvelteKit.
 *
 * `DATABASE_URL` is set automatically by `ECommerce/scripts/start.mjs` via user-secrets.
 * For standalone `npx drizzle-kit` commands, ensure `DATABASE_URL` is set:
 * ```sh
 * DATABASE_URL="postgresql://ssxc_dev:dev_password_only@localhost:5439/seventysixcommerce_sveltekit_dev" npx drizzle-kit generate
 * ```
 */
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './src/lib/server/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
