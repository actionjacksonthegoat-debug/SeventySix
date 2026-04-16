import { describe, expect, it } from "vitest";
import {
	buildVariantNames,
	DEFAULT_ART_PIECES,
	DEFAULT_CATEGORIES,
	DEFAULT_PRODUCT_TEMPLATES
} from "../default-seed";

describe("DEFAULT_ART_PIECES",
	() =>
	{
		it("has exactly 3 items with correct slugs",
			() =>
			{
				expect(DEFAULT_ART_PIECES)
					.toHaveLength(3);
				expect(DEFAULT_ART_PIECES.map((piece) => piece.slug))
					.toEqual(
						["neon-horizon", "cosmic-garden", "electric-wilderness"]);
			});

		it("each item has required fields",
			() =>
			{
				for (const piece of DEFAULT_ART_PIECES)
				{
					expect(piece.title)
						.toBeTypeOf("string");
					expect(piece.slug)
						.toBeTypeOf("string");
					expect(piece.description)
						.toBeTypeOf("string");
					expect(piece.imageUrl)
						.toBeTypeOf("string");
					expect(piece.tags)
						.toBeInstanceOf(Array);
					expect(piece.tags.length)
						.toBeGreaterThan(0);
				}
			});
	});

describe("DEFAULT_CATEGORIES",
	() =>
	{
		it("has exactly 3 items in correct sort order",
			() =>
			{
				expect(DEFAULT_CATEGORIES)
					.toHaveLength(3);
				expect(DEFAULT_CATEGORIES[0]!.sortOrder)
					.toBe(1);
				expect(DEFAULT_CATEGORIES[1]!.sortOrder)
					.toBe(2);
				expect(DEFAULT_CATEGORIES[2]!.sortOrder)
					.toBe(3);
			});

		it("has correct slugs",
			() =>
			{
				expect(DEFAULT_CATEGORIES.map((cat) => cat.slug))
					.toEqual(
						["posters", "apparel", "mugs"]);
			});
	});

describe("DEFAULT_PRODUCT_TEMPLATES",
	() =>
	{
		it("generates 9 products (3 art x 3 categories)",
			() =>
			{
				expect(DEFAULT_PRODUCT_TEMPLATES)
					.toHaveLength(9);
			});

		it("each product template references correct art piece and category indices",
			() =>
			{
				const artSlugs: string[] =
					DEFAULT_ART_PIECES.map((piece) => piece.slug);

				for (const template of DEFAULT_PRODUCT_TEMPLATES)
				{
					expect(template.artPieceIndex)
						.toBeGreaterThanOrEqual(0);
					expect(template.artPieceIndex)
						.toBeLessThan(artSlugs.length);
					expect(template.categoryIndex)
						.toBeGreaterThanOrEqual(0);
					expect(template.categoryIndex)
						.toBeLessThan(DEFAULT_CATEGORIES.length);
				}
			});

		it("has expected price values as decimal strings",
			() =>
			{
				const prices: string[] =
					DEFAULT_PRODUCT_TEMPLATES.map((template) => template.basePrice);
				const uniquePrices: string[] =
					[...new Set(prices)];

				for (const price of uniquePrices)
				{
					expect(price)
						.toMatch(/^\d+\.\d{2}$/);
				}
			});
	});

describe("buildVariantNames",
	() =>
	{
		it("returns size variants for posters",
			() =>
			{
				const names: string[] =
					buildVariantNames("neon-horizon-poster");

				expect(names)
					.toEqual(
						["18×24 inches", "24×36 inches"]);
			});

		it("returns size variants for apparel",
			() =>
			{
				const names: string[] =
					buildVariantNames("neon-horizon-tee");

				expect(names)
					.toEqual(
						["Small", "Medium", "Large", "XL"]);
			});

		it("returns size variants for mugs",
			() =>
			{
				const names: string[] =
					buildVariantNames("neon-horizon-mug");

				expect(names)
					.toEqual(
						["11 oz", "15 oz"]);
			});

		it("returns empty array for unknown product type",
			() =>
			{
				const names: string[] =
					buildVariantNames("unknown-widget");

				expect(names)
					.toEqual([]);
			});
	});