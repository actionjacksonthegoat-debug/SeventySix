import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, RELATED_PRODUCTS_LIMIT } from "$lib/constants";
import { and, asc, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./index";
import { artPieces, categories, products, productVariants } from "./schema";

/** Summary product listing item. */
export interface ProductListItem
{
	id: string;
	title: string;
	slug: string;
	description: string;
	basePrice: string;
	thumbnailUrl: string;
	isFeatured: boolean;
	categorySlug: string;
	categoryName: string;
}

/** Pagination metadata for product lists. */
export interface PaginationInfo
{
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

/** Paginated product listing response. */
export interface ProductListResult
{
	items: ProductListItem[];
	pagination: PaginationInfo;
}

/** Product variant shape. */
export interface ProductVariant
{
	id: string;
	name: string;
	printfulSyncVariantId: string | null;
	isAvailable: boolean;
}

/** Full product detail with variants and art piece data. */
export interface ProductDetail
{
	id: string;
	title: string;
	slug: string;
	description: string;
	seoDescription: string | null;
	basePrice: string;
	thumbnailUrl: string;
	ogImageUrl: string | null;
	isActive: boolean;
	isFeatured: boolean;
	artPieceId: string;
	categoryId: string;
	artPieceTitle: string;
	artPieceDescription: string;
	artPieceImageUrl: string;
	artPieceSlug: string;
	categorySlug: string;
	categoryName: string;
	variants: ProductVariant[];
}

/** Category with product count. */
export interface CategoryWithCount
{
	id: string;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
	productCount: number;
}

/** Category base record. */
export interface Category
{
	id: string;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
}

/** Featured product listing item (subset of ProductListItem). */
export interface FeaturedProduct
{
	id: string;
	title: string;
	slug: string;
	description: string;
	basePrice: string;
	thumbnailUrl: string;
	categorySlug: string;
	categoryName: string;
}

/** Related product card data. */
export interface RelatedProduct
{
	id: string;
	title: string;
	slug: string;
	basePrice: string;
	thumbnailUrl: string;
	categorySlug: string;
}

/** Active product record for sitemap generation. */
export interface SitemapProduct
{
	slug: string;
	categorySlug: string;
	thumbnailUrl: string;
	updatedAt: Date;
}

/** Input schema for product listing queries. */
const getProductsSchema: z.ZodType<{ category?: string; page: number; limit: number; }> =
	z.object(
		{
			category: z
				.string()
				.optional(),
			page: z
				.number()
				.int()
				.positive()
				.default(1),
			limit: z
				.number()
				.int()
				.positive()
				.max(MAX_PAGE_SIZE)
				.default(DEFAULT_PAGE_SIZE)
		});

/** Retrieves paginated, active products with optional category filter. */
export async function getProducts(input: z.infer<typeof getProductsSchema>): Promise<ProductListResult>
{
	const validated: { category?: string; page: number; limit: number; } =
		getProductsSchema.parse(input);
	const offset: number =
		(validated.page - 1) * validated.limit;

	const conditions: SQL[] =
		[eq(products.isActive, true)];

	if (validated.category)
	{
		const cat: { id: string; }[] =
			await db
				.select(
					{ id: categories.id })
				.from(categories)
				.where(eq(categories.slug, validated.category))
				.limit(1);

		if (cat.length > 0)
		{
			conditions.push(eq(products.categoryId, cat[0].id));
		}
	}

	const [items, totalResult] =
		await Promise.all(
			[
				db
					.select(
						{
							id: products.id,
							title: products.title,
							slug: products.slug,
							description: products.description,
							basePrice: products.basePrice,
							thumbnailUrl: products.thumbnailUrl,
							isFeatured: products.isFeatured,
							categorySlug: categories.slug,
							categoryName: categories.name
						})
					.from(products)
					.innerJoin(categories, eq(products.categoryId, categories.id))
					.where(and(...conditions))
					.orderBy(desc(products.isFeatured), desc(products.createdAt))
					.limit(validated.limit)
					.offset(offset),
				db
					.select(
						{ total: count() })
					.from(products)
					.where(and(...conditions))
			]);

	const total: number =
		totalResult[0]?.total ?? 0;

	return {
		items,
		pagination: {
			page: validated.page,
			limit: validated.limit,
			total,
			totalPages: Math.ceil(total / validated.limit)
		}
	};
}

/** Retrieves a single product by slug with variants and art piece data. */
export async function getProduct(slug: string): Promise<ProductDetail | null>
{
	const result: Omit<ProductDetail, "variants">[] =
		await db
			.select(
				{
					id: products.id,
					title: products.title,
					slug: products.slug,
					description: products.description,
					seoDescription: products.seoDescription,
					basePrice: products.basePrice,
					thumbnailUrl: products.thumbnailUrl,
					ogImageUrl: products.ogImageUrl,
					isActive: products.isActive,
					isFeatured: products.isFeatured,
					artPieceId: products.artPieceId,
					categoryId: products.categoryId,
					artPieceTitle: artPieces.title,
					artPieceDescription: artPieces.description,
					artPieceImageUrl: artPieces.imageUrl,
					artPieceSlug: artPieces.slug,
					categorySlug: categories.slug,
					categoryName: categories.name
				})
			.from(products)
			.innerJoin(artPieces, eq(products.artPieceId, artPieces.id))
			.innerJoin(categories, eq(products.categoryId, categories.id))
			.where(and(eq(products.slug, slug), eq(products.isActive, true)))
			.limit(1);

	if (result.length === 0)
	{
		return null;
	}

	const product: Omit<ProductDetail, "variants"> =
		result[0];

	const variants: ProductVariant[] =
		await db
			.select(
				{
					id: productVariants.id,
					name: productVariants.name,
					printfulSyncVariantId: productVariants.printfulSyncVariantId,
					isAvailable: productVariants.isAvailable
				})
			.from(productVariants)
			.where(eq(productVariants.productId, product.id));

	return { ...product, variants };
}

/** Retrieves a category by slug. */
export async function getCategoryBySlug(slug: string): Promise<Category | null>
{
	const result: Category[] =
		await db
			.select()
			.from(categories)
			.where(eq(categories.slug, slug))
			.limit(1);

	return result[0] ?? null;
}

/** Retrieves all categories with active product counts. */
export async function getCategories(): Promise<CategoryWithCount[]>
{
	return db
		.select(
			{
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description,
				sortOrder: categories.sortOrder,
				productCount: count(products.id)
			})
		.from(categories)
		.leftJoin(
			products,
			and(
				eq(products.categoryId, categories.id),
				eq(products.isActive, true)))
		.groupBy(
			categories.id,
			categories.name,
			categories.slug,
			categories.description,
			categories.sortOrder)
		.orderBy(asc(categories.sortOrder));
}

/** Retrieves products marked as featured. */
export async function getFeaturedProducts(): Promise<FeaturedProduct[]>
{
	return db
		.select(
			{
				id: products.id,
				title: products.title,
				slug: products.slug,
				description: products.description,
				basePrice: products.basePrice,
				thumbnailUrl: products.thumbnailUrl,
				categorySlug: categories.slug,
				categoryName: categories.name
			})
		.from(products)
		.innerJoin(categories, eq(products.categoryId, categories.id))
		.where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
		.orderBy(desc(products.createdAt));
}

/** Retrieves related products from the same art piece, excluding current. */
export async function getRelatedProducts(
	artPieceId: string,
	excludeProductId: string): Promise<RelatedProduct[]>
{
	return db
		.select(
			{
				id: products.id,
				title: products.title,
				slug: products.slug,
				basePrice: products.basePrice,
				thumbnailUrl: products.thumbnailUrl,
				categorySlug: categories.slug
			})
		.from(products)
		.innerJoin(categories, eq(products.categoryId, categories.id))
		.where(
			and(
				eq(products.artPieceId, artPieceId),
				eq(products.isActive, true),
				sql`${products.id} != ${excludeProductId}`))
		.limit(RELATED_PRODUCTS_LIMIT);
}

/** Retrieves all active products for sitemap generation. */
export async function getActiveProducts(): Promise<SitemapProduct[]>
{
	return db
		.select(
			{
				slug: products.slug,
				categorySlug: categories.slug,
				thumbnailUrl: products.thumbnailUrl,
				updatedAt: products.createdAt
			})
		.from(products)
		.innerJoin(categories, eq(products.categoryId, categories.id))
		.where(eq(products.isActive, true));
}