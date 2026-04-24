import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProduct: ReturnType<typeof vi.fn> =
	vi.fn();
const mockGetRelatedProducts: ReturnType<typeof vi.fn> =
	vi
		.fn()
		.mockResolvedValue([]);
const mockAddToCart: ReturnType<typeof vi.fn> =
	vi.fn();
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.fn();

vi.mock(
	"$env/dynamic/private",
	() => (
		{
			env: {
				BASE_URL: "https://commerce.example.com"
			}
		}));

vi.mock(
	"$lib/server/db/products",
	() => (
		{
			getProduct: mockGetProduct,
			getRelatedProducts: mockGetRelatedProducts
		}));

vi.mock(
	"$lib/server/db/cart",
	() => (
		{
			addToCart: mockAddToCart
		}));

vi.mock(
	"$lib/server/log-forwarder",
	() => (
		{
			queueLog: mockQueueLog
		}));

vi.mock(
	"$lib/server/metrics",
	() => (
		{
			recordPageView: vi.fn(),
			recordCartAdd: vi.fn()
		}));

vi.mock(
	"$lib/utils/seo",
	() => (
		{
			generateProductJsonLd: vi
				.fn()
				.mockReturnValue(
					{ "@type": "Product" })
		}));

vi.mock(
	"@sveltejs/kit",
	() => (
		{
			error: (status: number, message: string) =>
			{
				const err: { status: number; message: string; } =
					{ status, message };
				throw err;
			},
			fail: (status: number, body: Record<string, string>) => (
				{ status, body })
		}));

vi.mock(
	"@seventysixcommerce/shared/utils",
	() => (
		{
			isNullOrUndefined: (value: unknown) =>
				value === null || value === undefined
		}));

/** Minimal product detail shape for load function assertions. */
const mockProduct: Record<string, unknown> =
	{
		id: "prod-uuid-001",
		title: "Cosmic Drift Print",
		slug: "cosmic-drift-print",
		description: "An art print.",
		seoDescription: "Buy online.",
		basePrice: "29.99",
		thumbnailUrl: "/images/cosmic-drift.jpg",
		ogImageUrl: null,
		isActive: true,
		artPieceId: "art-uuid-001",
		categorySlug: "prints",
		variants: [
			{
				id: "var-uuid-001",
				name: "8x10",
				printfulSyncVariantId: "pf-001",
				isAvailable: true
			}
		]
	};

describe("Product detail page server",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		describe("load",
			() =>
			{
				it("load_ReturnsProduct_WhenSlugExists",
					async () =>
					{
						mockGetProduct.mockResolvedValue(mockProduct);

						const { load } =
							await import("../+page.server");

						const result: unknown =
							await load(
								{
									params: { slug: "cosmic-drift-print", category: "prints" }
								} as never);

						expect(result)
							.toMatchObject(
								{
									product: mockProduct,
									jsonLd: expect.objectContaining(
										{ "@type": "Product" })
								});
					});

				it("load_Throws404_WhenProductNotFound",
					async () =>
					{
						mockGetProduct.mockResolvedValue(null);

						const { load } =
							await import("../+page.server");

						await expect(
							load(
								{
									params: { slug: "nonexistent-slug", category: "prints" }
								} as never))
							.rejects
							.toMatchObject(
								{
									status: 404,
									message: "Product not found"
								});
					});
			});

		describe("actions.addToCart",
			() =>
			{
				it("addToCart_AcceptsValidInput_AndCallsAddToCart",
					async () =>
					{
						mockAddToCart.mockResolvedValue(
							{ success: true });

						const formData: FormData =
							new FormData();
						formData.set("productId", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
						formData.set("variantId", "b2c3d4e5-f6a7-8901-bcde-f01234567891");
						formData.set("quantity", "1");

						const { actions } =
							await import("../+page.server");

						await actions.addToCart(
							{
								request: { formData: async () => formData } as never,
								locals: { cartSessionId: "c3d4e5f6-a7b8-9012-cdef-012345678902" } as never
							} as never);

						expect(mockAddToCart)
							.toHaveBeenCalledWith(
								"c3d4e5f6-a7b8-9012-cdef-012345678902",
								"a1b2c3d4-e5f6-7890-abcd-ef1234567890",
								"b2c3d4e5-f6a7-8901-bcde-f01234567891",
								1);
					});

				it("addToCart_RejectsInvalidInput_WhenProductIdIsMissing",
					async () =>
					{
						const formData: FormData =
							new FormData();
						formData.set("variantId", "var-uuid-001");
						formData.set("quantity", "1");

						const { actions } =
							await import("../+page.server");

						const result: { status: number; body: Record<string, string>; } =
							await actions.addToCart(
								{
									request: { formData: async () => formData } as never,
									locals: { cartSessionId: "session-uuid" } as never
								} as never) as { status: number; body: Record<string, string>; };

						expect(result.status)
							.toBe(400);
						expect(mockAddToCart)
							.not
							.toHaveBeenCalled();
					});
			});
	});