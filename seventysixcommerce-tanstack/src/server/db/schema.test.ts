import { describe, expect, it } from "vitest";
import * as schema from "./schema";

/**
 * Schema smoke tests — verify all tables and enums are exported correctly.
 */
describe("Database schema exports",
	() =>
	{
		it("should export artPieces table",
			() =>
			{
				expect(schema.artPieces)
					.toBeDefined();
			});

		it("should export categories table",
			() =>
			{
				expect(schema.categories)
					.toBeDefined();
			});

		it("should export products table",
			() =>
			{
				expect(schema.products)
					.toBeDefined();
			});

		it("should export productVariants table",
			() =>
			{
				expect(schema.productVariants)
					.toBeDefined();
			});

		it("should export cartSessions table",
			() =>
			{
				expect(schema.cartSessions)
					.toBeDefined();
			});

		it("should export cartItems table",
			() =>
			{
				expect(schema.cartItems)
					.toBeDefined();
			});

		it("should export orders table",
			() =>
			{
				expect(schema.orders)
					.toBeDefined();
			});

		it("should export orderItems table",
			() =>
			{
				expect(schema.orderItems)
					.toBeDefined();
			});

		it("should export orderStatusHistory table",
			() =>
			{
				expect(schema.orderStatusHistory)
					.toBeDefined();
			});

		it("should export orderStatusEnum",
			() =>
			{
				expect(schema.orderStatusEnum)
					.toBeDefined();
			});
	});