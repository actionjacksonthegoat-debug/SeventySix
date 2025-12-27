import {
	DatabaseHealthResponse,
	ExternalApiHealthResponse,
	HealthStatusResponse
} from "@admin/models";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { flushMicrotasks } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { HealthApiService } from "./health-api.service";

describe("HealthApiService",
	() =>
	{
		let service: HealthApiService;
		let httpMock: HttpTestingController;
		let queryClient: QueryClient;
		const apiUrl: string =
			`${environment.apiUrl}/health`;

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
					new QueryClient(
						{
							defaultOptions: {
								queries: { retry: false },
								mutations: { retry: false }
							}
						});

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(),
							provideHttpClientTesting(),
							provideTanStackQuery(queryClient),
							HealthApiService
						]
					});
				service =
					TestBed.inject(HealthApiService);
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

		describe("getHealth",
			() =>
			{
				it("should return overall system health status",
					async () =>
					{
						const mockHealth: HealthStatusResponse =
							{
								status: "Healthy",
								checkedAt: "2025-11-12T10:30:00Z",
								database: {
									isConnected: true,
									responseTimeMs: 15.5,
									status: "Healthy"
								},
								externalApis: {
									apis: {
										ExternalAPI: {
											apiName: "ExternalAPI",
											isAvailable: true,
											responseTimeMs: 120.3,
											lastChecked: "2025-11-12T10:29:00Z"
										}
									}
								},
								errorQueue: {
									queuedItems: 0,
									failedItems: 0,
									circuitBreakerOpen: false,
									status: "Healthy"
								},
								system: {
									cpuUsagePercent: 25.5,
									memoryUsedMb: 512,
									memoryTotalMb: 2048,
									diskUsagePercent: 45.2
								}
							};

						const query: ReturnType<typeof service.getHealth> =
							TestBed.runInInjectionContext(
								() => service.getHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(apiUrl);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockHealth);

						await flushMicrotasks();

						const health: HealthStatusResponse | undefined =
							query.data();
						expect(health)
							.toEqual(mockHealth);
						expect(health?.status)
							.toBe("Healthy");
						expect(health?.database?.isConnected)
							.toBe(true);
						expect(health?.externalApis?.apis?.["ExternalAPI"].isAvailable)
							.toBe(
								true);
					});

				it("should handle degraded system status",
					async () =>
					{
						const mockHealth: HealthStatusResponse =
							{
								status: "Degraded",
								checkedAt: "2025-11-12T10:30:00Z",
								database: {
									isConnected: true,
									responseTimeMs: 500.0,
									status: "Degraded"
								},
								externalApis: {
									apis: {}
								},
								errorQueue: {
									queuedItems: 100,
									failedItems: 5,
									circuitBreakerOpen: false,
									status: "Degraded"
								},
								system: {
									cpuUsagePercent: 85.0,
									memoryUsedMb: 1900,
									memoryTotalMb: 2048,
									diskUsagePercent: 90.0
								}
							};

						const query: ReturnType<typeof service.getHealth> =
							TestBed.runInInjectionContext(
								() => service.getHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(apiUrl);
						req.flush(mockHealth);

						await flushMicrotasks();

						const health: HealthStatusResponse | undefined =
							query.data();
						expect(health?.status)
							.toBe("Degraded");
						expect(health?.database?.status)
							.toBe("Degraded");
						expect(health?.system?.cpuUsagePercent)
							.toBeGreaterThan(80);
					});

				it("should handle HTTP errors",
					async () =>
					{
						const query: ReturnType<typeof service.getHealth> =
							TestBed.runInInjectionContext(
								() => service.getHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(apiUrl);
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
		describe("getDatabaseHealth",
			() =>
			{
				it("should return database health status",
					async () =>
					{
						const mockDbHealth: DatabaseHealthResponse =
							{
								isConnected: true,
								responseTimeMs: 10.2,
								status: "Healthy"
							};

						const query: ReturnType<typeof service.getDatabaseHealth> =
							TestBed.runInInjectionContext(
								() => service.getDatabaseHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/database`);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockDbHealth);

						await flushMicrotasks();

						const dbHealth: DatabaseHealthResponse | undefined =
							query.data();
						expect(dbHealth)
							.toEqual(mockDbHealth);
						expect(dbHealth?.isConnected)
							.toBe(true);
						expect(dbHealth?.responseTimeMs)
							.toBeLessThan(50);
					});

				it("should handle database connection failure",
					async () =>
					{
						const mockDbHealth: DatabaseHealthResponse =
							{
								isConnected: false,
								responseTimeMs: 0,
								status: "Unhealthy"
							};

						const query: ReturnType<typeof service.getDatabaseHealth> =
							TestBed.runInInjectionContext(
								() => service.getDatabaseHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/database`);
						req.flush(mockDbHealth);

						await flushMicrotasks();

						const dbHealth: DatabaseHealthResponse | undefined =
							query.data();
						expect(dbHealth?.isConnected)
							.toBe(false);
						expect(dbHealth?.status)
							.toBe("Unhealthy");
					});

				it("should handle HTTP errors",
					async () =>
					{
						const query: ReturnType<typeof service.getDatabaseHealth> =
							TestBed.runInInjectionContext(
								() => service.getDatabaseHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/database`);
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

		describe("getExternalApiHealth",
			() =>
			{
				it("should return external API health status",
					async () =>
					{
						const mockApiHealth: ExternalApiHealthResponse =
							{
								apis: {
									ExternalAPI: {
										apiName: "ExternalAPI",
										isAvailable: true,
										responseTimeMs: 150.5,
										lastChecked: "2025-11-12T10:28:00Z"
									},
									GeocodeAPI: {
										apiName: "GeocodeAPI",
										isAvailable: true,
										responseTimeMs: 200.0,
										lastChecked: "2025-11-12T10:27:00Z"
									}
								}
							};

						const query: ReturnType<typeof service.getExternalApiHealth> =
							TestBed.runInInjectionContext(
								() => service.getExternalApiHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/external-apis`);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockApiHealth);
						await flushMicrotasks();

						const apiHealth: ExternalApiHealthResponse | undefined =
							query.data();
						expect(apiHealth)
							.toEqual(mockApiHealth);
						expect(Object.keys(apiHealth?.apis ?? {}).length)
							.toBe(2);
						expect(apiHealth?.apis?.["ExternalAPI"].isAvailable)
							.toBe(true);
					});

				it("should handle APIs with unavailable status",
					async () =>
					{
						const mockApiHealth: ExternalApiHealthResponse =
							{
								apis: {
									ExternalAPI: {
										apiName: "ExternalAPI",
										isAvailable: false,
										responseTimeMs: 0,
										lastChecked: "2025-11-12T10:20:00Z"
									}
								}
							};

						const query: ReturnType<typeof service.getExternalApiHealth> =
							TestBed.runInInjectionContext(
								() => service.getExternalApiHealth());
						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/external-apis`);
						req.flush(mockApiHealth);

						await flushMicrotasks();

						const apiHealth: ExternalApiHealthResponse | undefined =
							query.data();
						expect(apiHealth?.apis?.["ExternalAPI"].isAvailable)
							.toBe(false);
						expect(apiHealth?.apis?.["ExternalAPI"].responseTimeMs)
							.toBe(0);
					});

				it("should handle empty APIs list",
					async () =>
					{
						const mockExternalApis: ExternalApiHealthResponse =
							{
								apis: {}
							};

						const query: ReturnType<typeof service.getExternalApiHealth> =
							TestBed.runInInjectionContext(
								() => service.getExternalApiHealth());
						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/external-apis`);
						req.flush(mockExternalApis);

						await flushMicrotasks();

						const apiHealth: ExternalApiHealthResponse | undefined =
							query.data();
						expect(Object.keys(apiHealth?.apis ?? {}).length)
							.toBe(0);
					});

				it("should handle HTTP errors",
					async () =>
					{
						const query: ReturnType<typeof service.getExternalApiHealth> =
							TestBed.runInInjectionContext(
								() => service.getExternalApiHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/external-apis`);
						req.flush("Bad gateway",
							{
								status: 502,
								statusText: "Bad Gateway"
							});

						await flushMicrotasks();

						expect(query.error())
							.toBeTruthy();
						expect(query.data())
							.toBeUndefined();
					});
			});
	});
