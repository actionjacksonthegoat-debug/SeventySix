import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@seventysixcommerce/shared/constants";
import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import * as schema from "../db/schema";

/** Product list item shape. */
export interface Product
{
	id: string;
	title: string;
	slug: string;
	description: string;
	basePrice: string;
	thumbnailUrl: string;
	isActive: boolean;
	isFeatured: boolean;
	categorySlug: string;
	categoryName: string;
}

/** Product variant shape. */
export interface ProductVariant
{
	id: string;
	name: string;
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
	categorySlug: string;
	categoryName: string;
	artPieceTitle: string;
	artPieceDescription: string;
	artPieceImageUrl: string;
	variants: ProductVariant[];
}

/** Category with product count. */
export interface Category
{
	id: string;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
	productCount: number;
}

/** Paginated result wrapper. */
export interface PaginatedResult<T>
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
		.inputValidator(
			z.object(
				{
					category: z
						.string()
						.optional(),
					page: z
						.coerce
						.number()
						.int()
						.positive()
						.default(1),
					limit: z
						.coerce
						.number()
						.int()
						.positive()
						.max(MAX_PAGE_SIZE)
						.default(DEFAULT_PAGE_SIZE)
				}))
		.handler(
			async ({ data }): Promise<PaginatedResult<Product>> =>
			{
				const { category, page, limit } = data;
				const offset: number =
					(page - 1) * limit;

				const conditions =
					[eq(schema.products.isActive, true)];

				if (category)
				{
					const cat =
						await db
							.select(
								{ id: schema.categories.id })
							.from(schema.categories)
							.where(eq(schema.categories.slug, category))
							.limit(1);

					if (cat[0])
					{
						conditions.push(eq(schema.products.categoryId, cat[0].id));
					}
				}

				const whereClause =
					and(...conditions);

				const [items, totalResult] =
					await Promise.all(
						[
							db
								.select(
									{
										id: schema.products.id,
										title: schema.products.title,
										slug: schema.products.slug,
										description: schema.products.description,
										basePrice: schema.products.basePrice,
										thumbnailUrl: schema.products.thumbnailUrl,
										isActive: schema.products.isActive,
										isFeatured: schema.products.isFeatured,
										categorySlug: schema.categories.slug,
										categoryName: schema.categories.name
									})
								.from(schema.products)
								.innerJoin(
									schema.categories,
									eq(schema.products.categoryId, schema.categories.id))
								.where(whereClause)
								.orderBy(desc(schema.products.createdAt))
								.limit(limit)
								.offset(offset),
							db
								.select(
									{ count: count() })
								.from(schema.products)
								.where(whereClause)
						]);

				const total: number =
					Number(totalResult[0]?.count ?? 0);

				return {
					items: items as Product[],
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit)
				};
			});

/** Retrieves a single product by slug, including variants and art piece data. */
export const getProduct =
	createServerFn(
		{ method: "GET" })
		.inputValidator(z.object(
			{ slug: z.string() }))
		.handler(
			async ({ data }): Promise<ProductDetail | null> =>
			{
				const rows =
					await db
						.select(
							{
								id: schema.products.id,
								title: schema.products.title,
								slug: schema.products.slug,
								description: schema.products.description,
								seoDescription: schema.products.seoDescription,
								basePrice: schema.products.basePrice,
								thumbnailUrl: schema.products.thumbnailUrl,
								ogImageUrl: schema.products.ogImageUrl,
								isActive: schema.products.isActive,
								isFeatured: schema.products.isFeatured,
								categorySlug: schema.categories.slug,
								categoryName: schema.categories.name,
								artPieceTitle: schema.artPieces.title,
								artPieceDescription: schema.artPieces.description,
								artPieceImageUrl: schema.artPieces.imageUrl
							})
						.from(schema.products)
						.innerJoin(
							schema.categories,
							eq(schema.products.categoryId, schema.categories.id))
						.innerJoin(
							schema.artPieces,
							eq(schema.products.artPieceId, schema.artPieces.id))
						.where(and(eq(schema.products.slug, data.slug), eq(schema.products.isActive, true)))
						.limit(1);

				const product =
					rows[0];
				if (product === undefined)
				{
					return null;
				}

				const variants =
					await db
						.select(
							{
								id: schema.productVariants.id,
								name: schema.productVariants.name,
								isAvailable: schema.productVariants.isAvailable
							})
						.from(schema.productVariants)
						.innerJoin(
							schema.products,
							eq(schema.productVariants.productId, schema.products.id))
						.where(eq(schema.products.slug, data.slug));

				return {
					...product,
					variants
				} as ProductDetail;
			});

/** Retrieves all categories with active product counts, ordered by sortOrder. */
export const getCategories =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<Category[]> =>
			{
				const rows =
					await db
						.select(
							{
								id: schema.categories.id,
								name: schema.categories.name,
								slug: schema.categories.slug,
								description: schema.categories.description,
								sortOrder: schema.categories.sortOrder,
								productCount: count(schema.products.id)
							})
						.from(schema.categories)
						.leftJoin(
							schema.products,
							and(
								eq(schema.products.categoryId, schema.categories.id),
								eq(schema.products.isActive, true)))
						.groupBy(schema.categories.id)
						.orderBy(schema.categories.sortOrder);

				return rows.map((row) => ({
					...row,
					productCount: Number(row.productCount)
				}));
			});

/** Retrieves featured, active products. */
export const getFeaturedProducts =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<Product[]> =>
			{
				const items =
					await db
						.select(
							{
								id: schema.products.id,
								title: schema.products.title,
								slug: schema.products.slug,
								description: schema.products.description,
								basePrice: schema.products.basePrice,
								thumbnailUrl: schema.products.thumbnailUrl,
								isActive: schema.products.isActive,
								isFeatured: schema.products.isFeatured,
								categorySlug: schema.categories.slug,
								categoryName: schema.categories.name
							})
						.from(schema.products)
						.innerJoin(
							schema.categories,
							eq(schema.products.categoryId, schema.categories.id))
						.where(
							and(
								eq(schema.products.isActive, true),
								eq(schema.products.isFeatured, true)))
						.orderBy(desc(schema.products.createdAt))
						.limit(6);

				return items as Product[];
			});