import {
	ThirdPartyApiRequestDto,
	ThirdPartyApiStatisticsDto
} from "@admin/models";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import {
	createTestQueryClient,
	flushMicrotasks,
	setupSimpleServiceTest
} from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { ThirdPartyApiService } from "./third-party-api.service";

describe("ThirdPartyApiService",
	() =>
	{
		let service: ThirdPartyApiService;
		let httpMock: HttpTestingController;
		let queryClient: QueryClient;
		const apiUrl: string =
			`${environment.apiUrl}/thirdpartyrequests`;

		beforeEach(
			() =>
			{
			// Suppress expected console.error output from error handling tests
				vi
					.spyOn(console, "error")
					.mockImplementation(
						() =>
						{});

				queryClient =
					createTestQueryClient();

				service =
					setupSimpleServiceTest(ThirdPartyApiService,
						[
							provideHttpClient(),
							provideHttpClientTesting(),
							provideTanStackQuery(queryClient)
						]);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify();
				queryClient.clear();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("getAllThirdPartyApis",
			() =>
			{
				it("should return all third-party API requests",
					async () =>
					{
						const mockData: ThirdPartyApiRequestDto[] =
							[
								{
									id: 1,
									apiName: "ExternalAPI",
									baseUrl: "https://api.example.com",
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

						const query: ReturnType<typeof service.getAllThirdPartyApis> =
							TestBed.runInInjectionContext(
								() => service.getAllThirdPartyApis()); // Wait for query to execute
						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(apiUrl);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockData);

						// Wait for query to complete
						await flushMicrotasks();

						const data: ThirdPartyApiRequestDto[] | undefined =
							query.data();
						expect(data)
							.toEqual(mockData);
						expect(data?.length)
							.toBe(2);
						expect(data?.[0].apiName)
							.toBe("ExternalAPI");
					});

				it("should handle empty array response",
					async () =>
					{
						const query: ReturnType<typeof service.getAllThirdPartyApis> =
							TestBed.runInInjectionContext(
								() => service.getAllThirdPartyApis());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(apiUrl);
						req.flush([]);

						await flushMicrotasks();

						const data: ThirdPartyApiRequestDto[] | undefined =
							query.data();
						expect(data)
							.toEqual([]);
						expect(data?.length)
							.toBe(0);
					});

				it("should handle HTTP errors",
					async () =>
					{
						vi.spyOn(console, "error"); // Suppress expected error logs
						const query: ReturnType<typeof service.getAllThirdPartyApis> =
							TestBed.runInInjectionContext(
								() => service.getAllThirdPartyApis());

						await flushMicrotasks();
						const req: TestRequest =
							httpMock.expectOne(apiUrl);
						req.flush("Server error",
							{
								status: 500,
								statusText: "Internal Server Error"
							});

						await flushMicrotasks();

						expect(query.error())
							.toBeTruthy();
						expect(query.data())
							.toBeUndefined();
					});
			});

		describe("getStatistics",
			() =>
			{
				it("should return third-party API statistics",
					async () =>
					{
						const mockStats: ThirdPartyApiStatisticsDto =
							{
								totalCallsToday: 1801,
								totalApisTracked: 2,
								callsByApi: {
									ExternalAPI: 1234,
									GeocodeAPI: 567
								},
								lastCalledByApi: {
									ExternalAPI: "2025-11-12T10:30:00Z",
									GeocodeAPI: "2025-11-12T09:15:00Z"
								}
							};

						const query: ReturnType<typeof service.getStatistics> =
							TestBed.runInInjectionContext(
								() => service.getStatistics());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/statistics`);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockStats);

						await flushMicrotasks();

						const stats: ThirdPartyApiStatisticsDto | undefined =
							query.data();
						expect(stats?.totalCallsToday)
							.toBe(mockStats.totalCallsToday);
						expect(stats?.totalApisTracked)
							.toBe(mockStats.totalApisTracked);
						expect(
							(stats?.callsByApi as Record<string, number>)["ExternalAPI"])
							.toBe(1234);
					});

				it("should handle empty statistics",
					async () =>
					{
						const mockStats: ThirdPartyApiStatisticsDto =
							{
								totalCallsToday: 0,
								totalApisTracked: 0,
								callsByApi: {},
								lastCalledByApi: {}
							};

						const query: ReturnType<typeof service.getStatistics> =
							TestBed.runInInjectionContext(
								() => service.getStatistics());
						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/statistics`);
						req.flush(mockStats);

						await flushMicrotasks();

						const stats: ThirdPartyApiStatisticsDto | undefined =
							query.data();
						expect(stats?.totalCallsToday)
							.toBe(0);
						expect(stats?.totalApisTracked)
							.toBe(0);
						expect(
							Object
								.keys((stats?.callsByApi as Record<string, number>) ?? {})
								.length)
							.toBe(0);
					});

				it("should handle HTTP errors",
					async () =>
					{
						vi.spyOn(console, "error"); // Suppress expected error logs
						const query: ReturnType<typeof service.getStatistics> =
							TestBed.runInInjectionContext(
								() => service.getStatistics());
						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/statistics`);
						req.flush("Service unavailable",
							{
								status: 503,
								statusText: "Service Unavailable"
							});

						await flushMicrotasks();

						expect(query.error())
							.toBeTruthy();
						expect(query.data())
							.toBeUndefined();
					});
			});
	});