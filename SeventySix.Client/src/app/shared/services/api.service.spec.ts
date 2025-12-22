import { HttpParams, provideHttpClient, withFetch } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { setupSimpleServiceTest } from "@shared/testing";
import { ApiService } from "./api.service";

describe("ApiService",
	() =>
	{
		let service: ApiService;
		let httpMock: HttpTestingController;

		// baseUrl is defined as a getter to ensure environment is resolved after module load
		const getBaseUrl: () => string =
			() => environment.apiUrl;

		beforeEach(
			() =>
			{
				// Suppress expected console.error output from error handling tests
				vi.spyOn(console, "error")
					.mockImplementation(
						() =>
						{});

				service =
					setupSimpleServiceTest(ApiService,
						[
							provideHttpClient(withFetch()),
							provideHttpClientTesting()
						]);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify(); // Verifies that no requests are outstanding
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("GET requests",
			() =>
			{
				it("should make a GET request with correct URL",
					() =>
					{
						const testData: { id: number; name: string; } =
							{
								id: 1,
								name: "Test"
							};
						const endpoint: string = "test";

						service
							.get<typeof testData>(endpoint)
							.subscribe(
								(data: typeof testData) =>
								{
									expect(data)
										.toEqual(testData);
								});

						const req: import("@angular/common/http/testing").TestRequest =
							httpMock.expectOne(
								`${getBaseUrl()}/${endpoint}`);

						expect(req.request.method)
							.toBe("GET");
						req.flush(testData);
					});

				it("should include query parameters when provided",
					() =>
					{
						const testData: { id: number; name: string; } =
							{
								id: 1,
								name: "Test"
							};
						const endpoint: string = "test";
						const params: HttpParams =
							new HttpParams()
								.set("key", "value");

						service
							.get<typeof testData>(endpoint, params)
							.subscribe(
								(data: typeof testData) =>
								{
									expect(data)
										.toEqual(testData);
								});

						const req: import("@angular/common/http/testing").TestRequest =
							httpMock.expectOne(
								`${getBaseUrl()}/${endpoint}?key=value`);

						expect(req.request.method)
							.toBe("GET");
						expect(req.request.params.get("key"))
							.toBe("value");
						req.flush(testData);
					});
			});

		describe("POST requests",
			() =>
			{
				it("should make a POST request with correct body",
					() =>
					{
						const testData: { name: string; } =
							{
								name: "Test"
							};
						const endpoint: string = "test";

						service
							.post(endpoint, testData)
							.subscribe(
								{
									next(data: unknown)
									{
										expect(data)
											.toEqual(testData);
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.method)
							.toBe("POST");
						expect(request.request.body)
							.toEqual(testData);
						request.flush(testData);
					});
			});

		describe("PUT requests",
			() =>
			{
				it("should make a PUT request with correct body",
					() =>
					{
						const testData: { id: number; name: string; } =
							{
								id: 1,
								name: "Test"
							};
						const endpoint: string = "test/1";

						service
							.put<typeof testData>(endpoint, testData)
							.subscribe(
								(data: { id: number; name: string; }) =>
								{
									expect(data)
										.toEqual(testData);
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.method)
							.toBe("PUT");
						expect(request.request.body)
							.toEqual(testData);
						request.flush(testData);
					});
			});

		describe("PATCH requests",
			() =>
			{
				it("should make a PATCH request with correct partial body",
					() =>
					{
						const testData: { name: string; } =
							{
								name: "Updated Test"
							};
						const endpoint: string = "test/1";

						service
							.patch<typeof testData>(endpoint, testData)
							.subscribe(
								(data: { name: string; }) =>
								{
									expect(data)
										.toEqual(testData);
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.method)
							.toBe("PATCH");
						expect(request.request.body)
							.toEqual(testData);
						request.flush(testData);
					});
			});

		describe("DELETE requests",
			() =>
			{
				it("should make a DELETE request to correct endpoint",
					() =>
					{
						const endpoint: string = "test/1";
						const response: { success: boolean; } =
							{
								success: true
							};

						service
							.delete<{
							success: boolean;
						}>(endpoint)
							.subscribe(
								(data: { success: boolean; }) =>
								{
									expect(data)
										.toEqual(response);
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.method)
							.toBe("DELETE");
						request.flush(response);
					});
			});

		describe("Header management",
			() =>
			{
				it("should include default Content-Type header",
					() =>
					{
						const endpoint: string = "test";
						const testData: { id: number; } =
							{
								id: 1
							};

						service
							.get<typeof testData>(endpoint)
							.subscribe();

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.headers.get("Content-Type"))
							.toBe(
								"application/json");
						request.flush(testData);
					});

				it("should allow adding custom headers",
					() =>
					{
						const endpoint: string = "test";
						const testData: { id: number; } =
							{
								id: 1
							};
						const customHeaders: Record<string, string> =
							{
								Authorization: "Bearer token"
							};

						service.addHeaders(customHeaders);
						service
							.get<typeof testData>(endpoint)
							.subscribe();

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						expect(request.request.headers.get("Authorization"))
							.toBe(
								"Bearer token");
						expect(request.request.headers.get("Content-Type"))
							.toBe(
								"application/json");
						request.flush(testData);
					});
			});

		describe("Error handling",
			() =>
			{
				it("should handle client-side errors (ErrorEvent)",
					() =>
					{
						const endpoint: string = "test";
						const errorMessage: string = "Network error occurred";
						const errorEvent: ErrorEvent =
							new ErrorEvent("Network error",
								{
									message: errorMessage
								});

						service
							.get(endpoint)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Client-side error");
										expect(error.message)
											.toContain(errorMessage);
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.error(errorEvent);
					});

				it("should handle server-side errors (HTTP error response)",
					() =>
					{
						const endpoint: string = "test";
						const errorStatus: number = 404;
						const errorStatusText: string = "Not Found";

						service
							.get(endpoint)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Server-side error");
										expect(error.message)
											.toContain(errorStatus.toString());
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.flush("Not Found",
							{
								status: errorStatus,
								statusText: errorStatusText
							});
					});

				it("should handle errors in POST requests",
					() =>
					{
						const endpoint: string = "test";
						const testData: { name: string; } =
							{ name: "Test" };

						service
							.post(endpoint, testData)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Server-side error");
										expect(error.message)
											.toContain("500");
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.flush("Internal Server Error",
							{
								status: 500,
								statusText: "Internal Server Error"
							});
					});

				it("should handle errors in PUT requests",
					() =>
					{
						const endpoint: string = "test/1";
						const testData: { id: number; name: string; } =
							{ id: 1, name: "Test" };

						service
							.put(endpoint, testData)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Server-side error");
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.flush("Unauthorized",
							{
								status: 401,
								statusText: "Unauthorized"
							});
					});

				it("should handle errors in PATCH requests",
					() =>
					{
						const endpoint: string = "test/1";
						const testData: { name: string; } =
							{ name: "Updated" };

						service
							.patch(endpoint, testData)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Server-side error");
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.flush("Bad Request",
							{
								status: 400,
								statusText: "Bad Request"
							});
					});

				it("should handle errors in DELETE requests",
					() =>
					{
						const endpoint: string = "test/1";

						service
							.delete(endpoint)
							.subscribe(
								{
									next: () =>
										expect.fail("should have failed with error"),
									error: (error: Error) =>
									{
										expect(error.message)
											.toContain("Server-side error");
									}
								});

						const request: TestRequest =
							httpMock.expectOne(`${getBaseUrl()}/${endpoint}`);

						request.flush("Forbidden",
							{ status: 403, statusText: "Forbidden" });
					});
			});
	});
