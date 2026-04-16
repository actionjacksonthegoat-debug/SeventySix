import { describe, expect, it, vi } from "vitest";
import {
	getCategories,
	getFeaturedProducts,
	getProductBySlug,
	getProducts
} from "../products/index";
import type { CommerceDb } from "../types/index";

/**
 * Creates a mock database that returns the given result set.
 * Chains: select → from → innerJoin → leftJoin → where → groupBy → orderBy → limit → offset.
 */
function createMockDb(results: unknown[] = []): CommerceDb
{
	const chain: Record<string, unknown> =
		{
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
			groupBy: vi
				.fn()
				.mockReturnThis(),
			orderBy: vi
				.fn()
				.mockReturnThis(),
			limit: vi
				.fn()
				.mockReturnThis(),
			offset: vi
				.fn()
				.mockResolvedValue(results),
			then: vi.fn((resolve: (value: unknown) => void) =>
				resolve(results))
		};

	/* Make every method return the chain so calls like .select().from().where() work */
	for (const key of Object.keys(chain))
	{
		if (key !== "then")
		{
			(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
		}
	}

	return chain as unknown as CommerceDb;
}

describe("shared product queries",
	() =>
	{
		describe("getProducts",
			() =>
			{
				it("should return paginated results with correct pagination metadata",
					async () =>
					{
						const mockItems =
							[
								{
									id: "prod-1",
									title: "Test Product",
									slug: "test-product",
									description: "A test product",
									basePrice: "29.99",
									thumbnailUrl: "https://example.com/img.jpg",
									isFeatured: false,
									categorySlug: "tees",
									categoryName: "T-Shirts"
								}
							];

						const mockDb: CommerceDb =
							createMockDb(mockItems);

						/* Override the count query to return total */
						const selectFn =
							mockDb.select as ReturnType<typeof vi.fn>;
						let callCount: number = 0;
						selectFn.mockImplementation(
							(..._args: unknown[]) =>
							{
								callCount++;
								const countChain: Record<string, unknown> =
									{
										select: vi
											.fn()
											.mockReturnThis(),
										from: vi
											.fn()
											.mockReturnThis(),
										innerJoin: vi
											.fn()
											.mockReturnThis(),
										where: vi
											.fn()
											.mockResolvedValue(
												[{ total: 1 }]),
										orderBy: vi
											.fn()
											.mockReturnThis(),
										limit: vi
											.fn()
											.mockReturnThis(),
										offset: vi
											.fn()
											.mockResolvedValue(mockItems),
										then: vi.fn((resolve: (value: unknown) => void) =>
											callCount > 1
												? resolve(
													[{ total: 1 }])
												: resolve(mockItems))
									};

								for (const key of Object.keys(countChain))
								{
									if (key !== "then")
									{
										(countChain[key] as ReturnType<typeof vi.fn>).mockReturnValue(countChain);
									}
								}

								return countChain;
							});

						const result =
							await getProducts(
								mockDb,
								{ page: 1, limit: 12 });

						expect(result.items)
							.toHaveLength(1);
						expect(result.pagination.page)
							.toBe(1);
						expect(result.pagination.limit)
							.toBe(12);
					});

				it("should accept category filter parameter",
					async () =>
					{
						const mockDb: CommerceDb =
							createMockDb([]);

						const selectFn =
							mockDb.select as ReturnType<typeof vi.fn>;
						selectFn.mockImplementation(
							() =>
							{
								const chain: Record<string, unknown> =
									{
										select: vi
											.fn()
											.mockReturnThis(),
										from: vi
											.fn()
											.mockReturnThis(),
										innerJoin: vi
											.fn()
											.mockReturnThis(),
										where: vi
											.fn()
											.mockResolvedValue(
												[{ total: 0 }]),
										orderBy: vi
											.fn()
											.mockReturnThis(),
										limit: vi
											.fn()
											.mockReturnThis(),
										offset: vi
											.fn()
											.mockResolvedValue([]),
										then: vi.fn((resolve: (value: unknown) => void) =>
											resolve([]))
									};

								for (const key of Object.keys(chain))
								{
									if (key !== "then")
									{
										(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
									}
								}

								return chain;
							});

						const result =
							await getProducts(
								mockDb,
								{ category: "tees", page: 1, limit: 12 });

						expect(result.items)
							.toHaveLength(0);
						expect(result.pagination.total)
							.toBe(0);
					});
			});

		describe("getProductBySlug",
			() =>
			{
				it("should return product with variants and artPiece data",
					async () =>
					{
						const mockProduct =
							{
								id: "prod-1",
								title: "Test Product",
								slug: "test-product",
								description: "A test product",
								seoDescription: null,
								basePrice: "29.99",
								thumbnailUrl: "https://example.com/img.jpg",
								ogImageUrl: null,
								isActive: true,
								isFeatured: false,
								artPieceId: "art-1",
								categoryId: "cat-1",
								artPieceTitle: "Art Piece",
								artPieceDescription: "An art piece",
								artPieceImageUrl: "https://example.com/art.jpg",
								artPieceSlug: "art-piece",
								categorySlug: "tees",
								categoryName: "T-Shirts"
							};

						const mockVariants =
							[
								{
									id: "var-1",
									name: "Large / Black",
									printfulSyncVariantId: "sync_123",
									isAvailable: true
								}
							];

						const mockDb: CommerceDb =
							createMockDb([]);

						const selectFn =
							mockDb.select as ReturnType<typeof vi.fn>;
						let callIndex: number = 0;
						selectFn.mockImplementation(
							() =>
							{
								callIndex++;
								const isVariantQuery: boolean =
									callIndex > 1;

								const chain: Record<string, unknown> =
									{
										select: vi
											.fn()
											.mockReturnThis(),
										from: vi
											.fn()
											.mockReturnThis(),
										innerJoin: vi
											.fn()
											.mockReturnThis(),
										where: vi
											.fn()
											.mockResolvedValue(
												isVariantQuery ? mockVariants : [mockProduct]),
										limit: vi
											.fn()
											.mockResolvedValue(
												[mockProduct]),
										then: vi.fn((resolve: (value: unknown) => void) =>
											resolve(isVariantQuery ? mockVariants : [mockProduct]))
									};

								for (const key of Object.keys(chain))
								{
									if (key !== "then")
									{
										(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
									}
								}

								return chain;
							});

						const result =
							await getProductBySlug(mockDb, "test-product");

						expect(result)
							.not
							.toBeNull();
						expect(result?.slug)
							.toBe("test-product");
						expect(result?.variants)
							.toHaveLength(1);
						expect(result?.artPieceTitle)
							.toBe("Art Piece");
						expect(result?.artPieceSlug)
							.toBe("art-piece");
					});

				it("should return null for non-existent slug",
					async () =>
					{
						const mockDb: CommerceDb =
							createMockDb([]);

						const selectFn =
							mockDb.select as ReturnType<typeof vi.fn>;
						selectFn.mockImplementation(
							() =>
							{
								const chain: Record<string, unknown> =
									{
										select: vi
											.fn()
											.mockReturnThis(),
										from: vi
											.fn()
											.mockReturnThis(),
										innerJoin: vi
											.fn()
											.mockReturnThis(),
										where: vi
											.fn()
											.mockResolvedValue([]),
										limit: vi
											.fn()
											.mockResolvedValue([]),
										then: vi.fn((resolve: (value: unknown) => void) =>
											resolve([]))
									};

								for (const key of Object.keys(chain))
								{
									if (key !== "then")
									{
										(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
									}
								}

								return chain;
							});

						const result =
							await getProductBySlug(mockDb, "non-existent");

						expect(result)
							.toBeNull();
					});
			});

		describe("getCategories",
			() =>
			{
				it("should return categories with product counts",
					async () =>
					{
						const mockCategories =
							[
								{
									id: "cat-1",
									name: "T-Shirts",
									slug: "tees",
									description: "Cotton tees",
									sortOrder: 1,
									productCount: 5
								},
								{
									id: "cat-2",
									name: "Hoodies",
									slug: "hoodies",
									description: null,
									sortOrder: 2,
									productCount: 3
								}
							];

						const mockDb: CommerceDb =
							createMockDb(mockCategories);

						const result =
							await getCategories(mockDb);

						expect(result)
							.toHaveLength(2);
						expect(result[0].name)
							.toBe("T-Shirts");
						expect(result[0].productCount)
							.toBe(5);
						expect(result[1].slug)
							.toBe("hoodies");
					});
			});

		describe("getFeaturedProducts",
			() =>
			{
				it("should return only featured active products",
					async () =>
					{
						const mockFeatured =
							[
								{
									id: "prod-1",
									title: "Featured Product",
									slug: "featured",
									description: "A featured product",
									basePrice: "39.99",
									thumbnailUrl: "https://example.com/feat.jpg",
									categorySlug: "tees",
									categoryName: "T-Shirts"
								}
							];

						const mockDb: CommerceDb =
							createMockDb(mockFeatured);

						const result =
							await getFeaturedProducts(mockDb);

						expect(result)
							.toHaveLength(1);
						expect(result[0].title)
							.toBe("Featured Product");
					});

				it("should respect optional limit parameter",
					async () =>
					{
						const mockFeatured =
							[
								{
									id: "prod-1",
									title: "Featured 1",
									slug: "featured-1",
									description: "First",
									basePrice: "29.99",
									thumbnailUrl: "https://example.com/1.jpg",
									categorySlug: "tees",
									categoryName: "T-Shirts"
								}
							];

						const mockDb: CommerceDb =
							createMockDb(mockFeatured);

						const limitFn =
							(mockDb as unknown as Record<string, ReturnType<typeof vi.fn>>).limit;

						const result =
							await getFeaturedProducts(mockDb, 6);

						expect(result)
							.toHaveLength(1);
						expect(limitFn)
							.toHaveBeenCalledWith(6);
					});
			});
	});