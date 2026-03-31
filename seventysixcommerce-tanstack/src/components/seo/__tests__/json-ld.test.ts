import { describe, expect, it } from "vitest";
import type { ProductDetail } from "~/server/functions/products";
import {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd,
	generateProductJsonLd,
	generateWebSiteJsonLd
} from "../json-ld";

const mockProduct: ProductDetail =
	{
		id: "00000000-0000-0000-0000-000000000001",
		title: "Neon Horizon — Premium Poster",
		slug: "neon-horizon-poster",
		description: "Museum-quality poster.",
		seoDescription: "Buy the Neon Horizon art poster.",
		basePrice: "24.99",
		thumbnailUrl: "/images/products/neon-horizon-poster-thumb.webp",
		ogImageUrl: null,
		isActive: true,
		isFeatured: true,
		categorySlug: "posters",
		categoryName: "Posters",
		artPieceTitle: "Neon Horizon",
		artPieceDescription: "A vibrant sunset cityscape.",
		artPieceImageUrl: "/images/art/neon-horizon.webp",
		variants: [
			{ id: "v1", name: "18×24 inches", isAvailable: true },
			{ id: "v2", name: "24×36 inches", isAvailable: true }
		]
	};

describe("Product JSON-LD",
	() =>
	{
		it("generates valid Product schema",
			() =>
			{
				const jsonLd =
					generateProductJsonLd(mockProduct, "posters") as Record<
						string,
						unknown>;
				expect(jsonLd["@context"])
					.toBe("https://schema.org");
				expect(jsonLd["@type"])
					.toBe("Product");
				expect(jsonLd["name"])
					.toBe("Neon Horizon — Premium Poster");
				expect(jsonLd["sku"])
					.toBe("neon-horizon-poster");
			});

		it("includes AggregateOffer with correct price range",
			() =>
			{
				const jsonLd =
					generateProductJsonLd(mockProduct, "posters") as Record<
						string,
						unknown>;
				const offers =
					jsonLd["offers"] as Record<string, unknown>;
				expect(offers["@type"])
					.toBe("AggregateOffer");
				expect(offers["priceCurrency"])
					.toBe("USD");
				expect(offers["lowPrice"])
					.toBe("24.99");
				expect(offers["offerCount"])
					.toBe(2);
			});

		it("includes brand as Organization",
			() =>
			{
				const jsonLd =
					generateProductJsonLd(mockProduct, "posters") as Record<
						string,
						unknown>;
				const brand =
					jsonLd["brand"] as Record<string, unknown>;
				expect(brand["@type"])
					.toBe("Organization");
				expect(brand["name"])
					.toBe("SeventySixCommerce");
			});

		it("sets availability to InStock",
			() =>
			{
				const jsonLd =
					generateProductJsonLd(mockProduct, "posters") as Record<
						string,
						unknown>;
				const offers =
					jsonLd["offers"] as Record<string, unknown>;
				expect(offers["availability"])
					.toBe("https://schema.org/InStock");
			});

		it("generates valid BreadcrumbList",
			() =>
			{
				const breadcrumbs =
					generateBreadcrumbJsonLd(
						[
							{
								name: "Home",
								url: "https://seventysixcommerce-tanstack.seventysixsandbox.com/"
							},
							{
								name: "Posters",
								url: "https://seventysixcommerce-tanstack.seventysixsandbox.com/shop/posters"
							},
							{
								name: "Neon Horizon",
								url: "https://seventysixcommerce-tanstack.seventysixsandbox.com/shop/posters/neon-horizon-poster"
							}
						]) as Record<string, unknown>;

				expect(breadcrumbs["@type"])
					.toBe("BreadcrumbList");
				const items =
					breadcrumbs["itemListElement"] as Array<
						Record<string, unknown>>;
				expect(items)
					.toHaveLength(3);
				expect(items[0]["position"])
					.toBe(1);
				expect(items[2]["position"])
					.toBe(3);
			});
	});

describe("WebSite JSON-LD",
	() =>
	{
		it("generates WebSite schema with search action",
			() =>
			{
				const jsonLd =
					generateWebSiteJsonLd() as Record<string, unknown>;
				expect(jsonLd["@type"])
					.toBe("WebSite");
				expect(jsonLd["name"])
					.toBe("SeventySixCommerce");
				const action =
					jsonLd["potentialAction"] as Record<string, unknown>;
				expect(action["@type"])
					.toBe("SearchAction");
			});
	});

describe("CollectionPage JSON-LD",
	() =>
	{
		it("generates CollectionPage schema with item list",
			() =>
			{
				const jsonLd =
					generateCollectionPageJsonLd("Posters", "posters",
						[
							{
								id: "1",
								title: "Poster A",
								slug: "poster-a",
								description: "A",
								basePrice: "20",
								thumbnailUrl: "/a.webp",
								isActive: true,
								isFeatured: false,
								categorySlug: "posters",
								categoryName: "Posters"
							},
							{
								id: "2",
								title: "Poster B",
								slug: "poster-b",
								description: "B",
								basePrice: "25",
								thumbnailUrl: "/b.webp",
								isActive: true,
								isFeatured: true,
								categorySlug: "posters",
								categoryName: "Posters"
							}
						]) as Record<string, unknown>;

				expect(jsonLd["@type"])
					.toBe("CollectionPage");
				const mainEntity =
					jsonLd["mainEntity"] as Record<string, unknown>;
				const items =
					mainEntity["itemListElement"] as Array<
						Record<string, unknown>>;
				expect(items)
					.toHaveLength(2);
			});
	});