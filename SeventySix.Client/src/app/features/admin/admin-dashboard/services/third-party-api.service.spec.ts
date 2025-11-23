import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import {
	ThirdPartyApiRequest,
	ThirdPartyApiStatistics
} from "@admin/admin-dashboard/models";
import { ThirdPartyApiService } from "./third-party-api.service";
import { environment } from "@environments/environment";
import { setupSimpleServiceTest } from "@testing";

describe("ThirdPartyApiService", () =>
{
	let service: ThirdPartyApiService;
	let httpMock: HttpTestingController;
	const apiUrl = `${environment.apiUrl}/thirdpartyrequests`;

	beforeEach(() =>
	{
		service = setupSimpleServiceTest(ThirdPartyApiService, [
			provideHttpClient(),
			provideHttpClientTesting()
		]);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAll", () =>
	{
		it("should return all third-party API requests", (done) =>
		{
			const mockData: ThirdPartyApiRequest[] = [
				{
					id: 1,
					apiName: "OpenWeather",
					baseUrl: "https://api.openweathermap.org",
					callCount: 1234,
					lastCalledAt: "2025-11-12T10:30:00Z",
					resetDate: "2025-11-12"
				},
				{
					id: 2,
					apiName: "GeocodeAPI",
					baseUrl: "https://api.geocode.com",
					callCount: 567,
					lastCalledAt: "2025-11-12T09:15:00Z",
					resetDate: "2025-11-12"
				}
			];

			service.getAll().subscribe((data: ThirdPartyApiRequest[]) =>
			{
				expect(data).toEqual(mockData);
				expect(data.length).toBe(2);
				expect(data[0].apiName).toBe("OpenWeather");
				done();
			});

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.method).toBe("GET");
			req.flush(mockData);
		});

		it("should handle empty response", (done) =>
		{
			service.getAll().subscribe((data: ThirdPartyApiRequest[]) =>
			{
				expect(data).toEqual([]);
				expect(data.length).toBe(0);
				done();
			});

			const req = httpMock.expectOne(apiUrl);
			req.flush([]);
		});

		it("should handle HTTP errors", (done) =>
		{
			service.getAll().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.status).toBe(500);
					done();
				}
			});

			const req = httpMock.expectOne(apiUrl);
			req.flush("Server error", {
				status: 500,
				statusText: "Internal Server Error"
			});
		});
	});

	describe("getByApiName", () =>
	{
		it("should return API requests filtered by API name", (done) =>
		{
			const apiName = "OpenWeather";
			const mockData: ThirdPartyApiRequest[] = [
				{
					id: 1,
					apiName: "OpenWeather",
					baseUrl: "https://api.openweathermap.org",
					callCount: 1234,
					lastCalledAt: "2025-11-12T10:30:00Z",
					resetDate: "2025-11-12"
				}
			];

			service
				.getByApiName(apiName)
				.subscribe((data: ThirdPartyApiRequest[]) =>
				{
					expect(data).toEqual(mockData);
					expect(data.length).toBe(1);
					expect(data[0].apiName).toBe(apiName);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/${apiName}`);
			expect(req.request.method).toBe("GET");
			req.flush(mockData);
		});

		it("should handle API name with special characters", (done) =>
		{
			const apiName = "API Name With Spaces";
			const encodedName = encodeURIComponent(apiName);

			service.getByApiName(apiName).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/${encodedName}`);
			expect(req.request.method).toBe("GET");
			req.flush([]);
		});

		it("should handle HTTP errors", (done) =>
		{
			const apiName = "NonExistent";

			service.getByApiName(apiName).subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.status).toBe(404);
					done();
				}
			});

			const req = httpMock.expectOne(`${apiUrl}/${apiName}`);
			req.flush("Not found", { status: 404, statusText: "Not Found" });
		});
	});

	describe("getStatistics", () =>
	{
		it("should return third-party API statistics", (done) =>
		{
			const mockStats: ThirdPartyApiStatistics = {
				totalCallsToday: 1801,
				totalApisTracked: 2,
				callsByApi: {
					OpenWeather: 1234,
					GeocodeAPI: 567
				},
				lastCalledByApi: {
					OpenWeather: "2025-11-12T10:30:00Z",
					GeocodeAPI: "2025-11-12T09:15:00Z"
				}
			};

			service
				.getStatistics()
				.subscribe((stats: ThirdPartyApiStatistics) =>
				{
					expect(stats).toEqual(mockStats);
					expect(stats.totalCallsToday).toBe(1801);
					expect(stats.totalApisTracked).toBe(2);
					expect(stats.callsByApi["OpenWeather"]).toBe(1234);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			expect(req.request.method).toBe("GET");
			req.flush(mockStats);
		});

		it("should handle empty statistics", (done) =>
		{
			const mockStats: ThirdPartyApiStatistics = {
				totalCallsToday: 0,
				totalApisTracked: 0,
				callsByApi: {},
				lastCalledByApi: {}
			};

			service
				.getStatistics()
				.subscribe((stats: ThirdPartyApiStatistics) =>
				{
					expect(stats.totalCallsToday).toBe(0);
					expect(stats.totalApisTracked).toBe(0);
					expect(Object.keys(stats.callsByApi).length).toBe(0);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			req.flush(mockStats);
		});

		it("should handle HTTP errors", (done) =>
		{
			service.getStatistics().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.status).toBe(503);
					done();
				}
			});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			req.flush("Service unavailable", {
				status: 503,
				statusText: "Service Unavailable"
			});
		});
	});
});
