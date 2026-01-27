import { HealthStatusResponse } from "@admin/models";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { createTestQueryClient, flushMicrotasks } from "@shared/testing";
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
					createTestQueryClient();

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
		describe("getDetailedHealth",
			() =>
			{
				it("should return comprehensive health status with infrastructure details",
					async () =>
					{
						const mockDetailedHealth: HealthStatusResponse =
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

						const query: ReturnType<typeof service.getDetailedHealth> =
							TestBed.runInInjectionContext(
								() => service.getDetailedHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/detailed`);
						expect(req.request.method)
							.toBe("GET");
						req.flush(mockDetailedHealth);

						await flushMicrotasks();

						const health: HealthStatusResponse | undefined =
							query.data();
						expect(health)
							.toEqual(mockDetailedHealth);
						expect(health?.status)
							.toBe("Healthy");
						expect(health?.database?.isConnected)
							.toBe(true);
						expect(health?.externalApis?.apis?.["ExternalAPI"].isAvailable)
							.toBe(true);
						expect(health?.system?.cpuUsagePercent)
							.toBeLessThan(50);
					});

				it("should handle degraded system status with all components",
					async () =>
					{
						const mockDetailedHealth: HealthStatusResponse =
							{
								status: "Degraded",
								checkedAt: "2025-11-12T10:30:00Z",
								database: {
									isConnected: true,
									responseTimeMs: 500.0,
									status: "Degraded"
								},
								externalApis: {
									apis: {
										ExternalAPI: {
											apiName: "ExternalAPI",
											isAvailable: false,
											responseTimeMs: 0,
											lastChecked: "2025-11-12T10:20:00Z"
										}
									}
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

						const query: ReturnType<typeof service.getDetailedHealth> =
							TestBed.runInInjectionContext(
								() => service.getDetailedHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/detailed`);
						req.flush(mockDetailedHealth);

						await flushMicrotasks();

						const health: HealthStatusResponse | undefined =
							query.data();
						expect(health?.status)
							.toBe("Degraded");
						expect(health?.database?.status)
							.toBe("Degraded");
						expect(health?.externalApis?.apis?.["ExternalAPI"].isAvailable)
							.toBe(false);
						expect(health?.system?.cpuUsagePercent)
							.toBeGreaterThan(80);
					});

				it("should handle HTTP errors (e.g. 401 Unauthorized)",
					async () =>
					{
						const query: ReturnType<typeof service.getDetailedHealth> =
							TestBed.runInInjectionContext(
								() => service.getDetailedHealth());

						await flushMicrotasks();

						const req: TestRequest =
							httpMock.expectOne(`${apiUrl}/detailed`);
						req.flush("Unauthorized",
							{
								status: 401,
								statusText: "Unauthorized"
							});

						await flushMicrotasks();

						expect(query.error())
							.toBeTruthy();
						expect(query.data())
							.toBeUndefined();
					});
			});
	});
