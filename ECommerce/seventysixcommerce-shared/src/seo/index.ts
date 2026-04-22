/**
 * SEO utilities for JSON-LD structured data generation.
 * Framework-agnostic generators used by both SvelteKit and TanStack commerce apps.
 */
export {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd,
	generateProductJsonLd,
	generateWebSiteJsonLd
} from "./json-ld";
export type { BreadcrumbItem, ProductForJsonLd } from "./json-ld";