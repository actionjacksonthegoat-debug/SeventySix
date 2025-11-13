import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { of, throwError } from "rxjs";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import {
	LogChartService,
	ThirdPartyApiService,
	HealthApiService
} from "@features/admin/services";
import {
	LogStatistics,
	ThirdPartyApiRequest,
	HealthStatus,
	LogChartData
} from "@core/models/admin";

/**
 * Integration tests for AdminDashboardComponent
 * Tests the integration between parent component and child components
 */
describe("AdminDashboardComponent Integration Tests", () =>
{
	let component: AdminDashboardComponent;
	let fixture: ComponentFixture<AdminDashboardComponent>;
	let logChartService: jasmine.SpyObj<LogChartService>;
	let thirdPartyApiService: jasmine.SpyObj<ThirdPartyApiService>;
	let healthApiService: jasmine.SpyObj<HealthApiService>;

	const mockStatistics: LogStatistics = {
		totalLogs: 1500,
		errorCount: 250,
		warningCount: 450,
		infoCount: 600,
		debugCount: 150,
		criticalCount: 50,
		oldestLogDate: "2025-10-01T00:00:00Z",
		newestLogDate: "2025-11-12T10:30:00Z"
	};

	const mockChartData: LogChartData = {
		period: "week",
		dataPoints: [
			{
				timestamp: "2025-11-12T10:00:00Z",
				errorCount: 15,
				warningCount: 25,
				fatalCount: 2,
				totalCount: 42
			},
			{
				timestamp: "2025-11-12T11:00:00Z",
				errorCount: 8,
				warningCount: 18,
				fatalCount: 1,
				totalCount: 27
			}
		]
	};

	const mockApiData: ThirdPartyApiRequest[] = [
		{
			id: 1,
			apiName: "OpenWeather",
			baseUrl: "https://api.openweathermap.org",
			callCount: 2500,
			lastCalledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
			resetDate: "2025-11-12"
		},
		{
			id: 2,
			apiName: "GeocodeAPI",
			baseUrl: "https://api.geocode.com",
			callCount: 1200,
			lastCalledAt: new Date(
				Date.now() - 5 * 60 * 60 * 1000
			).toISOString(),
			resetDate: "2025-11-12"
		}
	];

	const mockHealthData: HealthStatus = {
		status: "Healthy",
		checkedAt: new Date().toISOString(),
		database: {
			isConnected: true,
			responseTimeMs: 45,
			activeConnections: 20,
			status: "Healthy"
		},
		externalApis: {
			apis: {
				OpenWeather: {
					apiName: "OpenWeather",
					isAvailable: true,
					responseTimeMs: 150,
					lastChecked: new Date().toISOString()
				},
				GeocodeAPI: {
					apiName: "GeocodeAPI",
					isAvailable: true,
					responseTimeMs: 200,
					lastChecked: new Date().toISOString()
				}
			}
		},
		errorQueue: {
			queuedItems: 3,
			failedItems: 0,
			circuitBreakerOpen: false,
			status: "Healthy"
		},
		system: {
			cpuUsagePercent: 25.5,
			memoryUsedMb: 1024,
			memoryTotalMb: 8192,
			diskUsagePercent: 35.0
		}
	};

	beforeEach(async () =>
	{
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"getStatistics",
			"getChartData"
		]);
		const thirdPartyApiServiceSpy = jasmine.createSpyObj(
			"ThirdPartyApiService",
			["getAll"]
		);
		const healthApiServiceSpy = jasmine.createSpyObj("HealthApiService", [
			"getHealth"
		]);

		await TestBed.configureTestingModule({
			imports: [AdminDashboardComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: LogChartService, useValue: logChartServiceSpy },
				{
					provide: ThirdPartyApiService,
					useValue: thirdPartyApiServiceSpy
				},
				{ provide: HealthApiService, useValue: healthApiServiceSpy }
			]
		}).compileComponents();

		logChartService = TestBed.inject(
			LogChartService
		) as jasmine.SpyObj<LogChartService>;
		thirdPartyApiService = TestBed.inject(
			ThirdPartyApiService
		) as jasmine.SpyObj<ThirdPartyApiService>;
		healthApiService = TestBed.inject(
			HealthApiService
		) as jasmine.SpyObj<HealthApiService>;

		// Setup default successful responses
		logChartService.getStatistics.and.returnValue(of(mockStatistics));
		logChartService.getChartData.and.returnValue(of(mockChartData));
		thirdPartyApiService.getAll.and.returnValue(of(mockApiData));
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture = TestBed.createComponent(AdminDashboardComponent);
		component = fixture.componentInstance;
	});

	describe("Component Integration", () =>
	{
		it("should render all child components", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.querySelector("app-statistics-cards")).toBeTruthy();
			expect(
				compiled.querySelector("app-error-trend-chart")
			).toBeTruthy();
			expect(
				compiled.querySelector("app-api-statistics-table")
			).toBeTruthy();
			expect(
				compiled.querySelector("app-health-status-panel")
			).toBeTruthy();
		});

		it("should call all services on initialization", () =>
		{
			fixture.detectChanges();

			expect(logChartService.getStatistics).toHaveBeenCalled();
			expect(logChartService.getChartData).toHaveBeenCalled();
			expect(thirdPartyApiService.getAll).toHaveBeenCalled();
			expect(healthApiService.getHealth).toHaveBeenCalled();
		});

		it("should maintain responsive grid layout", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			const dashboardGrid = compiled.querySelector(".dashboard-grid");
			expect(dashboardGrid).toBeTruthy();
		});

		it("should display dashboard title", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.textContent).toContain("Admin Dashboard");
		});
	});

	describe("Data Display Integration", () =>
	{
		it("should display statistics component", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			const statsSection = compiled.querySelector("app-statistics-cards");
			expect(statsSection).toBeTruthy();
		});

		it("should display chart component", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			const chartSection = compiled.querySelector(
				"app-error-trend-chart"
			);
			expect(chartSection).toBeTruthy();
		});

		it("should display API table component", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			const apiSection = compiled.querySelector(
				"app-api-statistics-table"
			);
			expect(apiSection).toBeTruthy();
		});

		it("should display health panel component", () =>
		{
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			const healthSection = compiled.querySelector(
				"app-health-status-panel"
			);
			expect(healthSection).toBeTruthy();
		});
	});

	describe("Error Handling", () =>
	{
		it("should still render dashboard when one service fails", () =>
		{
			logChartService.getStatistics.and.returnValue(
				throwError(() => new Error("Stats failed"))
			);

			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.querySelector("app-statistics-cards")).toBeTruthy();
			expect(
				compiled.querySelector("app-error-trend-chart")
			).toBeTruthy();
			expect(
				compiled.querySelector("app-api-statistics-table")
			).toBeTruthy();
			expect(
				compiled.querySelector("app-health-status-panel")
			).toBeTruthy();
		});

		it("should handle all services failing gracefully", () =>
		{
			logChartService.getStatistics.and.returnValue(
				throwError(() => new Error("Failed"))
			);
			logChartService.getChartData.and.returnValue(
				throwError(() => new Error("Failed"))
			);
			thirdPartyApiService.getAll.and.returnValue(
				throwError(() => new Error("Failed"))
			);
			healthApiService.getHealth.and.returnValue(
				throwError(() => new Error("Failed"))
			);

			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled).toBeTruthy();
			expect(compiled.querySelector("app-statistics-cards")).toBeTruthy();
		});
	});
});
