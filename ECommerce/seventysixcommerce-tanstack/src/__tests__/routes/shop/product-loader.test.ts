import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProduct: ReturnType<typeof vi.fn> =
	vi.fn();
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.fn();
const mockRecordPageView: ReturnType<typeof vi.fn> =
	vi.fn();

vi.mock(
	"@tanstack/react-router",
	() => (
		{
			createFileRoute: vi
				.fn()
				.mockImplementation(
					() => (options: unknown) => options),
			Link: vi.fn(),
			useLoaderData: vi.fn(),
			useRouter: vi.fn()
		}));

vi.mock(
	"~/server/functions/products",
	() => (
		{
			getProduct: mockGetProduct
		}));

vi.mock(
	"~/server/functions/cart",
	() => (
		{
			addToCart: vi.fn()
		}));

vi.mock(
	"~/server/log-forwarder",
	() => (
		{
			queueLog: mockQueueLog
		}));

vi.mock(
	"~/server/metrics",
	() => (
		{
			recordPageView: mockRecordPageView
		}));

vi.mock(
	"~/components/seo/json-ld",
	() => (
		{
			generateBreadcrumbJsonLd: vi
				.fn()
				.mockReturnValue({}),
			generateProductJsonLd: vi
				.fn()
				.mockReturnValue({})
		}));

vi.mock(
	"~/components/seo/JsonLd",
	() => (
		{
			JsonLd: vi.fn()
		}));

vi.mock(
	"~/lib/constants",
	() => (
		{
			SITE_URL: "https://commerce.example.com"
		}));

vi.mock("react",
	async (importActual) =>
	{
		const actual: typeof import("react") =
			await importActual<typeof import("react")>();

		return {
			...actual,
			useState: actual.useState
		};
	});

/** Minimal product detail object for loader return-value assertions. */
const mockProduct: Record<string, unknown> =
	{
		id: "prod-uuid-001",
		title: "Cosmic Drift Print",
		slug: "cosmic-drift-print",
		description: "An art print of the cosmos drifting.",
		seoDescription: "Buy the Cosmic Drift Print online.",
		basePrice: "29.99",
		thumbnailUrl: "/images/cosmic-drift.jpg",
		ogImageUrl: "/images/cosmic-drift-og.jpg",
		isActive: true,
		isFeatured: false,
		artPieceId: "art-uuid-001",
		categoryId: "cat-uuid-001",
		artPieceTitle: "Cosmic Drift",
		artPieceDescription: "Cosmos artwork",
		artPieceImageUrl: "/images/cosmic-art.jpg",
		artPieceSlug: "cosmic-drift",
		categorySlug: "prints",
		categoryName: "Prints",
		variants: []
	};

describe("Shop product detail loader",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("productDetail_ReturnsProduct_WhenSlugMatches",
			async () =>
			{
				mockGetProduct.mockResolvedValue(mockProduct);

				const module: {
					Route: {
						loader: (ctx: { params: { slug: string; category: string; }; }) => Promise<unknown>;
					};
				} =
					await import("../../../routes/shop/$category/$slug") as unknown as {
						Route: {
							loader: (ctx: { params: { slug: string; category: string; }; }) => Promise<unknown>;
						};
					};

				const result: unknown =
					await module.Route.loader(
						{
							params: {
								slug: "cosmic-drift-print",
								category: "prints"
							}
						});

				expect(result)
					.toEqual(
						expect.objectContaining(
							{
								product: mockProduct,
								categorySlug: "prints"
							}));
				expect(mockGetProduct)
					.toHaveBeenCalledWith(
						{ data: { slug: "cosmic-drift-print" } });
			});

		it("productDetail_ThrowsError_WhenProductNotFound",
			async () =>
			{
				mockGetProduct.mockResolvedValue(null);

				const module: {
					Route: {
						loader: (ctx: { params: { slug: string; category: string; }; }) => Promise<unknown>;
					};
				} =
					await import("../../../routes/shop/$category/$slug") as unknown as {
						Route: {
							loader: (ctx: { params: { slug: string; category: string; }; }) => Promise<unknown>;
						};
					};

				await expect(
					module.Route.loader(
						{
							params: {
								slug: "nonexistent-product",
								category: "prints"
							}
						}))
					.rejects
					.toThrow("Product not found");
			});
	});