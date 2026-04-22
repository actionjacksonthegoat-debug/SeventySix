/**
 * Shared product query functions for both commerce apps.
 * Pure database queries accepting CommerceDb — no framework coupling.
 */
export type {
	CategoryWithCount,
	FeaturedProduct,
	GetProductsInput,
	PaginationInfo,
	ProductDetail,
	ProductListItem,
	ProductListResult,
	ProductVariant
} from "./types";
export { getProductsSchema, slugSchema } from "./validation";

import { and, asc, count, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import {
	artPieces,
	categories,
	products,
	productVariants
} from "../schema/index";
import type { CommerceDb } from "../types/index";
import type {
	CategoryWithCount,
	FeaturedProduct,
	GetProductsInput,
	ProductDetail,
	ProductListResult,
	ProductVariant
} from "./types";
import { getProductsSchema } from "./validation";

/**
 * Retrieves paginated products with optional category filter.
 * Featured products appear first, then ordered by newest.
 * @param database - The commerce database instance.
 * @param input - Validated pagination and filter input.
 * @returns Paginated product list with metadata.
 */
export async function getProducts(
	database: CommerceDb,
	input: GetProductsInput): Promise<ProductListResult>
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
			await database
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

	const whereClause: SQL | undefined =
		and(...conditions);

	const [items, totalResult] =
		await Promise.all(
			[
				database
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
					.where(whereClause)
					.orderBy(desc(products.isFeatured), desc(products.createdAt))
					.limit(validated.limit)
					.offset(offset),
				database
					.select(
						{ total: count() })
					.from(products)
					.where(whereClause)
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

/**
 * Retrieves a single product by slug with variants and art piece data.
 * @param database - The commerce database instance.
 * @param slug - The product URL slug.
 * @returns The product detail or null if not found.
 */
export async function getProductBySlug(
	database: CommerceDb,
	slug: string): Promise<ProductDetail | null>
{
	const result: Omit<ProductDetail, "variants">[] =
		await database
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
		await database
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

/**
 * Retrieves all categories with active product counts.
 * @param database - The commerce database instance.
 * @returns Array of categories with their product counts, ordered by sortOrder.
 */
export async function getCategories(
	database: CommerceDb): Promise<CategoryWithCount[]>
{
	return database
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

/**
 * Retrieves featured products.
 * @param database - The commerce database instance.
 * @param limit - Optional maximum number of products to return.
 * @returns Array of featured products ordered by newest first.
 */
export async function getFeaturedProducts(
	database: CommerceDb,
	limit?: number): Promise<FeaturedProduct[]>
{
	return database
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
		.orderBy(desc(products.createdAt))
		.limit(limit ?? 50);
}