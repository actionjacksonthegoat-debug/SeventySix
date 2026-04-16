/**
 * SEO JSON-LD utilities.
 * Re-exports shared JSON-LD generators for SvelteKit route consumption.
 */
export {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd,
	generateProductJsonLd,
	generateWebSiteJsonLd
} from "@seventysixcommerce/shared/seo";
export type { BreadcrumbItem, ProductForJsonLd } from "@seventysixcommerce/shared/seo";