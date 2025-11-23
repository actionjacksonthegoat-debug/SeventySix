import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ErrorTrendChartComponent } from "./components/error-trend-chart/error-trend-chart.component";
import { StatisticsCardsComponent } from "./components/statistics-cards/statistics-cards.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { HealthStatusPanelComponent } from "./components/health-status-panel/health-status-panel.component";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import {
	HealthApiService,
	LogChartService,
	ThirdPartyApiService
} from "./services";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";

describe("AdminDashboardComponent", () =>
{
	let component: AdminDashboardComponent;
	let fixture: ComponentFixture<AdminDashboardComponent>;
	let logChartService: jasmine.SpyObj<LogChartService>;
	let thirdPartyApiService: jasmine.SpyObj<ThirdPartyApiService>;
	let healthApiService: jasmine.SpyObj<HealthApiService>;

	beforeEach(async () =>
	{
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"createChartDataQuery",
			"createStatisticsQuery"
		]);
		const thirdPartyApiServiceSpy = jasmine.createSpyObj(
			"ThirdPartyApiService",
			["createAllQuery", "createStatisticsQuery"]
		);
		const healthApiServiceSpy = jasmine.createSpyObj("HealthApiService", [
			"createHealthQuery"
		]);

		// Set up TanStack Query mocks for child components
		logChartServiceSpy.createChartDataQuery.and.returnValue(
			createMockQueryResult({ period: "24h", dataPoints: [] })
		);
		logChartServiceSpy.createStatisticsQuery.and.returnValue(
			createMockQueryResult({
				totalLogs: 1000,
				errorCount: 50,
				warningCount: 100,
				infoCount: 500,
				debugCount: 300,
				fatalCount: 0,
				criticalCount: 50,
				averageResponseTimeMs: 0,
				totalRequests: 0,
				failedRequests: 0,
				topErrorSources: {},
				requestsByPath: {},
				oldestLogDate: "2024-01-01",
				newestLogDate: "2024-11-12",
				startDate: "2024-01-01",
				endDate: "2024-11-12"
			})
		);
		thirdPartyApiServiceSpy.createAllQuery.and.returnValue(
			createMockQueryResult([])
		);
		healthApiServiceSpy.createHealthQuery.and.returnValue(
			createMockQueryResult({
				status: "Healthy",
				checkedAt: new Date().toISOString(),
				database: {
					isConnected: true,
					responseTimeMs: 50,
					activeConnections: 10,
					status: "Healthy"
				},
				externalApis: { apis: {} },
				errorQueue: {
					queuedItems: 0,
					failedItems: 0,
					circuitBreakerOpen: false,
					status: "Healthy"
				},
				system: {
					cpuUsagePercent: 30,
					memoryUsedMb: 2048,
					memoryTotalMb: 8192,
					diskUsagePercent: 40
				}
			})
		);

		await TestBed.configureTestingModule({
			imports: [
				AdminDashboardComponent,
				ErrorTrendChartComponent,
				StatisticsCardsComponent,
				ApiStatisticsTableComponent,
				HealthStatusPanelComponent
			],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
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
	});

	function createComponent(): void
	{
		fixture = TestBed.createComponent(AdminDashboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		createComponent();

		expect(component).toBeTruthy();
	});

	it("should render dashboard title", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("h1")?.textContent).toContain(
			"Admin Dashboard"
		);
	});

	it("should contain error trend chart component", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-error-trend-chart")).toBeTruthy();
	});

	it("should contain statistics cards component", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-statistics-cards")).toBeTruthy();
	});

	it("should contain API statistics table component", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-api-statistics-table")).toBeTruthy();
	});

	it("should contain health status panel component", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-health-status-panel")).toBeTruthy();
	});

	it("should have responsive grid layout", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		const dashboardGrid = compiled.querySelector(".dashboard-grid");
		expect(dashboardGrid).toBeTruthy();
	});

	it("should display all dashboard sections", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;

		// Verify all main sections are present
		expect(compiled.querySelector(".chart-section")).toBeTruthy();
		expect(compiled.querySelector(".stats-section")).toBeTruthy();
		expect(compiled.querySelector(".api-section")).toBeTruthy();
		expect(compiled.querySelector(".health-section")).toBeTruthy();
	});
});
