import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import {
	HealthStatus,
	DatabaseHealth,
	ExternalApiHealth
} from "@admin/admin-dashboard/models";
import { HealthApiService } from "./health-api.service";
import { environment } from "@environments/environment";

describe("HealthApiService", () =>
{
	let service: HealthApiService;
	let httpMock: HttpTestingController;
	const apiUrl = `${environment.apiUrl}/health`;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				HealthApiService
			]
		});
		service = TestBed.inject(HealthApiService);
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

	describe("getHealth", () =>
	{
		it("should return overall system health status", (done) =>
		{
			const mockHealth: HealthStatus = {
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
						OpenWeather: {
							apiName: "OpenWeather",
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

			service.getHealth().subscribe((health: HealthStatus) =>
			{
				expect(health).toEqual(mockHealth);
				expect(health.status).toBe("Healthy");
				expect(health.database.isConnected).toBe(true);
				expect(
					health.externalApis.apis["OpenWeather"].isAvailable
				).toBe(true);
				done();
			});

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.method).toBe("GET");
			req.flush(mockHealth);
		});

		it("should handle degraded system status", (done) =>
		{
			const mockHealth: HealthStatus = {
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

			service.getHealth().subscribe((health: HealthStatus) =>
			{
				expect(health.status).toBe("Degraded");
				expect(health.database.status).toBe("Degraded");
				expect(health.system.cpuUsagePercent).toBeGreaterThan(80);
				done();
			});

			const req = httpMock.expectOne(apiUrl);
			req.flush(mockHealth);
		});

		it("should handle HTTP errors", (done) =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			service.getHealth().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.message).toContain("503");
					done();
				}
			});
			const req = httpMock.expectOne(apiUrl);
			req.flush("Service unavailable", {
				status: 503,
				statusText: "Service Unavailable"
			});
		});
	});

	describe("getDatabaseHealth", () =>
	{
		it("should return database health status", (done) =>
		{
			const mockDbHealth: DatabaseHealth = {
				isConnected: true,
				responseTimeMs: 10.2,
				activeConnections: 3,
				status: "Healthy"
			};

			service
				.getDatabaseHealth()
				.subscribe((dbHealth: DatabaseHealth) =>
				{
					expect(dbHealth).toEqual(mockDbHealth);
					expect(dbHealth.isConnected).toBe(true);
					expect(dbHealth.responseTimeMs).toBeLessThan(50);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/database`);
			expect(req.request.method).toBe("GET");
			req.flush(mockDbHealth);
		});

		it("should handle database connection failure", (done) =>
		{
			const mockDbHealth: DatabaseHealth = {
				isConnected: false,
				responseTimeMs: 0,
				activeConnections: 0,
				status: "Unhealthy"
			};

			service
				.getDatabaseHealth()
				.subscribe((dbHealth: DatabaseHealth) =>
				{
					expect(dbHealth.isConnected).toBe(false);
					expect(dbHealth.status).toBe("Unhealthy");
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/database`);
			req.flush(mockDbHealth);
		});

		it("should handle HTTP errors", (done) =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			service.getDatabaseHealth().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.message).toContain("500");
					done();
				}
			});
			const req = httpMock.expectOne(`${apiUrl}/database`);
			req.flush("Server error", {
				status: 500,
				statusText: "Internal Server Error"
			});
		});
	});

	describe("getExternalApiHealth", () =>
	{
		it("should return external API health status", (done) =>
		{
			const mockApiHealth: ExternalApiHealth = {
				apis: {
					OpenWeather: {
						apiName: "OpenWeather",
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

			service
				.getExternalApiHealth()
				.subscribe((apiHealth: ExternalApiHealth) =>
				{
					expect(apiHealth).toEqual(mockApiHealth);
					expect(Object.keys(apiHealth.apis).length).toBe(2);
					expect(apiHealth.apis["OpenWeather"].isAvailable).toBe(
						true
					);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			expect(req.request.method).toBe("GET");
			req.flush(mockApiHealth);
		});

		it("should handle APIs with unavailable status", (done) =>
		{
			const mockApiHealth: ExternalApiHealth = {
				apis: {
					OpenWeather: {
						apiName: "OpenWeather",
						isAvailable: false,
						responseTimeMs: 0,
						lastChecked: "2025-11-12T10:20:00Z"
					}
				}
			};

			service
				.getExternalApiHealth()
				.subscribe((apiHealth: ExternalApiHealth) =>
				{
					expect(apiHealth.apis["OpenWeather"].isAvailable).toBe(
						false
					);
					expect(apiHealth.apis["OpenWeather"].responseTimeMs).toBe(
						0
					);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush(mockApiHealth);
		});

		it("should handle empty APIs list", (done) =>
		{
			const mockApiHealth: ExternalApiHealth = {
				apis: {}
			};

			service
				.getExternalApiHealth()
				.subscribe((apiHealth: ExternalApiHealth) =>
				{
					expect(Object.keys(apiHealth.apis).length).toBe(0);
					done();
				});

			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush(mockApiHealth);
		});

		it("should handle HTTP errors", (done) =>
		{
			spyOn(console, "error"); // Suppress expected error logs
			service.getExternalApiHealth().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.message).toContain("502");
					done();
				}
			});
			const req = httpMock.expectOne(`${apiUrl}/external-apis`);
			req.flush("Bad gateway", {
				status: 502,
				statusText: "Bad Gateway"
			});
		});
	});
});
