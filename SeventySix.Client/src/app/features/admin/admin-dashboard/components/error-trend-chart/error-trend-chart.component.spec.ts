import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of, throwError } from "rxjs";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogChartData } from "@admin/admin-dashboard/models";
import { ErrorTrendChartComponent } from "./error-trend-chart.component";

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
			"getChartData"
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
		fixture = TestBed.createComponent(ErrorTrendChartComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should have default period of 24h", () =>
	{
		expect(component.period()).toBe("24h");
	});

	it("should load chart data on init with default period", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();

		expect(logChartService.getChartData).toHaveBeenCalledWith("24h");
		expect(component.isLoading()).toBe(false);
		expect(component.chartData()).toBeTruthy();
	});

	it("should load chart data with custom period", () =>
	{
		logChartService.getChartData.and.returnValue(
			of({ ...mockChartData, period: "7d" })
		);

		fixture.componentRef.setInput("period", "7d");
		fixture.detectChanges();

		expect(logChartService.getChartData).toHaveBeenCalledWith("7d");
	});

	it("should transform API data to Chart.js format", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();

		const chartData = component.chartData();
		expect(chartData).toBeTruthy();
		expect(chartData?.labels?.length).toBe(2);
		expect(chartData?.datasets?.length).toBe(3);
		expect(chartData?.datasets?.[0].label).toBe("Errors");
		expect(chartData?.datasets?.[1].label).toBe("Warnings");
		expect(chartData?.datasets?.[2].label).toBe("Fatals");
	});

	it("should format timestamps correctly for 24h period", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();

		const chartData = component.chartData();
		expect(chartData?.labels?.[0]).toContain(":00");
	});

	it("should handle loading state", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		expect(component.isLoading()).toBe(true);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
	});

	it("should handle errors gracefully", () =>
	{
		const errorMessage = "Failed to load chart data";
		logChartService.getChartData.and.returnValue(
			throwError(() => new Error(errorMessage))
		);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.chartData()).toBeNull();
	});

	it("should reload data when refresh is called", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();
		expect(logChartService.getChartData).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(logChartService.getChartData).toHaveBeenCalledTimes(2);
	});

	it("should reload data when period changes", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();
		expect(logChartService.getChartData).toHaveBeenCalledWith("24h");

		fixture.componentRef.setInput("period", "7d");
		fixture.detectChanges();

		expect(logChartService.getChartData).toHaveBeenCalledWith("7d");
		expect(logChartService.getChartData).toHaveBeenCalledTimes(2);
	});

	it("should use Material Design 3 theme colors", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();

		const chartData = component.chartData();
		expect(chartData?.datasets?.[0].borderColor).toBe("rgb(244, 67, 54)"); // Material red
		expect(chartData?.datasets?.[1].borderColor).toBe("rgb(255, 152, 0)"); // Material orange
		expect(chartData?.datasets?.[2].borderColor).toBe("rgb(156, 39, 176)"); // Material purple
	});

	it("should display chart title", () =>
	{
		logChartService.getChartData.and.returnValue(of(mockChartData));

		fixture.detectChanges();

		expect(component.title()).toBe("Error Trends");
	});

	it("should handle empty data points", () =>
	{
		const emptyData: LogChartData = {
			period: "24h",
			dataPoints: []
		};
		logChartService.getChartData.and.returnValue(of(emptyData));

		fixture.detectChanges();

		const chartData = component.chartData();
		expect(chartData?.labels?.length).toBe(0);
		expect(chartData?.datasets?.[0].data.length).toBe(0);
	});
});
