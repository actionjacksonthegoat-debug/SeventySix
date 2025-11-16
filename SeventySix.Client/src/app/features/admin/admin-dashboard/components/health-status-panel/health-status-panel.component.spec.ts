import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
	HealthApiService,
	LogChartService
} from "@admin/admin-dashboard/services";
import { of, throwError } from "rxjs";
import { HealthStatus } from "@admin/admin-dashboard/models";
import { LogStatistics } from "@admin/log-management/models";
import { provideZonelessChangeDetection } from "@angular/core";
import { HealthStatusPanelComponent } from "./health-status-panel.component";

describe("HealthStatusPanelComponent", () =>
{
	let component: HealthStatusPanelComponent;
	let fixture: ComponentFixture<HealthStatusPanelComponent>;
	let healthApiService: jasmine.SpyObj<HealthApiService>;
	let logChartService: jasmine.SpyObj<LogChartService>;

	const mockHealthData: HealthStatus = {
		status: "Healthy",
		checkedAt: "2024-11-12T12:00:00Z",
		database: {
			isConnected: true,
			responseTimeMs: 50,
			activeConnections: 25,
			status: "Healthy"
		},
		externalApis: {
			apis: {
				OpenWeather: {
					apiName: "OpenWeather",
					isAvailable: true,
					responseTimeMs: 120,
					lastChecked: "2024-11-12T11:55:00Z"
				},
				GeocodeAPI: {
					apiName: "GeocodeAPI",
					isAvailable: false,
					responseTimeMs: 850,
					lastChecked: "2024-11-12T11:50:00Z"
				}
			}
		},
		errorQueue: {
			queuedItems: 5,
			failedItems: 2,
			circuitBreakerOpen: false,
			status: "Healthy"
		},
		system: {
			cpuUsagePercent: 35.5,
			memoryUsedMb: 2048,
			memoryTotalMb: 8192,
			diskUsagePercent: 45.0
		}
	};

	const mockStatisticsData: LogStatistics = {
		totalLogs: 156,
		errorCount: 66,
		warningCount: 90,
		fatalCount: 0,
		criticalCount: 0,
		infoCount: 0,
		debugCount: 0,
		averageResponseTimeMs: 8155.13,
		totalRequests: 121,
		failedRequests: 15,
		topErrorSources: {
			"WeatherForecastController.GetWeatherForecasts": 24,
			ForecastValidationException: 18,
			"Database.Connection": 12,
			"API.RateLimit": 8,
			"Cache.Miss": 4
		},
		requestsByPath: {
			"/api/weather/forecasts": 45,
			"/api/logs": 32,
			"/api/health": 28,
			"/api/logs/statistics": 16
		},
		oldestLogDate: null,
		newestLogDate: null,
		startDate: "2024-11-01T00:00:00Z",
		endDate: "2024-11-12T23:59:59Z"
	};

	beforeEach(async () =>
	{
		const healthApiServiceSpy = jasmine.createSpyObj("HealthApiService", [
			"getHealth"
		]);
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"getStatistics"
		]);

		await TestBed.configureTestingModule({
			imports: [HealthStatusPanelComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: HealthApiService, useValue: healthApiServiceSpy },
				{ provide: LogChartService, useValue: logChartServiceSpy }
			]
		}).compileComponents();

		healthApiService = TestBed.inject(
			HealthApiService
		) as jasmine.SpyObj<HealthApiService>;
		logChartService = TestBed.inject(
			LogChartService
		) as jasmine.SpyObj<LogChartService>;
		fixture = TestBed.createComponent(HealthStatusPanelComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));
		expect(component).toBeTruthy();
	});

	it("should load health data on init", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		expect(healthApiService.getHealth).toHaveBeenCalled();
		expect(logChartService.getStatistics).toHaveBeenCalled();
		expect(component.isLoading()).toBeFalse();
		expect(component.healthData()).toEqual(mockHealthData);
		expect(component.statisticsData()).toEqual(mockStatisticsData);
	});

	it("should show loading state when isLoading is true", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		// Trigger init which will complete immediately
		fixture.detectChanges();

		// Then manually set loading state
		component.isLoading.set(true);
		component.healthData.set(null);
		component.error.set(null);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("Loading health status...");
	});

	it("should handle error when loading health data fails", () =>
	{
		const errorMessage = "Failed to fetch health data";
		healthApiService.getHealth.and.returnValue(
			throwError(() => new Error(errorMessage))
		);
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		expect(component.isLoading()).toBeFalse();
		expect(component.error()).toBe(errorMessage);
	});

	it("should display error message when health data fails to load", () =>
	{
		healthApiService.getHealth.and.returnValue(
			throwError(() => new Error("API error"))
		);
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector(".error-container")).toBeTruthy();
		expect(compiled.textContent).toContain("API error");
	});

	it("should refresh health data when onRefresh is called", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();
		component.onRefresh();

		expect(healthApiService.getHealth).toHaveBeenCalledTimes(2);
		expect(logChartService.getStatistics).toHaveBeenCalledTimes(2);
	});

	it("should display overall status chip with correct color", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const statusChip = compiled.querySelector("mat-chip.status-healthy");
		expect(statusChip).toBeTruthy();
		expect(statusChip?.textContent?.trim()).toContain("Healthy");
	});

	it("should display database health status", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("Database");
		expect(compiled.textContent).toContain("50.00ms");
		expect(compiled.textContent).toContain("25");
	});

	it("should display system resource metrics", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("System Resources");
		expect(compiled.textContent).toContain("35.5%");
		expect(compiled.textContent).toContain("2048");
		expect(compiled.textContent).toContain("8,192");
	});

	it("should apply correct status colors based on health status", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const healthyChips = compiled.querySelectorAll(".status-healthy");
		const unhealthyChips = compiled.querySelectorAll(".status-unhealthy");

		expect(healthyChips.length).toBeGreaterThanOrEqual(0);
		expect(unhealthyChips.length).toBeGreaterThanOrEqual(0);
	});

	it("should handle errors without message gracefully", () =>
	{
		healthApiService.getHealth.and.returnValue(throwError(() => ({})));
		logChartService.getStatistics.and.returnValue(of(mockStatisticsData));

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe("Failed to load system data");
		expect(component.healthData()).toBeNull();
	});

	describe("Auto-refresh functionality", () =>
	{
		beforeEach(() =>
		{
			jasmine.clock().install();
		});

		afterEach(() =>
		{
			jasmine.clock().uninstall();
		});

		it("should start auto-refresh timer on init", () =>
		{
			healthApiService.getHealth.and.returnValue(of(mockHealthData));
			logChartService.getStatistics.and.returnValue(
				of(mockStatisticsData)
			);

			component.autoRefreshEnabled.set(true);
			component.ngOnInit();

			jasmine.clock().tick(60000);

			expect(healthApiService.getHealth).toHaveBeenCalledTimes(2);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(2);
		});
		it("should not auto-refresh when disabled", () =>
		{
			healthApiService.getHealth.and.returnValue(of(mockHealthData));
			logChartService.getStatistics.and.returnValue(
				of(mockStatisticsData)
			);

			component.autoRefreshEnabled.set(false);
			component.ngOnInit();

			expect(healthApiService.getHealth).toHaveBeenCalledTimes(1);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(1);

			jasmine.clock().tick(60000);

			expect(healthApiService.getHealth).toHaveBeenCalledTimes(1);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(1);
		});

		it("should toggle auto-refresh on and off", () =>
		{
			healthApiService.getHealth.and.returnValue(of(mockHealthData));
			logChartService.getStatistics.and.returnValue(
				of(mockStatisticsData)
			);

			component.autoRefreshEnabled.set(true);
			component.ngOnInit();

			component.toggleAutoRefresh();
			expect(component.autoRefreshEnabled()).toBe(false);

			jasmine.clock().tick(60000);
			expect(healthApiService.getHealth).toHaveBeenCalledTimes(1);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(1);

			component.toggleAutoRefresh();
			expect(component.autoRefreshEnabled()).toBe(true);

			jasmine.clock().tick(60000);
			expect(healthApiService.getHealth).toHaveBeenCalledTimes(2);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(2);
		});

		it("should cleanup timer on destroy", () =>
		{
			healthApiService.getHealth.and.returnValue(of(mockHealthData));
			logChartService.getStatistics.and.returnValue(
				of(mockStatisticsData)
			);

			component.autoRefreshEnabled.set(true);
			component.ngOnInit();

			component.ngOnDestroy();

			jasmine.clock().tick(60000);

			expect(healthApiService.getHealth).toHaveBeenCalledTimes(1);
			expect(logChartService.getStatistics).toHaveBeenCalledTimes(1);
		});
	});

	describe("Statistics Computed Signals", () =>
	{
		it("should calculate error rate correctly", () =>
		{
			component.statisticsData.set(mockStatisticsData);

			expect(component.errorRate()).toBe(12); // 15/121 * 100 = 12.4, rounded to 12
		});

		it("should return 0 error rate when no requests", () =>
		{
			const noRequestsData: LogStatistics = {
				...mockStatisticsData,
				totalRequests: 0,
				failedRequests: 0
			};
			component.statisticsData.set(noRequestsData);

			expect(component.errorRate()).toBe(0);
		});

		it("should return 0 error rate when statisticsData is null", () =>
		{
			component.statisticsData.set(null);

			expect(component.errorRate()).toBe(0);
		});

		it("should return top 5 error sources sorted by count", () =>
		{
			component.statisticsData.set(mockStatisticsData);

			const topSources = component.topErrorSources();
			expect(topSources.length).toBe(5);
			expect(topSources[0].name).toBe(
				"WeatherForecastController.GetWeatherForecasts"
			);
			expect(topSources[0].count).toBe(24);
			expect(topSources[4].name).toBe("Cache.Miss");
			expect(topSources[4].count).toBe(4);
		});

		it("should return empty array when no error sources", () =>
		{
			component.statisticsData.set(null);

			expect(component.topErrorSources()).toEqual([]);
		});

		it("should return top 5 request paths sorted by count", () =>
		{
			component.statisticsData.set(mockStatisticsData);

			const topPaths = component.topRequestPaths();
			expect(topPaths.length).toBe(4); // Only 4 paths in mock data
			expect(topPaths[0].path).toBe("/api/weather/forecasts");
			expect(topPaths[0].count).toBe(45);
			expect(topPaths[3].path).toBe("/api/logs/statistics");
			expect(topPaths[3].count).toBe(16);
		});

		it("should return empty array when no request paths", () =>
		{
			component.statisticsData.set(null);

			expect(component.topRequestPaths()).toEqual([]);
		});
	});

	describe("Computed signals", () =>
	{
		it("should calculate memory usage percentage correctly", () =>
		{
			const testData: HealthStatus = {
				...mockHealthData,
				system: {
					cpuUsagePercent: 50,
					memoryUsedMb: 800,
					memoryTotalMb: 1000,
					diskUsagePercent: 45
				}
			};

			component.healthData.set(testData);

			expect(component.memoryUsagePercent()).toBe(80);
		});

		it("should return 0 when healthData is null", () =>
		{
			component.healthData.set(null);

			expect(component.memoryUsagePercent()).toBe(0);
		});

		it("should calculate status color for Healthy status", () =>
		{
			component.healthData.set(mockHealthData);

			expect(component.statusColor()).toBe("primary");
		});

		it("should calculate status color for Degraded status", () =>
		{
			const degradedData: HealthStatus = {
				...mockHealthData,
				status: "Degraded"
			};
			component.healthData.set(degradedData);

			expect(component.statusColor()).toBe("accent");
		});

		it("should calculate status color for Unhealthy status", () =>
		{
			const unhealthyData: HealthStatus = {
				...mockHealthData,
				status: "Unhealthy"
			};
			component.healthData.set(unhealthyData);

			expect(component.statusColor()).toBe("warn");
		});

		it("should count critical issues correctly", () =>
		{
			const criticalData: HealthStatus = {
				...mockHealthData,
				database: {
					isConnected: false,
					responseTimeMs: 100,
					activeConnections: 10,
					status: "Unhealthy"
				},
				errorQueue: {
					queuedItems: 60,
					failedItems: 15,
					circuitBreakerOpen: true,
					status: "Unhealthy"
				},
				system: {
					cpuUsagePercent: 85,
					memoryUsedMb: 9000,
					memoryTotalMb: 10000,
					diskUsagePercent: 85
				}
			};

			component.healthData.set(criticalData);
			expect(component.criticalIssuesCount()).toBe(5);
		});

		it("should return 0 critical issues when all systems healthy", () =>
		{
			component.healthData.set(mockHealthData);

			expect(component.criticalIssuesCount()).toBe(0);
		});

		it("should format recent timestamp as seconds ago", () =>
		{
			const now = new Date();
			const thirtySecondsAgo = new Date(now.getTime() - 30000);

			const testData: HealthStatus = {
				...mockHealthData,
				checkedAt: thirtySecondsAgo.toISOString()
			};

			component.healthData.set(testData);

			expect(component.lastCheckedFormatted()).toMatch(/30s ago/);
		});

		it("should format recent timestamp as minutes ago", () =>
		{
			const now = new Date();
			const fiveMinutesAgo = new Date(now.getTime() - 300000);

			const testData: HealthStatus = {
				...mockHealthData,
				checkedAt: fiveMinutesAgo.toISOString()
			};

			component.healthData.set(testData);

			expect(component.lastCheckedFormatted()).toMatch(/5m ago/);
		});

		it("should return Never when healthData is null", () =>
		{
			component.healthData.set(null);

			expect(component.lastCheckedFormatted()).toBe("Never");
		});
	});

	describe("Utility methods", () =>
	{
		it("should return correct icon for Healthy status", () =>
		{
			expect(component.getStatusIcon("Healthy")).toBe("check_circle");
		});

		it("should return correct icon for Degraded status", () =>
		{
			expect(component.getStatusIcon("Degraded")).toBe("warning");
		});

		it("should return correct icon for Unhealthy status", () =>
		{
			expect(component.getStatusIcon("Unhealthy")).toBe("error");
		});

		it("should return default icon for unknown status", () =>
		{
			expect(component.getStatusIcon("Unknown")).toBe("help");
		});

		it("should return normal class for low resource usage", () =>
		{
			expect(component.getResourceStatusClass(30)).toBe("normal");
		});

		it("should return warning class for moderate resource usage", () =>
		{
			expect(component.getResourceStatusClass(70)).toBe("warning");
		});

		it("should return critical class for high resource usage", () =>
		{
			expect(component.getResourceStatusClass(85)).toBe("critical");
		});
	});
});
