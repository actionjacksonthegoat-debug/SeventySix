import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ErrorTrendChartComponent } from "./components/error-trend-chart/error-trend-chart.component";
import { StatisticsCardsComponent } from "./components/statistics-cards/statistics-cards.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { HealthStatusPanelComponent } from "./components/health-status-panel/health-status-panel.component";
import { of } from "rxjs";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import {
	HealthApiService,
	LogChartService,
	ThirdPartyApiService
} from "./services";

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
			"getChartData",
			"getStatistics"
		]);
		const thirdPartyApiServiceSpy = jasmine.createSpyObj(
			"ThirdPartyApiService",
			["getAll", "getStatistics"]
		);
		const healthApiServiceSpy = jasmine.createSpyObj("HealthApiService", [
			"getHealth"
		]);

		// Set up default return values
		logChartServiceSpy.getChartData.and.returnValue(of({ dataPoints: [] }));
		logChartServiceSpy.getStatistics.and.returnValue(
			of({
				totalLogs: 1000,
				errorCount: 50,
				warningCount: 100,
				infoCount: 500,
				debugCount: 300,
				criticalCount: 50,
				oldestLogDate: "2024-01-01",
				newestLogDate: "2024-11-12"
			})
		);
		thirdPartyApiServiceSpy.getAll.and.returnValue(of([]));
		healthApiServiceSpy.getHealth.and.returnValue(
			of({
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

		fixture = TestBed.createComponent(AdminDashboardComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should render dashboard title", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("h1")?.textContent).toContain(
			"Admin Dashboard"
		);
	});

	it("should contain error trend chart component", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-error-trend-chart")).toBeTruthy();
	});

	it("should contain statistics cards component", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-statistics-cards")).toBeTruthy();
	});

	it("should contain API statistics table component", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-api-statistics-table")).toBeTruthy();
	});

	it("should contain health status panel component", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-health-status-panel")).toBeTruthy();
	});

	it("should have responsive grid layout", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const dashboardGrid = compiled.querySelector(".dashboard-grid");
		expect(dashboardGrid).toBeTruthy();
	});

	it("should display all dashboard sections", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;

		// Verify all main sections are present
		expect(compiled.querySelector(".chart-section")).toBeTruthy();
		expect(compiled.querySelector(".stats-section")).toBeTruthy();
		expect(compiled.querySelector(".api-section")).toBeTruthy();
		expect(compiled.querySelector(".health-section")).toBeTruthy();
	});
});
