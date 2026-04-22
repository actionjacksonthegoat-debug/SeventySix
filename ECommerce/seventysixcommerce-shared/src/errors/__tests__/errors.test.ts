import { describe, expect, it } from "vitest";
import {
	cartEmptyError,
	checkoutFailedError,
	CommerceError,
	isCommerceError,
	itemsUnavailableError
} from "../index";

describe("CommerceError",
	() =>
	{
		it("creates an error with default status code 400",
			() =>
			{
				const error: CommerceError =
					new CommerceError("Something went wrong");

				expect(error.message)
					.toBe("Something went wrong");
				expect(error.statusCode)
					.toBe(400);
				expect(error.name)
					.toBe("CommerceError");
				expect(error)
					.toBeInstanceOf(Error);
			});

		it("creates an error with custom status code",
			() =>
			{
				const error: CommerceError =
					new CommerceError("Server error", 500);

				expect(error.statusCode)
					.toBe(500);
			});
	});

describe("cartEmptyError",
	() =>
	{
		it("creates a 400 error with cart empty message",
			() =>
			{
				const error: CommerceError =
					cartEmptyError();

				expect(error.message)
					.toBe("Cart is empty");
				expect(error.statusCode)
					.toBe(400);
			});
	});

describe("itemsUnavailableError",
	() =>
	{
		it("creates a 400 error listing unavailable product names",
			() =>
			{
				const error: CommerceError =
					itemsUnavailableError(
						["Print A", "Print B"]);

				expect(error.message)
					.toBe("The following items are no longer available: Print A, Print B");
				expect(error.statusCode)
					.toBe(400);
			});
	});

describe("checkoutFailedError",
	() =>
	{
		it("creates a 500 error for checkout failure",
			() =>
			{
				const error: CommerceError =
					checkoutFailedError();

				expect(error.message)
					.toBe("Failed to create checkout session");
				expect(error.statusCode)
					.toBe(500);
			});
	});

describe("isCommerceError",
	() =>
	{
		it("returns true for CommerceError instances",
			() =>
			{
				const error: CommerceError =
					new CommerceError("test");

				expect(isCommerceError(error))
					.toBe(true);
			});

		it("returns false for plain Error instances",
			() =>
			{
				const error: Error =
					new Error("test");

				expect(isCommerceError(error))
					.toBe(false);
			});
	});