import { beforeEach, describe, expect, it, vi } from "vitest";

const mockProducts =
	[
		{
			id: "prod-1",
			title: "Sunset T-Shirt",
			slug: "sunset-tshirt",
			description: "A beautiful sunset tee",
			basePrice: "29.99",
			thumbnailUrl: "/images/sunset-tshirt.webp",
			isFeatured: true,
			categorySlug: "apparel",
			categoryName: "Apparel"
		}
	];

const mockProductDetail =
	{
		id: "prod-1",
		title: "Sunset T-Shirt",
		slug: "sunset-tshirt",
		description: "A beautiful sunset tee",
		seoDescription: "Premium sunset art t-shirt",
		basePrice: "29.99",
		thumbnailUrl: "/images/sunset-tshirt.webp",
		ogImageUrl: "/images/sunset-tshirt-og.webp",
		isActive: true,
		isFeatured: true,
		artPieceId: "art-1",
		categoryId: "cat-1",
		artPieceTitle: "Golden Sunset",
		artPieceDescription: "A stunning golden sunset over the mountains",
		artPieceImageUrl: "/images/golden-sunset.webp",
		artPieceSlug: "golden-sunset",
		categorySlug: "apparel",
		categoryName: "Apparel",
		variants: [
			{
				id: "var-1",
				name: "Small",
				printfulSyncVariantId: "pf-1",
				isAvailable: true
			},
			{
				id: "var-2",
				name: "Medium",
				printfulSyncVariantId: "pf-2",
				isAvailable: true
			}
		]
	};

const mockCategories =
	[
		{
			id: "cat-1",
			name: "Apparel",
			slug: "apparel",
			description: "Wearable art",
			sortOrder: 0,
			productCount: 3
		},
		{
			id: "cat-2",
			name: "Prints",
			slug: "prints",
			description: "Fine art prints",
			sortOrder: 1,
			productCount: 2
		}
	];

vi.mock("../index", () => ({
	db: {
		select: vi
			.fn()
			.mockReturnThis(),
		from: vi
			.fn()
			.mockReturnThis(),
		innerJoin: vi
			.fn()
			.mockReturnThis(),
		leftJoin: vi
			.fn()
			.mockReturnThis(),
		where: vi
			.fn()
			.mockReturnThis(),
		orderBy: vi
			.fn()
			.mockReturnThis(),
		groupBy: vi
			.fn()
			.mockReturnThis(),
		limit: vi
			.fn()
			.mockReturnThis(),
		offset: vi.fn()
	}
}));

describe("Product Queries",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.resetModules();
			});

		it("getProducts returns paginated active products",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				// Mock for items query
				const mockChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						innerJoin: vi
							.fn()
							.mockReturnThis(),
						leftJoin: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						orderBy: vi
							.fn()
							.mockReturnThis(),
						groupBy: vi
							.fn()
							.mockReturnThis(),
						limit: vi
							.fn()
							.mockReturnThis(),
						offset: vi
							.fn()
							.mockResolvedValue(mockProducts)
					};
				const mockCountChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockResolvedValue(
								[{ total: 1 }])
					};

				selectSpy
					.mockReturnValueOnce(mockChain as any)
					.mockReturnValueOnce(mockCountChain as any);

				const { getProducts } =
					await import("../products");
				const result =
					await getProducts(
						{ page: 1, limit: 24 });

				expect(result.items)
					.toEqual(mockProducts);
				expect(result.pagination)
					.toEqual(
						{
							page: 1,
							limit: 24,
							total: 1,
							totalPages: 1
						});
			});

		it("getProduct returns single product with variants by slug",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const { variants, ...productWithoutVariants } = mockProductDetail;

				const mockProductChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						innerJoin: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						limit: vi
							.fn()
							.mockResolvedValue(
								[productWithoutVariants])
					};
				const mockVariantChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockResolvedValue(variants)
					};

				selectSpy
					.mockReturnValueOnce(mockProductChain as any)
					.mockReturnValueOnce(mockVariantChain as any);

				const { getProduct } =
					await import("../products");
				const result =
					await getProduct("sunset-tshirt");

				expect(result).not.toBeNull();
				expect(result!.title)
					.toBe("Sunset T-Shirt");
				expect(result!.variants)
					.toHaveLength(2);
				expect(result!.artPieceTitle)
					.toBe("Golden Sunset");
			});

		it("getProduct returns null for non-existent slug",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const mockChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						innerJoin: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						limit: vi
							.fn()
							.mockResolvedValue([])
					};

				selectSpy.mockReturnValueOnce(mockChain as any);

				const { getProduct } =
					await import("../products");
				const result =
					await getProduct("nonexistent");
				expect(result)
					.toBeNull();
			});

		it("getCategories returns all categories with product counts",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const mockChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						leftJoin: vi
							.fn()
							.mockReturnThis(),
						groupBy: vi
							.fn()
							.mockReturnThis(),
						orderBy: vi
							.fn()
							.mockResolvedValue(mockCategories)
					};

				selectSpy.mockReturnValueOnce(mockChain as any);

				const { getCategories } =
					await import("../products");
				const result =
					await getCategories();

				expect(result)
					.toHaveLength(2);
				expect(result[0].slug)
					.toBe("apparel");
				expect(result[0].productCount)
					.toBe(3);
			});

		it("getFeaturedProducts returns featured products only",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const mockChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						innerJoin: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						orderBy: vi
							.fn()
							.mockResolvedValue(mockProducts)
					};

				selectSpy.mockReturnValueOnce(mockChain as any);

				const { getFeaturedProducts } =
					await import("../products");
				const result =
					await getFeaturedProducts();

				expect(result)
					.toHaveLength(1);
			});

		it("getProduct includes art piece metadata",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const { variants, ...productWithoutVariants } = mockProductDetail;

				const mockProductChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						innerJoin: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						limit: vi
							.fn()
							.mockResolvedValue(
								[productWithoutVariants])
					};
				const mockVariantChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockResolvedValue(variants)
					};

				selectSpy
					.mockReturnValueOnce(mockProductChain as any)
					.mockReturnValueOnce(mockVariantChain as any);

				const { getProduct } =
					await import("../products");
				const result =
					await getProduct("sunset-tshirt");

				expect(result!.artPieceTitle)
					.toBe("Golden Sunset");
				expect(result!.artPieceDescription)
					.toBe(
						"A stunning golden sunset over the mountains");
				expect(result!.artPieceImageUrl)
					.toBe("/images/golden-sunset.webp");
			});

		it("getCategoryBySlug returns category or null",
			async () =>
			{
				const { db } =
					await import("../index");
				const selectSpy =
					vi.spyOn(db, "select");

				const mockChain =
					{
						from: vi
							.fn()
							.mockReturnThis(),
						where: vi
							.fn()
							.mockReturnThis(),
						limit: vi
							.fn()
							.mockResolvedValue(
								[
									{ id: "cat-1", name: "Apparel", slug: "apparel" }
								])
					};

				selectSpy.mockReturnValueOnce(mockChain as any);

				const { getCategoryBySlug } =
					await import("../products");
				const result =
					await getCategoryBySlug("apparel");
				expect(result).not.toBeNull();
				expect(result!.name)
					.toBe("Apparel");
			});
	});