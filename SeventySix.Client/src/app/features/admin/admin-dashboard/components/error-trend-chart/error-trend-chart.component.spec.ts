import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogChartData } from "@admin/admin-dashboard/models";
import { ErrorTrendChartComponent } from "./error-trend-chart.component";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";

describe("ErrorTrendChartComponent", () =>
{
	let component: ErrorTrendChartComponent;
	let fixture: ComponentFixture<ErrorTrendChartComponent>;
	let logChartService: jasmine.SpyObj<LogChartService>;

	const mockChartData: LogChartData = {
		period: "24h",
		dataPoints: [
			{
				timestamp: "2025-11-12T00:00:00Z",
				errorCount: 10,
				warningCount: 5,
				fatalCount: 1,
				totalCount: 16
			},
			{
				timestamp: "2025-11-12T01:00:00Z",
				errorCount: 8,
				warningCount: 3,
				fatalCount: 0,
				totalCount: 11
			}
		]
	};

	beforeEach(async () =>
	{
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"createChartDataQuery"
		]);

		await TestBed.configureTestingModule({
			imports: [ErrorTrendChartComponent],
			providers: [
				provideZonelessChangeDetection(),
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
		fixture = TestBed.createComponent(ErrorTrendChartComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		expect(component).toBeTruthy();
	});

	it("should have default period of 24h", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		expect(component.period()).toBe("24h");
	});

	it("should load chart data on init with default period", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		expect(logChartService.createChartDataQuery).toHaveBeenCalled();
		expect(component.isLoading()).toBe(false);
		expect(component.chartData()).toBeTruthy();
	});

	it("should load chart data with custom period", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult({ ...mockChartData, period: "7d" })
		);

		createComponent();
		fixture.componentRef.setInput("period", "7d");
		fixture.detectChanges();

		expect(logChartService.createChartDataQuery).toHaveBeenCalled();
	});

	it("should transform API data to Chart.js format", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		const chartData = component.chartData();
		expect(chartData).toBeTruthy();
		expect(chartData?.labels?.length).toBe(2);
		expect(chartData?.datasets?.length).toBe(3);
		expect(chartData?.datasets?.[0].label).toBe("Errors");
		expect(chartData?.datasets?.[1].label).toBe("Warnings");
		expect(chartData?.datasets?.[2].label).toBe("Fatals");
	});

	it("should handle loading state", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult<LogChartData>(undefined, { isLoading: true })
		);

		createComponent();

		expect(component.isLoading()).toBe(true);
	});

	it("should handle errors gracefully", () =>
	{
		const errorMessage = "Failed to load chart data";
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult<LogChartData>(undefined, {
				isError: true,
				error: new Error(errorMessage)
			})
		);

		createComponent();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.chartData()).toBeNull();
	});

	it("should reload data when refresh is called", () =>
	{
		const mockQuery = createMockQueryResult(mockChartData);
		logChartService.createChartDataQuery.and.returnValue(mockQuery);

		createComponent();
		expect(logChartService.createChartDataQuery).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(mockQuery.refetch).toHaveBeenCalled();
	});

	it("should reload data when period changes", () =>
	{
		const mockQuery = createMockQueryResult(mockChartData);
		logChartService.createChartDataQuery.and.returnValue(mockQuery);

		createComponent();
		expect(logChartService.createChartDataQuery).toHaveBeenCalledTimes(1);

		fixture.componentRef.setInput("period", "7d");
		fixture.detectChanges();

		// Period change triggers refetch via effect, not a new query creation
		expect(mockQuery.refetch).toHaveBeenCalled();
	});

	it("should use Material Design 3 theme colors", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		const chartData = component.chartData();
		expect(chartData?.datasets?.[0].borderColor).toBe("rgb(244, 67, 54)"); // Material red
		expect(chartData?.datasets?.[1].borderColor).toBe("rgb(255, 152, 0)"); // Material orange
		expect(chartData?.datasets?.[2].borderColor).toBe("rgb(156, 39, 176)"); // Material purple
	});

	it("should display chart title", () =>
	{
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(mockChartData)
		);

		createComponent();

		expect(component.title()).toBe("Error Trends");
	});

	it("should handle empty data points", () =>
	{
		const emptyData: LogChartData = {
			period: "24h",
			dataPoints: []
		};
		logChartService.createChartDataQuery.and.returnValue(
			createMockQueryResult(emptyData)
		);

		createComponent();

		const chartData = component.chartData();
		expect(chartData?.labels?.length).toBe(0);
		expect(chartData?.datasets?.[0].data.length).toBe(0);
	});
});
