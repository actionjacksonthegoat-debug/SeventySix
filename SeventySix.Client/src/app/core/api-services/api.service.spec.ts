import { HttpParams, provideHttpClient, withFetch } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { z } from "zod";
import { environment } from "@environments/environment";
import { ApiService } from "./api.service";
import { setupSimpleServiceTest } from "@testing";

describe("ApiService", () =>
{
	let service: ApiService;
	let httpMock: HttpTestingController;
	const baseUrl = environment.apiUrl;
	let consoleErrorSpy: jasmine.Spy;

	beforeEach(() =>
	{
		// Suppress console.error during tests to avoid cluttering test output
		consoleErrorSpy = spyOn(console, "error");

		service = setupSimpleServiceTest(ApiService, [
			provideHttpClient(withFetch()),
			provideHttpClientTesting()
		]);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify(); // Verifies that no requests are outstanding
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("GET requests", () =>
	{
		it("should make a GET request with correct URL", () =>
		{
			const testData = {
				id: 1,
				name: "Test"
			};
			const endpoint = "test";

			service.get<typeof testData>(endpoint).subscribe((data) =>
			{
				expect(data).toEqual(testData);
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("GET");
			req.flush(testData);
		});

		it("should include query parameters when provided", () =>
		{
			const testData = {
				id: 1,
				name: "Test"
			};
			const endpoint = "test";
			const params = new HttpParams().set("key", "value");

			service.get<typeof testData>(endpoint, params).subscribe((data) =>
			{
				expect(data).toEqual(testData);
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}?key=value`);

			expect(req.request.method).toBe("GET");
			expect(req.request.params.get("key")).toBe("value");
			req.flush(testData);
		});
	});

	describe("POST requests", () =>
	{
		it("should make a POST request with correct body", () =>
		{
			const testData = {
				name: "Test"
			};
			const endpoint = "test";

			service
				.post<typeof testData>(endpoint, testData)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual(testData);
			req.flush(testData);
		});
	});

	describe("PUT requests", () =>
	{
		it("should make a PUT request with correct body", () =>
		{
			const testData = {
				id: 1,
				name: "Test"
			};
			const endpoint = "test/1";

			service
				.put<typeof testData>(endpoint, testData)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("PUT");
			expect(req.request.body).toEqual(testData);
			req.flush(testData);
		});
	});

	describe("PATCH requests", () =>
	{
		it("should make a PATCH request with correct partial body", () =>
		{
			const testData = {
				name: "Updated Test"
			};
			const endpoint = "test/1";

			service
				.patch<typeof testData>(endpoint, testData)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("PATCH");
			expect(req.request.body).toEqual(testData);
			req.flush(testData);
		});
	});

	describe("DELETE requests", () =>
	{
		it("should make a DELETE request to correct endpoint", () =>
		{
			const endpoint = "test/1";
			const response = {
				success: true
			};

			service
				.delete<{
					success: boolean;
				}>(endpoint)
				.subscribe((data) =>
				{
					expect(data).toEqual(response);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("DELETE");
			req.flush(response);
		});
	});

	describe("Header management", () =>
	{
		it("should include default Content-Type header", () =>
		{
			const endpoint = "test";
			const testData = {
				id: 1
			};

			service.get<typeof testData>(endpoint).subscribe();

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.headers.get("Content-Type")).toBe(
				"application/json"
			);
			req.flush(testData);
		});

		it("should allow adding custom headers", () =>
		{
			const endpoint = "test";
			const testData = {
				id: 1
			};
			const customHeaders = {
				Authorization: "Bearer token"
			};

			service.addHeaders(customHeaders);
			service.get<typeof testData>(endpoint).subscribe();

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.headers.get("Authorization")).toBe(
				"Bearer token"
			);
			expect(req.request.headers.get("Content-Type")).toBe(
				"application/json"
			);
			req.flush(testData);
		});
	});

	describe("Error handling", () =>
	{
		it("should handle client-side errors (ErrorEvent)", () =>
		{
			const endpoint = "test";
			const errorMessage = "Network error occurred";
			const errorEvent = new ErrorEvent("Network error", {
				message: errorMessage
			});

			service.get(endpoint).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Client-side error");
					expect(error.message).toContain(errorMessage);
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.error(errorEvent);
		});

		it("should handle server-side errors (HTTP error response)", () =>
		{
			const endpoint = "test";
			const errorStatus = 404;
			const errorStatusText = "Not Found";

			service.get(endpoint).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Server-side error");
					expect(error.message).toContain(errorStatus.toString());
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush("Not Found", {
				status: errorStatus,
				statusText: errorStatusText
			});
		});

		it("should handle errors in POST requests", () =>
		{
			const endpoint = "test";
			const testData = { name: "Test" };

			service.post(endpoint, testData).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Server-side error");
					expect(error.message).toContain("500");
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush("Internal Server Error", {
				status: 500,
				statusText: "Internal Server Error"
			});
		});

		it("should handle errors in PUT requests", () =>
		{
			const endpoint = "test/1";
			const testData = { id: 1, name: "Test" };

			service.put(endpoint, testData).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Server-side error");
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush("Unauthorized", {
				status: 401,
				statusText: "Unauthorized"
			});
		});

		it("should handle errors in PATCH requests", () =>
		{
			const endpoint = "test/1";
			const testData = { name: "Updated" };

			service.patch(endpoint, testData).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Server-side error");
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush("Bad Request", {
				status: 400,
				statusText: "Bad Request"
			});
		});

		it("should handle errors in DELETE requests", () =>
		{
			const endpoint = "test/1";

			service.delete(endpoint).subscribe({
				next: () => fail("should have failed with error"),
				error: (error: Error) =>
				{
					expect(error.message).toContain("Server-side error");
				}
			});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush("Forbidden", { status: 403, statusText: "Forbidden" });
		});
	});

	describe("Zod Schema Validation (Development Only)", () =>
	{
		const TestSchema: z.ZodType<{ id: number; name: string }> = z.object({
			id: z.number(),
			name: z.string()
		});

		it("should validate GET response with Zod schema in development", () =>
		{
			const testData = {
				id: 1,
				name: "Test"
			};
			const endpoint = "test";

			service
				.get<typeof testData>(endpoint, undefined, TestSchema)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("GET");
			req.flush(testData);
		});

		it("should throw error on invalid GET response schema in development", (done) =>
		{
			const invalidData = {
				id: "not-a-number",
				name: "Test"
			};
			const endpoint = "test";

			// Temporarily set production to false for this test
			const originalProduction: boolean = environment.production;

			environment.production = false;

			service
				.get<{
					id: number;
					name: string;
				}>(endpoint, undefined, TestSchema)
				.subscribe({
					next: () => fail("should have thrown validation error"),
					error: (error: Error) =>
					{
						expect(error.message).toContain("validation failed");
						environment.production = originalProduction;
						done();
					}
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush(invalidData);
		});

		it("should validate POST response with Zod schema in development", () =>
		{
			const testData = {
				id: 1,
				name: "Test"
			};
			const endpoint = "test";

			service
				.post<typeof testData>(endpoint, testData, TestSchema)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("POST");
			req.flush(testData);
		});

		it("should validate PUT response with Zod schema in development", () =>
		{
			const testData = {
				id: 1,
				name: "Updated"
			};
			const endpoint = "test/1";

			service
				.put<typeof testData>(endpoint, testData, TestSchema)
				.subscribe((data) =>
				{
					expect(data).toEqual(testData);
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			expect(req.request.method).toBe("PUT");
			req.flush(testData);
		});

		it("should skip validation in production mode", () =>
		{
			const invalidData = {
				id: "not-a-number" as unknown as number, // Type assertion for test
				name: "Test"
			};
			const endpoint = "test";

			// Temporarily set production to true
			const originalProduction: boolean = environment.production;
			environment.production = true;

			service
				.get<{
					id: number;
					name: string;
				}>(endpoint, undefined, TestSchema)
				.subscribe((data) =>
				{
					expect(data).toEqual(invalidData);
					environment.production = originalProduction;
				});

			const req = httpMock.expectOne(`${baseUrl}/${endpoint}`);

			req.flush(invalidData);
		});
	});
});
