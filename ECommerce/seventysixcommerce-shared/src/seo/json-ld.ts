import { BRAND_NAME } from "../constants";

/** Product data shape needed for JSON-LD schema generation. */
export interface ProductForJsonLd
{
	/** Product display title. */
	title: string;
	/** URL-safe slug identifier. */
	slug: string;
	/** Human-readable product description. */
	description: string;
	/** Base price as a decimal string (e.g. "24.99"). */
	basePrice: string;
	/** Thumbnail image path or URL. */
	thumbnailUrl: string;
	/** Open Graph image path, or null to fall back to thumbnailUrl. */
	ogImageUrl: string | null;
	/** Parent category slug for URL construction. */
	categorySlug: string;
	/** Available product variants with stock status. */
	variants: Array<{ name: string; isAvailable: boolean; }>;
}

/** Breadcrumb navigation item for JSON-LD generation. */
export interface BreadcrumbItem
{
	/** Display name for the breadcrumb step. */
	name: string;
	/** Relative URL path for the breadcrumb step. */
	url: string;
}

/**
 * Generates WebSite JSON-LD schema for the home page.
 * @param baseUrl - The site's canonical base URL (e.g. "https://example.com").
 * @returns A JSON-LD-compatible record describing the website.
 */
export function generateWebSiteJsonLd(baseUrl: string): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: BRAND_NAME,
		url: baseUrl,
		description: `Original art on everyday things — prints, apparel, and accessories.`
	};
}

/**
 * Generates Product JSON-LD schema for a product detail page.
 * @param product - The product data used to build the schema.
 * @param baseUrl - The site's canonical base URL.
 * @returns A JSON-LD-compatible record describing the product.
 */
export function generateProductJsonLd(
	product: ProductForJsonLd,
	baseUrl: string): Record<string, unknown>
{
	const availableVariants: Array<{ name: string; isAvailable: boolean; }> =
		product.variants.filter((variant) =>
			variant.isAvailable);

	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.title,
		description: product.description,
		image: product.ogImageUrl ?? product.thumbnailUrl,
		url: `${baseUrl}/shop/${product.categorySlug}/${product.slug}`,
		brand: {
			"@type": "Organization",
			name: BRAND_NAME
		},
		offers: {
			"@type": "AggregateOffer",
			priceCurrency: "USD",
			lowPrice: product.basePrice,
			highPrice: product.basePrice,
			offerCount: availableVariants.length,
			availability: availableVariants.length > 0
				? "https://schema.org/InStock"
				: "https://schema.org/OutOfStock"
		}
	};
}

/**
 * Generates BreadcrumbList JSON-LD schema for navigation.
 * @param items - Ordered breadcrumb navigation items.
 * @param baseUrl - The site's canonical base URL, prepended to each item's relative URL.
 * @returns A JSON-LD-compatible record describing the breadcrumb trail.
 */
export function generateBreadcrumbJsonLd(
	items: BreadcrumbItem[],
	baseUrl: string): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: `${baseUrl}${item.url}`
		}))
	};
}

/**
 * Generates CollectionPage JSON-LD schema for category listing pages.
 * @param categoryName - The display name of the category.
 * @param categorySlug - The URL-safe slug for the category.
 * @param productCount - The number of products in the collection.
 * @param baseUrl - The site's canonical base URL.
 * @returns A JSON-LD-compatible record describing the collection page.
 */
export function generateCollectionPageJsonLd(
	categoryName: string,
	categorySlug: string,
	productCount: number,
	baseUrl: string): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${categoryName} — ${BRAND_NAME}`,
		url: `${baseUrl}/shop/${categorySlug}`,
		description: `Browse ${productCount} ${categoryName.toLowerCase()} products at ${BRAND_NAME}.`
	};
}