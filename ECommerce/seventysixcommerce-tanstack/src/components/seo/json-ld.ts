import { BRAND_NAME, SITE_URL } from "~/lib/constants";
import type { Product, ProductDetail } from "~/server/functions/products";

/** WebSite + Organization JSON-LD for the home page. */
export function generateWebSiteJsonLd(): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: BRAND_NAME,
		url: SITE_URL,
		potentialAction: {
			"@type": "SearchAction",
			target: `${SITE_URL}/shop?q={search_term_string}`,
			"query-input": "required name=search_term_string"
		}
	};
}

/** Product JSON-LD schema for a product detail page. */
export function generateProductJsonLd(
	product: ProductDetail,
	_categorySlug: string): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.title,
		image: `${SITE_URL}${product.thumbnailUrl}`,
		description: product.seoDescription ?? product.description,
		sku: product.slug,
		brand: {
			"@type": "Organization",
			name: BRAND_NAME
		},
		offers: {
			"@type": "AggregateOffer",
			priceCurrency: "USD",
			lowPrice: product.basePrice,
			highPrice: product.basePrice,
			offerCount: product.variants.length,
			availability: "https://schema.org/InStock"
		}
	};
}

/** BreadcrumbList JSON-LD for navigation. */
export function generateBreadcrumbJsonLd(
	items: Array<{ name: string; url: string; }>): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index: number) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

/** CollectionPage JSON-LD for category listing pages. */
export function generateCollectionPageJsonLd(
	categoryName: string,
	categorySlug: string,
	products: Product[]): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${categoryName} — ${BRAND_NAME}`,
		url: `${SITE_URL}/shop/${categorySlug}`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: products.map((product, index: number) => ({
				"@type": "ListItem",
				position: index + 1,
				url: `${SITE_URL}/shop/${categorySlug}/${product.slug}`
			}))
		}
	};
}