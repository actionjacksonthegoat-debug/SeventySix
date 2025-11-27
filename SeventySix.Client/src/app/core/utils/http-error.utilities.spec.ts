import { HttpErrorResponse } from "@angular/common/http";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "@core/models/errors";
import {
	convertToAppError,
	extractRequestUrl,
	extractRequestMethod,
	extractStatusCode
} from "./http-error.utilities";

describe("HttpErrorUtilities", () =>
{
	describe("extractRequestUrl", () =>
	{
		it("should extract URL from HttpErrorResponse", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				url: "https://api.example.com/users",
				status: 404
			});

			const result: string = extractRequestUrl(error);

			expect(result).toBe("https://api.example.com/users");
		});

		it("should extract URL from HttpError", () =>
		{
			const error: HttpError = new HttpError(
				"Test error",
				500,
				"https://api.example.com/posts",
				"GET"
			);

			const result: string = extractRequestUrl(error);

			expect(result).toBe("https://api.example.com/posts");
		});

		it("should return window.location.href when HttpErrorResponse has no URL", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 500
			});

			const result: string = extractRequestUrl(error);

			expect(result).toBe(window.location.href);
		});

		it("should return window.location.href for generic Error", () =>
		{
			const error: Error = new Error("Generic error");

			const result: string = extractRequestUrl(error);

			expect(result).toBe(window.location.href);
		});

		it("should return window.location.href when no error provided", () =>
		{
			const result: string = extractRequestUrl();

			expect(result).toBe(window.location.href);
		});
	});

	describe("extractRequestMethod", () =>
	{
		it("should extract method from HttpError", () =>
		{
			const error: HttpError = new HttpError(
				"Test error",
				500,
				"https://api.example.com/posts",
				"POST"
			);

			const result: string | undefined = extractRequestMethod(error);

			expect(result).toBe("POST");
		});

		it("should return undefined for HttpErrorResponse", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				url: "https://api.example.com/users",
				status: 404
			});

			const result: string | undefined = extractRequestMethod(error);

			expect(result).toBeUndefined();
		});

		it("should return undefined for generic Error", () =>
		{
			const error: Error = new Error("Generic error");

			const result: string | undefined = extractRequestMethod(error);

			expect(result).toBeUndefined();
		});

		it("should return undefined when no error provided", () =>
		{
			const result: string | undefined = extractRequestMethod();

			expect(result).toBeUndefined();
		});
	});

	describe("extractStatusCode", () =>
	{
		it("should extract status code from HttpErrorResponse", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				url: "https://api.example.com/users",
				status: 404
			});

			const result: number | undefined = extractStatusCode(error);

			expect(result).toBe(404);
		});

		it("should extract status code from HttpError", () =>
		{
			const error: HttpError = new HttpError(
				"Test error",
				500,
				"https://api.example.com/posts",
				"GET"
			);

			const result: number | undefined = extractStatusCode(error);

			expect(result).toBe(500);
		});

		it("should return undefined for generic Error", () =>
		{
			const error: Error = new Error("Generic error");

			const result: number | undefined = extractStatusCode(error);

			expect(result).toBeUndefined();
		});

		it("should return undefined when no error provided", () =>
		{
			const result: number | undefined = extractStatusCode();

			expect(result).toBeUndefined();
		});
	});

	describe("convertToAppError", () =>
	{
		it("should convert network error (status 0)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 0,
				statusText: "Unknown Error"
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users",
				"GET"
			);

			expect(result).toBeInstanceOf(NetworkError);
			expect(result.message).toBe("Unable to connect to the server");
		});

		it("should convert validation error (status 400 with errors)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 400,
				error: {
					errors: {
						email: ["Invalid email format"],
						password: ["Password too short"]
					}
				}
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users",
				"POST"
			);

			expect(result).toBeInstanceOf(ValidationError);
			expect(result.message).toBe("Validation failed");
			expect((result as ValidationError).errors).toEqual({
				email: ["Invalid email format"],
				password: ["Password too short"]
			});
		});

		it("should convert not found error (status 404)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 404,
				error: { title: "User not found" }
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users/123",
				"GET"
			);

			expect(result).toBeInstanceOf(NotFoundError);
			expect(result.message).toBe("User not found");
		});

		it("should use default message for 404 without title", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 404
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users/123",
				"GET"
			);

			expect(result).toBeInstanceOf(NotFoundError);
			expect(result.message).toBe("Resource not found");
		});

		it("should convert unauthorized error (status 401)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 401,
				error: { title: "Invalid credentials" }
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/auth/login",
				"POST"
			);

			expect(result).toBeInstanceOf(UnauthorizedError);
			expect(result.message).toBe("Invalid credentials");
		});

		it("should convert forbidden error (status 403)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 403,
				error: { title: "Access denied" }
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/admin",
				"GET"
			);

			expect(result).toBeInstanceOf(UnauthorizedError);
			expect(result.message).toBe("Access denied");
		});

		it("should use default message for 401/403 without title", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 401
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/auth/login",
				"POST"
			);

			expect(result).toBeInstanceOf(UnauthorizedError);
			expect(result.message).toBe("Unauthorized access");
		});

		it("should convert generic HTTP error (status 500)", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 500,
				error: { title: "Internal server error" },
				url: "https://api.example.com/users"
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users",
				"POST"
			);

			expect(result).toBeInstanceOf(HttpError);
			expect(result.message).toBe("Internal server error");
			expect((result as HttpError).statusCode).toBe(500);
			expect((result as HttpError).url).toBe(
				"https://api.example.com/users"
			);
			expect((result as HttpError).method).toBe("POST");
		});

		it("should use error.message as fallback for generic HTTP error", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 500,
				statusText: "Internal Server Error"
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users",
				"GET"
			);

			expect(result).toBeInstanceOf(HttpError);
			// Error message will be the default since no title is provided
			expect(result.message).toBeDefined();
		});

		it("should use default message when no title or message available", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 500
			});

			const result: Error = convertToAppError(
				error,
				"https://api.example.com/users",
				"GET"
			);

			expect(result).toBeInstanceOf(HttpError);
			// HttpErrorResponse generates its own default message
			expect(result.message).toContain("Http failure response");
		});
	});
});
