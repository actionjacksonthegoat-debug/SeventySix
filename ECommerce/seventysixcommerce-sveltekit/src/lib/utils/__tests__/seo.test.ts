import { describe, expect, it } from "vitest";
import {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd,
	generateProductJsonLd,
	generateWebSiteJsonLd
} from "../../utils/seo";

const TEST_BASE_URL: string = "https://seventysixcommerce-sveltekit.seventysixsandbox.com";

describe("SEO JSON-LD Generators",
	() =>
	{
		it("generates valid WebSite schema",
			() =>
			{
				const result =
					generateWebSiteJsonLd(TEST_BASE_URL);

				expect(result["@context"])
					.toBe("https://schema.org");
				expect(result["@type"])
					.toBe("WebSite");
				expect(result.name)
					.toBe("SeventySixCommerce");
				expect(result.url)
					.toBe(TEST_BASE_URL);
			});

		it("generates valid Product schema",
			() =>
			{
				const result =
					generateProductJsonLd(
						{
							title: "Sunset T-Shirt",
							slug: "sunset-tshirt",
							description: "A beautiful sunset tee",
							basePrice: "29.99",
							thumbnailUrl: "/images/sunset-tshirt.webp",
							ogImageUrl: "/images/sunset-tshirt-og.webp",
							categorySlug: "apparel",
							variants: [
								{ name: "Small", isAvailable: true },
								{ name: "Medium", isAvailable: true }
							]
						},
						TEST_BASE_URL);

				const offers =
					result.offers as Record<string, unknown>;
				expect(result["@type"])
					.toBe("Product");
				expect(result.name)
					.toBe("Sunset T-Shirt");
				expect(offers["@type"])
					.toBe("AggregateOffer");
				expect(offers.priceCurrency)
					.toBe("USD");
				expect(offers.lowPrice)
					.toBe("29.99");
			});

		it("includes brand as Organization",
			() =>
			{
				const result =
					generateProductJsonLd(
						{
							title: "Test",
							slug: "test",
							description: "Test",
							basePrice: "10.00",
							thumbnailUrl: "/test.webp",
							ogImageUrl: null,
							categorySlug: "prints",
							variants: [{ name: "Default", isAvailable: true }]
						},
						TEST_BASE_URL);

				const brand =
					result.brand as Record<string, unknown>;
				expect(brand["@type"])
					.toBe("Organization");
				expect(brand.name)
					.toBe("SeventySixCommerce");
			});

		it("sets availability to InStock when variants available",
			() =>
			{
				const result =
					generateProductJsonLd(
						{
							title: "Test",
							slug: "test",
							description: "Test",
							basePrice: "10.00",
							thumbnailUrl: "/test.webp",
							ogImageUrl: null,
							categorySlug: "prints",
							variants: [{ name: "Default", isAvailable: true }]
						},
						TEST_BASE_URL);

				const offers =
					result.offers as Record<string, unknown>;
				expect(offers.availability)
					.toBe("https://schema.org/InStock");
				expect(offers.offerCount)
					.toBe(1);
			});

		it("sets availability to OutOfStock when no variants available",
			() =>
			{
				const result =
					generateProductJsonLd(
						{
							title: "Test",
							slug: "test",
							description: "Test",
							basePrice: "10.00",
							thumbnailUrl: "/test.webp",
							ogImageUrl: null,
							categorySlug: "prints",
							variants: [{ name: "Default", isAvailable: false }]
						},
						TEST_BASE_URL);

				const offers =
					result.offers as Record<string, unknown>;
				expect(offers.availability)
					.toBe(
						"https://schema.org/OutOfStock");
				expect(offers.offerCount)
					.toBe(0);
			});

		it("generates valid BreadcrumbList",
			() =>
			{
				const result =
					generateBreadcrumbJsonLd(
						[
							{ name: "Home", url: "/" },
							{ name: "Shop", url: "/shop" },
							{ name: "Apparel", url: "/shop/apparel" }
						],
						TEST_BASE_URL);

				const items =
					result.itemListElement as Array<Record<string, unknown>>;
				expect(result["@type"])
					.toBe("BreadcrumbList");
				expect(items)
					.toHaveLength(3);
				expect(items[0].position)
					.toBe(1);
				expect(items[2].name)
					.toBe("Apparel");
			});

		it("generates valid CollectionPage schema",
			() =>
			{
				const result =
					generateCollectionPageJsonLd("Apparel", "apparel", 5, TEST_BASE_URL);

				expect(result["@type"])
					.toBe("CollectionPage");
				expect(result.name)
					.toContain("Apparel");
				expect(result.url)
					.toContain("/shop/apparel");
			});
	});