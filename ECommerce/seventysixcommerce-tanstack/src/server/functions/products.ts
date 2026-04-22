/**
 * TanStack Start product server functions.
 * Delegates shared queries to @seventysixcommerce/shared/products,
 * wrapping with createServerFn for TanStack Start RPC.
 */
import {
	getCategories as sharedGetCategories,
	getFeaturedProducts as sharedGetFeaturedProducts,
	getProductBySlug,
	getProducts as sharedGetProducts,
	getProductsSchema
} from "@seventysixcommerce/shared/products";
import type {
	CategoryWithCount,
	FeaturedProduct,
	ProductDetail as SharedProductDetail,
	ProductListItem,
	ProductListResult,
	ProductVariant as SharedProductVariant
} from "@seventysixcommerce/shared/products";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";

/** Product list item shape (re-exported for backward compatibility). */
export type Product = ProductListItem;

/** Product variant shape (re-exported with backward-compatible name). */
export type ProductVariant = SharedProductVariant;

/** Full product detail with variants and art piece data. */
export type ProductDetail = SharedProductDetail;

/** Category with product count. */
export type Category = CategoryWithCount;

/** Paginated result wrapper. */
interface PaginatedResult<T>
{
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/** Retrieves paginated, active products with optional category filter. */
export const getProducts =
	createServerFn(
		{ method: "GET" })
		.inputValidator(getProductsSchema)
		.handler(
			async ({ data }): Promise<PaginatedResult<Product>> =>
			{
				const result: ProductListResult =
					await sharedGetProducts(db, data);

				return {
					items: result.items,
					total: result.pagination.total,
					page: result.pagination.page,
					limit: result.pagination.limit,
					totalPages: result.pagination.totalPages
				};
			});

/** Retrieves a single product by slug, including variants and art piece data. */
export const getProduct =
	createServerFn(
		{ method: "GET" })
		.inputValidator(z.object(
			{
				slug: z
					.string()
					.max(200)
					.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			}))
		.handler(
			async ({ data }): Promise<ProductDetail | null> =>
			{
				return getProductBySlug(db, data.slug);
			});

/** Retrieves all categories with active product counts, ordered by sortOrder. */
export const getCategories =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<Category[]> =>
			{
				return sharedGetCategories(db);
			});

/** Retrieves featured, active products. */
export const getFeaturedProducts =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<FeaturedProduct[]> =>
			{
				return sharedGetFeaturedProducts(db, 6);
			});