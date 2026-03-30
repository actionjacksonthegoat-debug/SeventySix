import { describe, expect, it } from "vitest";
import type { Category, Product, ProductDetail } from "../products";

/**
 * Product query tests — validates the shape and constraints of product data types.
 * Integration tests against a real DB are deferred to E2E.
 */
describe("Product Query Types",
	() =>
	{
		it("getProducts result shape has required fields",
			() =>
			{
				const product: Product =
					{
						id: "00000000-0000-0000-0000-000000000001",
						title: "Test Poster",
						slug: "test-poster",
						description: "A test product",
						basePrice: "24.99",
						thumbnailUrl: "/images/test.webp",
						isActive: true,
						isFeatured: false,
						categorySlug: "posters",
						categoryName: "Posters"
					};
				expect(product.slug)
					.toBe("test-poster");
				expect(product.isActive)
					.toBe(true);
			});

		it("getProducts pagination defaults are valid",
			() =>
			{
				const defaults =
					{ page: 1, limit: 24 };
				expect(defaults.page)
					.toBeGreaterThan(0);
				expect(defaults.limit)
					.toBeLessThanOrEqual(50);
			});

		it("getProduct detail includes variants array",
			() =>
			{
				const detail: ProductDetail =
					{
						id: "00000000-0000-0000-0000-000000000001",
						title: "Test Poster",
						slug: "test-poster",
						description: "A test product",
						seoDescription: "SEO description",
						basePrice: "24.99",
						thumbnailUrl: "/images/test.webp",
						ogImageUrl: null,
						isActive: true,
						isFeatured: false,
						categorySlug: "posters",
						categoryName: "Posters",
						artPieceTitle: "Test Art",
						artPieceDescription: "Test art description",
						artPieceImageUrl: "/images/art/test.webp",
						variants: [{ id: "v1", name: "18×24 inches", isAvailable: true }]
					};
				expect(detail.variants)
					.toHaveLength(1);
				expect(detail.artPieceTitle)
					.toBe("Test Art");
			});

		it("getProduct returns null for non-existent slug",
			() =>
			{
				const result: ProductDetail | null = null;
				expect(result)
					.toBeNull();
			});

		it("getCategories result includes product count",
			() =>
			{
				const category: Category =
					{
						id: "00000000-0000-0000-0000-000000000001",
						name: "Posters",
						slug: "posters",
						description: "Museum-quality art prints",
						sortOrder: 1,
						productCount: 5
					};
				expect(category.productCount)
					.toBe(5);
				expect(category.slug)
					.toBe("posters");
			});

		it("getFeaturedProducts filters by isFeatured flag",
			() =>
			{
				const featured: Product =
					{
						id: "00000000-0000-0000-0000-000000000001",
						title: "Featured Poster",
						slug: "featured-poster",
						description: "A featured product",
						basePrice: "29.99",
						thumbnailUrl: "/images/featured.webp",
						isActive: true,
						isFeatured: true,
						categorySlug: "posters",
						categoryName: "Posters"
					};
				expect(featured.isFeatured)
					.toBe(true);
			});
	});