/**
 * Shared product query return types.
 * Used by both SvelteKit and TanStack commerce apps.
 */

/** Product listing item for paginated results. */
export interface ProductListItem
{
	/** Product UUID. */
	id: string;
	/** Product display title. */
	title: string;
	/** Product URL slug. */
	slug: string;
	/** Product description. */
	description: string;
	/** Base price as decimal string. */
	basePrice: string;
	/** Product thumbnail image URL. */
	thumbnailUrl: string;
	/** Whether the product is featured. */
	isFeatured: boolean;
	/** Category URL slug. */
	categorySlug: string;
	/** Category display name. */
	categoryName: string;
}

/** Pagination metadata for paginated queries. */
export interface PaginationInfo
{
	/** Current page number (1-based). */
	page: number;
	/** Items per page. */
	limit: number;
	/** Total number of matching items. */
	total: number;
	/** Total number of pages. */
	totalPages: number;
}

/** Paginated product list result. */
export interface ProductListResult
{
	/** Product items for the current page. */
	items: ProductListItem[];
	/** Pagination metadata. */
	pagination: PaginationInfo;
}

/** Product variant details. */
export interface ProductVariant
{
	/** Variant UUID. */
	id: string;
	/** Variant display name (e.g. "Large / Black"). */
	name: string;
	/** Printful sync variant ID for fulfillment. */
	printfulSyncVariantId: string | null;
	/** Whether the variant is currently available. */
	isAvailable: boolean;
}

/** Full product detail with variants and art piece data. */
export interface ProductDetail
{
	/** Product UUID. */
	id: string;
	/** Product display title. */
	title: string;
	/** Product URL slug. */
	slug: string;
	/** Product description. */
	description: string;
	/** SEO meta description. */
	seoDescription: string | null;
	/** Base price as decimal string. */
	basePrice: string;
	/** Product thumbnail image URL. */
	thumbnailUrl: string;
	/** Open Graph image URL. */
	ogImageUrl: string | null;
	/** Whether the product is active. */
	isActive: boolean;
	/** Whether the product is featured. */
	isFeatured: boolean;
	/** Art piece UUID. */
	artPieceId: string;
	/** Category UUID. */
	categoryId: string;
	/** Art piece display title. */
	artPieceTitle: string;
	/** Art piece description. */
	artPieceDescription: string;
	/** Art piece image URL. */
	artPieceImageUrl: string;
	/** Art piece URL slug. */
	artPieceSlug: string;
	/** Category URL slug. */
	categorySlug: string;
	/** Category display name. */
	categoryName: string;
	/** Product variants. */
	variants: ProductVariant[];
}

/** Category with active product count. */
export interface CategoryWithCount
{
	/** Category UUID. */
	id: string;
	/** Category display name. */
	name: string;
	/** Category URL slug. */
	slug: string;
	/** Category description. */
	description: string | null;
	/** Display sort order. */
	sortOrder: number;
	/** Number of active products in this category. */
	productCount: number;
}

/** Featured product listing item. */
export interface FeaturedProduct
{
	/** Product UUID. */
	id: string;
	/** Product display title. */
	title: string;
	/** Product URL slug. */
	slug: string;
	/** Product description. */
	description: string;
	/** Base price as decimal string. */
	basePrice: string;
	/** Product thumbnail image URL. */
	thumbnailUrl: string;
	/** Category URL slug. */
	categorySlug: string;
	/** Category display name. */
	categoryName: string;
}

/** Validated input for paginated product listing queries. */
export interface GetProductsInput
{
	/** Optional category slug filter. */
	category?: string;
	/** Page number (1-based). */
	page: number;
	/** Items per page. */
	limit: number;
}