import { describe, expect, it } from "vitest";
import {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd,
	generateProductJsonLd,
	generateWebSiteJsonLd
} from "../json-ld";
import type { BreadcrumbItem, ProductForJsonLd } from "../json-ld";

const BASE_URL: string = "https://example.com";

describe("generateWebSiteJsonLd",
	() =>
	{
		it("returns valid WebSite schema with correct context, type, name, and url",
			() =>
			{
				const result: Record<string, unknown> =
					generateWebSiteJsonLd(BASE_URL);

				expect(result["@context"])
					.toBe("https://schema.org");
				expect(result["@type"])
					.toBe("WebSite");
				expect(result.name)
					.toBe("SeventySixCommerce");
				expect(result.url)
					.toBe(BASE_URL);
				expect(result.description)
					.toBeTypeOf("string");
			});
	});

describe("generateProductJsonLd",
	() =>
	{
		const product: ProductForJsonLd =
			{
				title: "Test Product",
				slug: "test-product",
				description: "A test product for JSON-LD generation.",
				basePrice: "24.99",
				thumbnailUrl: "/images/test-thumb.jpg",
				ogImageUrl: "/images/test-og.jpg",
				categorySlug: "posters",
				variants: [
					{ name: "Small", isAvailable: true },
					{ name: "Medium", isAvailable: true },
					{ name: "Large", isAvailable: false }
				]
			};

		it("returns valid Product schema with price, availability, image, and breadcrumb",
			() =>
			{
				const result: Record<string, unknown> =
					generateProductJsonLd(product, BASE_URL);

				expect(result["@context"])
					.toBe("https://schema.org");
				expect(result["@type"])
					.toBe("Product");
				expect(result.name)
					.toBe("Test Product");
				expect(result.description)
					.toBe("A test product for JSON-LD generation.");
				expect(result.image)
					.toBe("/images/test-og.jpg");
				expect(result.url)
					.toBe(`${BASE_URL}/shop/posters/test-product`);

				const brand =
					result.brand as Record<string, unknown>;
				expect(brand["@type"])
					.toBe("Organization");
				expect(brand.name)
					.toBe("SeventySixCommerce");

				const offers =
					result.offers as Record<string, unknown>;
				expect(offers["@type"])
					.toBe("AggregateOffer");
				expect(offers.priceCurrency)
					.toBe("USD");
				expect(offers.lowPrice)
					.toBe("24.99");
				expect(offers.highPrice)
					.toBe("24.99");
				expect(offers.offerCount)
					.toBe(2);
				expect(offers.availability)
					.toBe("https://schema.org/InStock");
			});

		it("uses thumbnailUrl when ogImageUrl is null",
			() =>
			{
				const productNoOg: ProductForJsonLd =
					{
						...product,
						ogImageUrl: null
					};

				const result: Record<string, unknown> =
					generateProductJsonLd(productNoOg, BASE_URL);

				expect(result.image)
					.toBe("/images/test-thumb.jpg");
			});

		it("returns OutOfStock availability when no variants are available",
			() =>
			{
				const productNoStock: ProductForJsonLd =
					{
						...product,
						variants: [
							{ name: "Small", isAvailable: false },
							{ name: "Medium", isAvailable: false }
						]
					};

				const result: Record<string, unknown> =
					generateProductJsonLd(productNoStock, BASE_URL);

				const offers =
					result.offers as Record<string, unknown>;
				expect(offers.offerCount)
					.toBe(0);
				expect(offers.availability)
					.toBe("https://schema.org/OutOfStock");
			});
	});

describe("generateBreadcrumbJsonLd",
	() =>
	{
		it("returns correct BreadcrumbList with itemListElement positions",
			() =>
			{
				const items: BreadcrumbItem[] =
					[
						{ name: "Home", url: "/" },
						{ name: "Shop", url: "/shop" },
						{ name: "Posters", url: "/shop/posters" }
					];

				const result: Record<string, unknown> =
					generateBreadcrumbJsonLd(items, BASE_URL);

				expect(result["@context"])
					.toBe("https://schema.org");
				expect(result["@type"])
					.toBe("BreadcrumbList");

				const elements =
					result.itemListElement as Array<Record<string, unknown>>;
				expect(elements)
					.toHaveLength(3);
				expect(elements[0]!.position)
					.toBe(1);
				expect(elements[0]!.name)
					.toBe("Home");
				expect(elements[0]!.item)
					.toBe(`${BASE_URL}/`);
				expect(elements[2]!.position)
					.toBe(3);
				expect(elements[2]!.item)
					.toBe(`${BASE_URL}/shop/posters`);
			});
	});

describe("generateCollectionPageJsonLd",
	() =>
	{
		it("returns valid CollectionPage schema",
			() =>
			{
				const result: Record<string, unknown> =
					generateCollectionPageJsonLd(
						"Posters",
						"posters",
						9,
						BASE_URL);

				expect(result["@context"])
					.toBe("https://schema.org");
				expect(result["@type"])
					.toBe("CollectionPage");
				expect(result.name)
					.toBe("Posters — SeventySixCommerce");
				expect(result.url)
					.toBe(`${BASE_URL}/shop/posters`);
				expect(result.description)
					.toBe("Browse 9 posters products at SeventySixCommerce.");
			});
	});