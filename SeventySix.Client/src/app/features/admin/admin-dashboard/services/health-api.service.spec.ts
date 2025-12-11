import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import {
	QueryClient,
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import {
	HealthStatusResponse,
	DatabaseHealthResponse,
	ExternalApiHealthResponse
} from "@admin/admin-dashboard/models";
import { HealthApiService } from "./health-api.service";
import { HealthApiRepository } from "@admin/admin-dashboard/repositories";
import { environment } from "@environments/environment";

describe("HealthApiService", () =>
{
	let service: HealthApiService;
	let httpMock: HttpTestingController;
	let queryClient: QueryClient;
	const apiUrl = `${environment.apiUrl}/health`;

	beforeEach(() =>
	{
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTanStackQuery(queryClient),
				HealthApiRepository,
				HealthApiService
			]
		});
		service = TestBed.inject(HealthApiService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
		queryClient.clear();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getHealth", () =>
	{
		it("should return overall system health status", async () =>
		{
			const mockHealth: HealthStatusResponse = {
				status: "Healthy",
				checkedAt: "2025-11-12T10:30:00Z",
				database: {
					isConnected: true,
					responseTimeMs: 15.5,
					activeConnections: 5,
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

			const query = TestBed.runInInjectionContext(() =>
				service.getHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.method).toBe("GET");
			req.flush(mockHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const health = query.data();
			expect(health).toEqual(mockHealth);
			expect(health?.status).toBe("Healthy");
			expect(health?.database?.isConnected).toBe(true);
			expect(health?.externalApis?.apis?.["ExternalAPI"].isAvailable).toBe(
				true
			);
		});

		it("should handle degraded system status", async () =>
		{
			const mockHealth: HealthStatusResponse = {
				status: "Degraded",
				checkedAt: "2025-11-12T10:30:00Z",
				database: {
					isConnected: true,
					responseTimeMs: 500.0,
					activeConnections: 50,
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

			const query = TestBed.runInInjectionContext(() =>
				service.getHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(apiUrl);
			req.flush(mockHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const health = query.data();
			expect(health?.status).toBe("Degraded");
			expect(health?.database?.status).toBe("Degraded");
			expect(health?.system?.cpuUsagePercent).toBeGreaterThan(80);
		});

		it("should handle HTTP errors", async () =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			const query = TestBed.runInInjectionContext(() =>
				service.getHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(apiUrl);
			req.flush("Service unavailable", {
				status: 503,
				statusText: "Service Unavailable"
			});

			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(query.error()).toBeTruthy();
			expect(query.data()).toBeUndefined();
		});
	});
	describe("getDatabaseHealth", () =>
	{
		it("should return database health status", async () =>
		{
			const mockDbHealth: DatabaseHealthResponse = {
				isConnected: true,
				responseTimeMs: 10.2,
				activeConnections: 3,
				status: "Healthy"
			};

			const query = TestBed.runInInjectionContext(() =>
				service.getDatabaseHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/database`);
			expect(req.request.method).toBe("GET");
			req.flush(mockDbHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const dbHealth = query.data();
			expect(dbHealth).toEqual(mockDbHealth);
			expect(dbHealth?.isConnected).toBe(true);
			expect(dbHealth?.responseTimeMs).toBeLessThan(50);
		});

		it("should handle database connection failure", async () =>
		{
			const mockDbHealth: DatabaseHealthResponse = {
				isConnected: false,
				responseTimeMs: 0,
				activeConnections: 0,
				status: "Unhealthy"
			};

			const query = TestBed.runInInjectionContext(() =>
				service.getDatabaseHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/database`);
			req.flush(mockDbHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const dbHealth = query.data();
			expect(dbHealth?.isConnected).toBe(false);
			expect(dbHealth?.status).toBe("Unhealthy");
		});

		it("should handle HTTP errors", async () =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			const query = TestBed.runInInjectionContext(() =>
				service.getDatabaseHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/database`);
			req.flush("Server error", {
				status: 500,
				statusText: "Internal Server Error"
			});

			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(query.error()).toBeTruthy();
			expect(query.data()).toBeUndefined();
		});
	});

	describe("getExternalApiHealth", () =>
	{
		it("should return external API health status", async () =>
		{
			const mockApiHealth: ExternalApiHealthResponse = {
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

			const query = TestBed.runInInjectionContext(() =>
				service.getExternalApiHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			expect(req.request.method).toBe("GET");
			req.flush(mockApiHealth);
			await new Promise((resolve) => setTimeout(resolve, 0));

			const apiHealth = query.data();
			expect(apiHealth).toEqual(mockApiHealth);
			expect(Object.keys(apiHealth?.apis ?? {}).length).toBe(2);
			expect(apiHealth?.apis?.["ExternalAPI"].isAvailable).toBe(true);
		});

		it("should handle APIs with unavailable status", async () =>
		{
			const mockApiHealth: ExternalApiHealthResponse = {
				apis: {
					ExternalAPI: {
						apiName: "ExternalAPI",
						isAvailable: false,
						responseTimeMs: 0,
						lastChecked: "2025-11-12T10:20:00Z"
					}
				}
			};

			const query = TestBed.runInInjectionContext(() =>
				service.getExternalApiHealth()
			);
			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush(mockApiHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const apiHealth = query.data();
			expect(apiHealth?.apis?.["ExternalAPI"].isAvailable).toBe(false);
			expect(apiHealth?.apis?.["ExternalAPI"].responseTimeMs).toBe(0);
		});

		it("should handle empty APIs list", async () =>
		{
			const mockApiHealth: HealthStatusResponse = {
				status: "Healthy",
				checkedAt: new Date().toISOString(),
				database: {
					isConnected: true,
					responseTimeMs: 10,
					activeConnections: 3,
					status: "Healthy"
				},
				externalApis: {
					apis: {}
				},
				errorQueue: {
					queuedItems: 0,
					failedItems: 0,
					circuitBreakerOpen: false,
					status: "Healthy"
				},
				system: {
					cpuUsagePercent: 10,
					memoryUsedMb: 1024,
					memoryTotalMb: 4096,
					diskUsagePercent: 50
				}
			};

			const query = TestBed.runInInjectionContext(() =>
				service.getExternalApiHealth()
			);
			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush(mockApiHealth);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const apiHealth = query.data();
			expect(Object.keys(apiHealth?.apis ?? {}).length).toBe(0);
		});

		it("should handle HTTP errors", async () =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			const query = TestBed.runInInjectionContext(() =>
				service.getExternalApiHealth()
			);

			await new Promise((resolve) => setTimeout(resolve, 0));

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush("Bad gateway", {
				status: 502,
				statusText: "Bad Gateway"
			});

			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(query.error()).toBeTruthy();
			expect(query.data()).toBeUndefined();
		});
	});
});
