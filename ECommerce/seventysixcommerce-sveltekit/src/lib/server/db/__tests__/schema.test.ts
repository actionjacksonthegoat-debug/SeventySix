import { describe, expect, it } from "vitest";
import * as schema from "../schema";

describe("Database Schema",
	() =>
	{
		it("artPieces table has required columns",
			() =>
			{
				expect(schema.artPieces.id)
					.toBeDefined();
				expect(schema.artPieces.title)
					.toBeDefined();
				expect(schema.artPieces.slug)
					.toBeDefined();
				expect(schema.artPieces.description)
					.toBeDefined();
				expect(schema.artPieces.imageUrl)
					.toBeDefined();
				expect(schema.artPieces.tags)
					.toBeDefined();
				expect(schema.artPieces.createdAt)
					.toBeDefined();
			});

		it("products table has required columns",
			() =>
			{
				expect(schema.products.id)
					.toBeDefined();
				expect(schema.products.title)
					.toBeDefined();
				expect(schema.products.slug)
					.toBeDefined();
				expect(schema.products.basePrice)
					.toBeDefined();
				expect(schema.products.thumbnailUrl)
					.toBeDefined();
				expect(schema.products.artPieceId)
					.toBeDefined();
				expect(schema.products.categoryId)
					.toBeDefined();
				expect(schema.products.isActive)
					.toBeDefined();
				expect(schema.products.isFeatured)
					.toBeDefined();
			});

		it("products table references artPieces",
			() =>
			{
				expect(schema.products.artPieceId)
					.toBeDefined();
			});

		it("orders table has required columns",
			() =>
			{
				expect(schema.orders.id)
					.toBeDefined();
				expect(schema.orders.stripeSessionId)
					.toBeDefined();
				expect(schema.orders.email)
					.toBeDefined();
				expect(schema.orders.status)
					.toBeDefined();
				expect(schema.orders.totalAmount)
					.toBeDefined();
				expect(schema.orders.shippingAddress)
					.toBeDefined();
			});

		it("orders table has required status enum values",
			() =>
			{
				expect(schema.orderStatusEnum.enumValues)
					.toContain("pending");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("paid");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("fulfilling");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("shipped");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("delivered");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("cancelled");
				expect(schema.orderStatusEnum.enumValues)
					.toContain("refunded");
				expect(schema.orderStatusEnum.enumValues)
					.toContain(
						"fulfillment_error");
			});

		it("cartItems table has session reference",
			() =>
			{
				expect(schema.cartItems.sessionId)
					.toBeDefined();
				expect(schema.cartItems.productId)
					.toBeDefined();
				expect(schema.cartItems.variantId)
					.toBeDefined();
				expect(schema.cartItems.quantity)
					.toBeDefined();
				expect(schema.cartItems.unitPrice)
					.toBeDefined();
			});

		it("productVariants table has Printful sync ID",
			() =>
			{
				expect(schema.productVariants.printfulSyncVariantId)
					.toBeDefined();
			});

		it("orderItems table references orders",
			() =>
			{
				expect(schema.orderItems.orderId)
					.toBeDefined();
				expect(schema.orderItems.productId)
					.toBeDefined();
				expect(schema.orderItems.variantId)
					.toBeDefined();
				expect(schema.orderItems.quantity)
					.toBeDefined();
				expect(schema.orderItems.unitPrice)
					.toBeDefined();
			});

		it("orderStatusHistory table has audit fields",
			() =>
			{
				expect(schema.orderStatusHistory.orderId)
					.toBeDefined();
				expect(schema.orderStatusHistory.fromStatus)
					.toBeDefined();
				expect(schema.orderStatusHistory.toStatus)
					.toBeDefined();
				expect(schema.orderStatusHistory.changedAt)
					.toBeDefined();
				expect(schema.orderStatusHistory.reason)
					.toBeDefined();
			});

		it("categories table has sorting",
			() =>
			{
				expect(schema.categories.sortOrder)
					.toBeDefined();
				expect(schema.categories.slug)
					.toBeDefined();
			});
	});