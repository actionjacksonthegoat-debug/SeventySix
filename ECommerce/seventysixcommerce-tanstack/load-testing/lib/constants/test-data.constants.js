/**
 * Test Data Constants
 *
 * Seed data references and test configuration values
 * for the TanStack ecommerce load tests.
 */

/** @type {string} Prefix for load-test-created data */
export const TEST_DATA_PREFIX = "loadtest_";

/** @type {Readonly<{SHORT: number, MEDIUM: number, LONG: number}>} */
export const SLEEP_DURATION = Object.freeze({
	SHORT: 0.5,
	MEDIUM: 1,
	LONG: 2
});

/** @type {string} Expected health endpoint status value */
export const HEALTH_STATUS = "healthy";

/**
 * Seed product data for browse scenarios.
 * These slugs match the database seed in src/lib/db/seed.ts.
 */
export const SEED_CATEGORIES = Object.freeze([
	"posters",
	"apparel",
	"mugs"
]);

/** @type {Readonly<Array<{category: string, slug: string}>>} */
export const SEED_PRODUCTS = Object.freeze([
	{ category: "posters", slug: "neon-horizon-poster" },
	{ category: "posters", slug: "cosmic-garden-poster" },
	{ category: "posters", slug: "electric-wilderness-poster" },
	{ category: "apparel", slug: "neon-horizon-tee" },
	{ category: "apparel", slug: "cosmic-garden-tee" },
	{ category: "apparel", slug: "electric-wilderness-tee" },
	{ category: "mugs", slug: "neon-horizon-mug" },
	{ category: "mugs", slug: "cosmic-garden-mug" },
	{ category: "mugs", slug: "electric-wilderness-mug" }
]);
