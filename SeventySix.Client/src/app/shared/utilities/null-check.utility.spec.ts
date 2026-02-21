import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	isNonNullObject,
	isNullOrEmpty,
	isNullOrUndefined,
	isNullOrWhitespace,
	isPresent
} from "./null-check.utility";

describe("Null Check Utilities",
	() =>
	{
		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [provideZonelessChangeDetection()]
					});
			});

		describe("isNullOrUndefined",
			() =>
			{
				it("should return true for null",
					() =>
					{
						expect(isNullOrUndefined(null))
							.toBe(true);
					});

				it("should return true for undefined",
					() =>
					{
						expect(isNullOrUndefined(undefined))
							.toBe(true);
					});

				it("should return false for empty string",
					() =>
					{
						expect(isNullOrUndefined(""))
							.toBe(false);
					});

				it("should return false for zero",
					() =>
					{
						expect(isNullOrUndefined(0))
							.toBe(false);
					});

				it("should return false for boolean false",
					() =>
					{
						expect(isNullOrUndefined(false))
							.toBe(false);
					});

				it("should return false for non-empty string",
					() =>
					{
						expect(isNullOrUndefined("test"))
							.toBe(false);
					});

				it("should return false for object",
					() =>
					{
						expect(isNullOrUndefined({}))
							.toBe(false);
					});
			});

		describe("isPresent",
			() =>
			{
				it("should return false for null",
					() =>
					{
						expect(isPresent(null))
							.toBe(false);
					});

				it("should return false for undefined",
					() =>
					{
						expect(isPresent(undefined))
							.toBe(false);
					});

				it("should return true for empty string",
					() =>
					{
						expect(isPresent(""))
							.toBe(true);
					});

				it("should return true for zero",
					() =>
					{
						expect(isPresent(0))
							.toBe(true);
					});

				it("should return true for boolean false",
					() =>
					{
						expect(isPresent(false))
							.toBe(true);
					});

				it("should return true for non-empty string",
					() =>
					{
						expect(isPresent("test"))
							.toBe(true);
					});

				it("should return true for object",
					() =>
					{
						expect(isPresent({}))
							.toBe(true);
					});

				it("should narrow type correctly",
					() =>
					{
						const value: string | null = "test";
						if (isPresent(value))
						{
							// TypeScript should know value is string here
							const length: number =
								value.length;
							expect(length)
								.toBe(4);
						}
					});
			});

		describe("isNullOrEmpty",
			() =>
			{
				it("should return true for null",
					() =>
					{
						expect(isNullOrEmpty(null))
							.toBe(true);
					});

				it("should return true for undefined",
					() =>
					{
						expect(isNullOrEmpty(undefined))
							.toBe(true);
					});

				it("should return true for empty string",
					() =>
					{
						expect(isNullOrEmpty(""))
							.toBe(true);
					});

				it("should return false for non-empty string",
					() =>
					{
						expect(isNullOrEmpty("test"))
							.toBe(false);
					});

				it("should return false for whitespace string",
					() =>
					{
						expect(isNullOrEmpty(" "))
							.toBe(false);
					});
			});

		describe("isNullOrWhitespace",
			() =>
			{
				it("should return true for null",
					() =>
					{
						expect(isNullOrWhitespace(null))
							.toBe(true);
					});

				it("should return true for undefined",
					() =>
					{
						expect(isNullOrWhitespace(undefined))
							.toBe(true);
					});

				it("should return true for empty string",
					() =>
					{
						expect(isNullOrWhitespace(""))
							.toBe(true);
					});

				it("should return true for whitespace-only string",
					() =>
					{
						expect(isNullOrWhitespace(" "))
							.toBe(true);
					});

				it("should return true for multiple whitespace characters",
					() =>
					{
						expect(isNullOrWhitespace("   "))
							.toBe(true);
					});

				it("should return true for tabs and newlines",
					() =>
					{
						expect(isNullOrWhitespace("\t\n  "))
							.toBe(true);
					});

				it("should return false for non-empty string",
					() =>
					{
						expect(isNullOrWhitespace("test"))
							.toBe(false);
					});

				it("should return false for string with content and whitespace",
					() =>
					{
						expect(isNullOrWhitespace(" test "))
							.toBe(false);
					});
			});

		describe("isNonNullObject",
			() =>
			{
				it("should return false for null",
					() =>
					{
						expect(isNonNullObject(null))
							.toBe(false);
					});

				it("should return false for undefined",
					() =>
					{
						expect(isNonNullObject(undefined))
							.toBe(false);
					});

				it("should return false for string",
					() =>
					{
						expect(isNonNullObject("test"))
							.toBe(false);
					});

				it("should return false for number",
					() =>
					{
						expect(isNonNullObject(123))
							.toBe(false);
					});

				it("should return false for boolean",
					() =>
					{
						expect(isNonNullObject(true))
							.toBe(false);
					});

				it("should return false for array",
					() =>
					{
						expect(isNonNullObject([]))
							.toBe(false);
					});

				it("should return true for plain object",
					() =>
					{
						expect(isNonNullObject({}))
							.toBe(true);
					});

				it("should return true for object with properties",
					() =>
					{
						expect(isNonNullObject(
							{ name: "test" }))
							.toBe(true);
					});

				it("should narrow type correctly",
					() =>
					{
						const value: unknown =
							{ message: "error" };
						if (isNonNullObject(value))
						{
							// TypeScript knows value is Record<string, unknown> here
							expect("message" in value)
								.toBe(true);
							expect(value["message"])
								.toBe("error");
						}
					});
			});
	});