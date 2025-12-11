import { HttpErrorResponse } from "@angular/common/http";
import {
	extractValidationErrors,
	extractHttpStatus,
	extractErrorTitle
} from "./http-error.utility";

describe("HTTP Error Utilities", () =>
{
	describe("extractValidationErrors", () =>
	{
		it("should return empty array for errors without error.errors", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: null,
					status: 400
				});

			const result: string[] = extractValidationErrors(error);

			expect(result).toEqual([]);
		});

		it("should extract validation errors for single field", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: {
						errors: {
							Email: ["Email is required", "Invalid format"]
						}
					},
					status: 422
				});

			const result: string[] = extractValidationErrors(error);

			expect(result).toEqual([
				"Email: Email is required",
				"Email: Invalid format"
			]);
		});

		it("should extract validation errors for multiple fields", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: {
						errors: {
							Email: ["Email is required"],
							Password: ["Password is too short"]
						}
					},
					status: 422
				});

			const result: string[] = extractValidationErrors(error);

			expect(result).toContain("Email: Email is required");
			expect(result).toContain("Password: Password is too short");
			expect(result.length).toBe(2);
		});

		it("should return empty array for non-array error messages", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: {
						errors: {
							Email: "Not an array"
						}
					},
					status: 422
				});

			const result: string[] = extractValidationErrors(error);

			expect(result).toEqual([]);
		});
	});

	describe("extractHttpStatus", () =>
	{
		it("should return status string for HTTP errors", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					status: 404,
					statusText: "Not Found"
				});

			const result: string | null = extractHttpStatus(error);

			expect(result).toBe("Status: 404 Not Found");
		});

		it("should return null for status 0", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					status: 0,
					statusText: ""
				});

			const result: string | null = extractHttpStatus(error);

			expect(result).toBeNull();
		});
	});

	describe("extractErrorTitle", () =>
	{
		it("should return null if no title in error.error", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: null
				});

			const result: string | null =
				extractErrorTitle(error, "User message");

			expect(result).toBeNull();
		});

		it("should return null if title equals user message", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: {
						title: "Same message"
					}
				});

			const result: string | null =
				extractErrorTitle(error, "Same message");

			expect(result).toBeNull();
		});

		it("should return title if different from user message", () =>
		{
			const error: HttpErrorResponse =
				new HttpErrorResponse({
					error: {
						title: "Technical error"
					}
				});

			const result: string | null =
				extractErrorTitle(error, "User-friendly message");

			expect(result).toBe("Technical error");
		});
	});
});
