import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogStatistics } from "@admin/log-management/models";
import { StatisticsCardsComponent } from "./statistics-cards.component";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";

describe("StatisticsCardsComponent", () =>
{
	let component: StatisticsCardsComponent;
	let fixture: ComponentFixture<StatisticsCardsComponent>;
	let logChartService: jasmine.SpyObj<LogChartService>;

	const mockStats: LogStatistics = {
		totalLogs: 1234,
		errorCount: 567,
		warningCount: 234,
		fatalCount: 0,
		criticalCount: 10,
		infoCount: 345,
		debugCount: 78,
		averageResponseTimeMs: 0,
		totalRequests: 0,
		failedRequests: 0,
		topErrorSources: {},
		requestsByPath: {},
		oldestLogDate: "2024-01-01T00:00:00Z",
		newestLogDate: "2024-11-12T12:00:00Z",
		startDate: "2024-01-01T00:00:00Z",
		endDate: "2024-11-12T12:00:00Z"
	};
	beforeEach(async () =>
	{
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"createStatisticsQuery"
		]);

		await TestBed.configureTestingModule({
			imports: [StatisticsCardsComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: LogChartService, useValue: logChartServiceSpy }
			]
		}).compileComponents();

		logChartService = TestBed.inject(
			LogChartService
		) as jasmine.SpyObj<LogChartService>;
	});

	function createComponent(): void
	{
		fixture = TestBed.createComponent(StatisticsCardsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(component).toBeTruthy();
	});

	it("should load statistics on init", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(logChartService.createStatisticsQuery).toHaveBeenCalled();
		expect(component.isLoading()).toBe(false);
		expect(component.errorCount()).toBe(567);
	});

	it("should display error count", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(component.errorCount()).toBe(567);
	});

	it("should display warning count", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(component.warningCount()).toBe(234);
	});

	it("should display fatal count", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(component.fatalCount()).toBe(10);
	});

	it("should handle loading state", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult<LogStatistics>(undefined, { isLoading: true })
		);

		createComponent();

		expect(component.isLoading()).toBe(true);
	});

	it("should handle errors gracefully", () =>
	{
		const errorMessage = "Failed to load statistics";
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult<LogStatistics>(undefined, {
				isError: true,
				error: new Error(errorMessage)
			})
		);

		createComponent();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.errorCount()).toBe(0);
	});

	it("should reload statistics when refresh is called", () =>
	{
		const mockQuery = createMockQueryResult(mockStats);
		logChartService.createStatisticsQuery.and.returnValue(mockQuery);

		createComponent();
		expect(logChartService.createStatisticsQuery).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(mockQuery.refetch).toHaveBeenCalled();
	});

	it("should display zero for all counts when statistics are null", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult<LogStatistics>(undefined)
		);

		createComponent();

		expect(component.errorCount()).toBe(0);
		expect(component.warningCount()).toBe(0);
		expect(component.fatalCount()).toBe(0);
		expect(component.infoCount()).toBe(0);
		expect(component.debugCount()).toBe(0);
		expect(component.totalCount()).toBe(0);
	});

	it("should have 6 stat cards", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		const cards = compiled.querySelectorAll("mat-card");
		expect(cards.length).toBe(6);
	});

	it("should display default values for info and debug counts when null", () =>
	{
		logChartService.createStatisticsQuery.and.returnValue(
			createMockQueryResult(mockStats)
		);

		createComponent();

		expect(component.infoCount()).toBe(345);
		expect(component.debugCount()).toBe(78);
		expect(component.totalCount()).toBe(1234);
	});
});
