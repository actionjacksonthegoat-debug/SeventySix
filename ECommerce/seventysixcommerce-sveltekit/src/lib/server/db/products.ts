/**
 * SvelteKit product query wrappers.
 * Delegates shared queries to @seventysixcommerce/shared/products,
 * keeping SvelteKit-only functions (getRelatedProducts, getActiveProducts, getCategoryBySlug) local.
 */
import { RELATED_PRODUCTS_LIMIT } from "$lib/constants";
import {
	getCategories as sharedGetCategories,
	getFeaturedProducts as sharedGetFeaturedProducts,
	getProductBySlug,
	getProducts as sharedGetProducts
} from "@seventysixcommerce/shared/products";
import type {
	CategoryWithCount,
	FeaturedProduct,
	GetProductsInput,
	ProductDetail,
	ProductListResult
} from "@seventysixcommerce/shared/products";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products } from "./schema";

export type {
	CategoryWithCount,
	FeaturedProduct,
	GetProductsInput,
	ProductDetail,
	ProductListResult
} from "@seventysixcommerce/shared/products";
export type {
	PaginationInfo,
	ProductListItem,
	ProductVariant
} from "@seventysixcommerce/shared/products";

/** Category base record. */
export interface Category
{
	id: string;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
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

/** Retrieves paginated, active products with optional category filter. */
export async function getProducts(input: GetProductsInput): Promise<ProductListResult>
{
	return sharedGetProducts(db, input);
}

/** Retrieves a single product by slug with variants and art piece data. */
export async function getProduct(slug: string): Promise<ProductDetail | null>
{
	return getProductBySlug(db, slug);
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
	return sharedGetCategories(db);
}

/** Retrieves products marked as featured. */
export async function getFeaturedProducts(): Promise<FeaturedProduct[]>
{
	return sharedGetFeaturedProducts(db);
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