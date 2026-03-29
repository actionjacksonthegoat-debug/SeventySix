import { beforeEach, describe, expect, it, vi } from "vitest";

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
		where: vi
			.fn()
			.mockReturnThis(),
		limit: vi
			.fn()
			.mockReturnValue([]),
		insert: vi
			.fn()
			.mockReturnThis(),
		values: vi
			.fn()
			.mockReturnThis(),
		returning: vi
			.fn()
			.mockReturnValue([]),
		update: vi
			.fn()
			.mockReturnThis(),
		set: vi
			.fn()
			.mockReturnThis(),
		delete: vi
			.fn()
			.mockReturnThis()
	}
}));

describe("Cart Operations",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.resetModules();
			});

		describe("getCart",
			() =>
			{
				it("returns cart items with product details",
					async () =>
					{
						const { db } =
							await import("../index");
						const selectSpy =
							vi.spyOn(db, "select");

						const mockItems =
							[
								{
									id: "ci-1",
									productId: "p-1",
									variantId: "v-1",
									quantity: 2,
									unitPrice: "29.99",
									productTitle: "Sunset T-Shirt",
									productSlug: "sunset-tshirt",
									variantName: "Medium",
									imageUrl: "/images/sunset.webp"
								}
							];

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
									.mockResolvedValue(mockItems)
							};

						selectSpy.mockReturnValueOnce(mockChain as any);

						const { getCart } =
							await import("../cart");
						const result =
							await getCart("session-1");

						expect(result)
							.toHaveLength(1);
						expect(result[0].productTitle)
							.toBe("Sunset T-Shirt");
						expect(result[0].quantity)
							.toBe(2);
					});

				it("returns empty cart for new session",
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
									.mockResolvedValue([])
							};

						selectSpy.mockReturnValueOnce(mockChain as any);

						const { getCart } =
							await import("../cart");
						const result =
							await getCart("new-session");

						expect(result)
							.toHaveLength(0);
					});
			});

		describe("addToCart",
			() =>
			{
				it("validates product exists and is active",
					async () =>
					{
						const { db } =
							await import("../index");
						const selectSpy =
							vi.spyOn(db, "select");

						// Product query returns empty (not found)
						const mockProductChain =
							{
								from: vi
									.fn()
									.mockReturnThis(),
								where: vi
									.fn()
									.mockReturnThis(),
								limit: vi
									.fn()
									.mockResolvedValue([])
							};

						selectSpy.mockReturnValueOnce(mockProductChain as any);

						const { addToCart } =
							await import("../cart");
						const result =
							await addToCart(
								"session-1",
								"invalid-product",
								"v-1",
								1);

						expect(result.success)
							.toBe(false);
						expect(result.error)
							.toBe("Product not available");
					});

				it("validates variant exists",
					async () =>
					{
						const { db } =
							await import("../index");
						const selectSpy =
							vi.spyOn(db, "select");

						// Product exists and is active
						const mockProductChain =
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
											{ id: "p-1", basePrice: "29.99", isActive: true }
										])
							};

						// Variant not found
						const mockVariantChain =
							{
								from: vi
									.fn()
									.mockReturnThis(),
								where: vi
									.fn()
									.mockReturnThis(),
								limit: vi
									.fn()
									.mockResolvedValue([])
							};

						selectSpy
							.mockReturnValueOnce(mockProductChain as any)
							.mockReturnValueOnce(mockVariantChain as any);

						const { addToCart } =
							await import("../cart");
						const result =
							await addToCart(
								"session-1",
								"p-1",
								"invalid-variant",
								1);

						expect(result.success)
							.toBe(false);
						expect(result.error)
							.toBe("Variant not available");
					});

				it("rejects quantity > 10",
					async () =>
					{
						const { db } =
							await import("../index");
						const selectSpy =
							vi.spyOn(db, "select");

						const mockProductChain =
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
											{ id: "p-1", basePrice: "29.99", isActive: true }
										])
							};

						const mockVariantChain =
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
										[{ id: "v-1", isAvailable: true }])
							};

						selectSpy
							.mockReturnValueOnce(mockProductChain as any)
							.mockReturnValueOnce(mockVariantChain as any);

						const { addToCart } =
							await import("../cart");
						const result =
							await addToCart("session-1", "p-1", "v-1", 11);

						expect(result.success)
							.toBe(false);
						expect(result.error)
							.toBe("Quantity must be between 1 and 10");
					});

				it("adds new item to cart",
					async () =>
					{
						const { db } =
							await import("../index");
						const selectSpy =
							vi.spyOn(db, "select");
						const insertSpy =
							vi.spyOn(db, "insert");

						const mockProductChain =
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
											{ id: "p-1", basePrice: "29.99", isActive: true }
										])
							};
						const mockVariantChain =
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
										[{ id: "v-1", isAvailable: true }])
							};
						// Session check (not found)
						const mockSessionChain =
							{
								from: vi
									.fn()
									.mockReturnThis(),
								where: vi
									.fn()
									.mockReturnThis(),
								limit: vi
									.fn()
									.mockResolvedValue([])
							};
						// Existing cart item check (not found)
						const mockCartItemChain =
							{
								from: vi
									.fn()
									.mockReturnThis(),
								where: vi
									.fn()
									.mockReturnThis(),
								limit: vi
									.fn()
									.mockResolvedValue([])
							};

						selectSpy
							.mockReturnValueOnce(mockProductChain as any)
							.mockReturnValueOnce(mockVariantChain as any)
							.mockReturnValueOnce(mockSessionChain as any)
							.mockReturnValueOnce(mockCartItemChain as any);

						// Session insert
						const mockSessionInsert =
							{
								values: vi
									.fn()
									.mockResolvedValue(undefined)
							};
						// Cart item insert
						const mockCartInsert =
							{
								values: vi
									.fn()
									.mockResolvedValue(undefined)
							};

						insertSpy
							.mockReturnValueOnce(mockSessionInsert as any)
							.mockReturnValueOnce(mockCartInsert as any);

						const { addToCart } =
							await import("../cart");
						const result =
							await addToCart("session-1", "p-1", "v-1", 1);

						expect(result.success)
							.toBe(true);
					});
			});

		describe("removeFromCart",
			() =>
			{
				it("removes item from cart",
					async () =>
					{
						const { db } =
							await import("../index");
						const deleteSpy =
							vi.spyOn(db, "delete");

						const mockChain =
							{
								where: vi
									.fn()
									.mockResolvedValue(undefined)
							};

						deleteSpy.mockReturnValueOnce(mockChain as any);

						const { removeFromCart } =
							await import("../cart");
						await removeFromCart("session-1", "ci-1");

						expect(deleteSpy)
							.toHaveBeenCalled();
					});
			});

		describe("updateCartItem",
			() =>
			{
				it("updates item quantity",
					async () =>
					{
						const { db } =
							await import("../index");
						const updateSpy =
							vi.spyOn(db, "update");

						const mockChain =
							{
								set: vi
									.fn()
									.mockReturnThis(),
								where: vi
									.fn()
									.mockResolvedValue(undefined)
							};

						updateSpy.mockReturnValueOnce(mockChain as any);

						const { updateCartItem } =
							await import("../cart");
						await updateCartItem("session-1", "ci-1", 3);

						expect(updateSpy)
							.toHaveBeenCalled();
					});

				it("removes item when quantity is 0",
					async () =>
					{
						const { db } =
							await import("../index");
						const deleteSpy =
							vi.spyOn(db, "delete");

						const mockChain =
							{
								where: vi
									.fn()
									.mockResolvedValue(undefined)
							};

						deleteSpy.mockReturnValueOnce(mockChain as any);

						const { updateCartItem } =
							await import("../cart");
						await updateCartItem("session-1", "ci-1", 0);

						expect(deleteSpy)
							.toHaveBeenCalled();
					});
			});
	});