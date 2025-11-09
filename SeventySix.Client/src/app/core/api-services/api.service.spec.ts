import { HttpParams, provideHttpClient, withFetch } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { ApiService } from "./api.service";

describe("ApiService", () =>
{
	let service: ApiService;
	let httpMock: HttpTestingController;
	const baseUrl = environment.apiUrl;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				ApiService,
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		});
		service = TestBed.inject(ApiService);
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
});
