import { BRAND_NAME } from "$lib/constants";

/** Product data shape needed for JSON-LD generation. */
interface ProductForJsonLd
{
	title: string;
	slug: string;
	description: string;
	basePrice: string;
	thumbnailUrl: string;
	ogImageUrl: string | null;
	categorySlug: string;
	variants: Array<{ name: string; isAvailable: boolean; }>;
}

/** Breadcrumb navigation item for JSON-LD. */
interface BreadcrumbItem
{
	name: string;
	url: string;
}

/** Generates WebSite JSON-LD schema. */
export function generateWebSiteJsonLd(baseUrl: string): Record<string, unknown>
{
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: BRAND_NAME,
		url: baseUrl,
		description: "Original art on everyday things — prints, apparel, and accessories."
	};
}

/** Generates Product JSON-LD schema. */
export function generateProductJsonLd(product: ProductForJsonLd, baseUrl: string): Record<string, unknown>
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

/** Generates BreadcrumbList JSON-LD schema. */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl: string): Record<string, unknown>
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

/** Generates CollectionPage JSON-LD for category pages. */
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