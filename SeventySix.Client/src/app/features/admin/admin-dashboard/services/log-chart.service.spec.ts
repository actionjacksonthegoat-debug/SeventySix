import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { LogChartData } from "@admin/admin-dashboard/models";
import { LogStatistics } from "@admin/log-management/models";
import { LogChartService } from "./log-chart.service";
import { environment } from "@environments/environment";

describe("LogChartService", () =>
{
	let service: LogChartService;
	let httpMock: HttpTestingController;
	const apiUrl = `${environment.apiUrl}/logs`;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				LogChartService
			]
		});
		service = TestBed.inject(LogChartService);
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

	describe("getChartData", () =>
	{
		it("should return chart data for 24h period", (done) =>
		{
			const mockChartData: LogChartData = {
				period: "24h",
				dataPoints: [
					{
						timestamp: "2025-11-12T00:00:00Z",
						errorCount: 10,
						warningCount: 5,
						fatalCount: 0,
						totalCount: 15
					},
					{
						timestamp: "2025-11-12T01:00:00Z",
						errorCount: 8,
						warningCount: 3,
						fatalCount: 1,
						totalCount: 12
					}
				]
			};

			service.getChartData("24h").subscribe((data: LogChartData) =>
			{
				expect(data).toEqual(mockChartData);
				expect(data.period).toBe("24h");
				expect(data.dataPoints.length).toBe(2);
				expect(data.dataPoints[0].errorCount).toBe(10);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/chartdata?period=24h`);
			expect(req.request.method).toBe("GET");
			req.flush(mockChartData);
		});

		it("should return chart data for 7d period", (done) =>
		{
			const mockChartData: LogChartData = {
				period: "7d",
				dataPoints: [
					{
						timestamp: "2025-11-06T00:00:00Z",
						errorCount: 50,
						warningCount: 25,
						fatalCount: 2,
						totalCount: 77
					},
					{
						timestamp: "2025-11-07T00:00:00Z",
						errorCount: 45,
						warningCount: 20,
						fatalCount: 1,
						totalCount: 66
					}
				]
			};

			service.getChartData("7d").subscribe((data: LogChartData) =>
			{
				expect(data.period).toBe("7d");
				expect(data.dataPoints.length).toBe(2);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/chartdata?period=7d`);
			expect(req.request.method).toBe("GET");
			req.flush(mockChartData);
		});

		it("should return chart data for 30d period", (done) =>
		{
			const mockChartData: LogChartData = {
				period: "30d",
				dataPoints: []
			};

			service.getChartData("30d").subscribe((data: LogChartData) =>
			{
				expect(data.period).toBe("30d");
				expect(data.dataPoints.length).toBe(0);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/chartdata?period=30d`);
			req.flush(mockChartData);
		});

		it("should use default period when not specified", (done) =>
		{
			const mockChartData: LogChartData = {
				period: "24h",
				dataPoints: []
			};

			service.getChartData().subscribe((data: LogChartData) =>
			{
				expect(data.period).toBe("24h");
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/chartdata?period=24h`);
			req.flush(mockChartData);
		});

		it("should handle HTTP errors", (done) =>
		{
			service.getChartData("24h").subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.status).toBe(400);
					done();
				}
			});

			const req = httpMock.expectOne(`${apiUrl}/chartdata?period=24h`);
			req.flush("Invalid period", {
				status: 400,
				statusText: "Bad Request"
			});
		});
	});

	describe("getStatistics", () =>
	{
		it("should return log statistics without date range", (done) =>
		{
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
				oldestLogDate: "2025-10-01T00:00:00Z",
				newestLogDate: "2025-11-12T10:30:00Z",
				startDate: "2025-10-01T00:00:00Z",
				endDate: "2025-11-12T10:30:00Z"
			};

			service.getStatistics().subscribe((stats: LogStatistics) =>
			{
				expect(stats).toEqual(mockStats);
				expect(stats.totalLogs).toBe(1234);
				expect(stats.errorCount).toBe(567);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			expect(req.request.method).toBe("GET");
			req.flush(mockStats);
		});

		it("should return log statistics with start date", (done) =>
		{
			const mockStats: LogStatistics = {
				totalLogs: 500,
				errorCount: 234,
				warningCount: 123,
				fatalCount: 0,
				criticalCount: 5,
				infoCount: 120,
				debugCount: 18,
				averageResponseTimeMs: 0,
				totalRequests: 0,
				failedRequests: 0,
				topErrorSources: {},
				requestsByPath: {},
				oldestLogDate: "2025-11-01T00:00:00Z",
				newestLogDate: "2025-11-12T10:30:00Z",
				startDate: "2025-11-01T00:00:00Z",
				endDate: "2025-11-12T10:30:00Z"
			};

			const startDate = "2025-11-01T00:00:00Z";

			service
				.getStatistics(startDate)
				.subscribe((stats: LogStatistics) =>
				{
					expect(stats.totalLogs).toBe(500);
					done();
				});

			const req = httpMock.expectOne(
				(request) =>
					request.url === `${apiUrl}/statistics` &&
					request.params.get("startDate") === startDate
			);
			expect(req.request.method).toBe("GET");
			req.flush(mockStats);
		});

		it("should return log statistics with date range", (done) =>
		{
			const mockStats: LogStatistics = {
				totalLogs: 200,
				errorCount: 100,
				warningCount: 50,
				fatalCount: 0,
				criticalCount: 2,
				infoCount: 40,
				debugCount: 8,
				averageResponseTimeMs: 0,
				totalRequests: 0,
				failedRequests: 0,
				topErrorSources: {},
				requestsByPath: {},
				oldestLogDate: "2025-11-10T00:00:00Z",
				newestLogDate: "2025-11-12T10:30:00Z",
				startDate: "2025-11-10T00:00:00Z",
				endDate: "2025-11-12T10:30:00Z"
			};

			const startDate = "2025-11-10T00:00:00Z";
			const endDate = "2025-11-12T23:59:59Z";

			service
				.getStatistics(startDate, endDate)
				.subscribe((stats: LogStatistics) =>
				{
					expect(stats.totalLogs).toBe(200);
					done();
				});

			const req = httpMock.expectOne(
				(request) =>
					request.url === `${apiUrl}/statistics` &&
					request.params.get("startDate") === startDate &&
					request.params.get("endDate") === endDate
			);
			expect(req.request.method).toBe("GET");
			req.flush(mockStats);
		});

		it("should handle statistics with null dates", (done) =>
		{
			const mockStats: LogStatistics = {
				totalLogs: 0,
				errorCount: 0,
				warningCount: 0,
				fatalCount: 0,
				criticalCount: 0,
				infoCount: 0,
				debugCount: 0,
				averageResponseTimeMs: 0,
				totalRequests: 0,
				failedRequests: 0,
				topErrorSources: {},
				requestsByPath: {},
				oldestLogDate: null,
				newestLogDate: null,
				startDate: new Date().toISOString(),
				endDate: new Date().toISOString()
			};

			service.getStatistics().subscribe((stats: LogStatistics) =>
			{
				expect(stats.totalLogs).toBe(0);
				expect(stats.oldestLogDate).toBeNull();
				expect(stats.newestLogDate).toBeNull();
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			req.flush(mockStats);
		});

		it("should handle HTTP errors", (done) =>
		{
			service.getStatistics().subscribe({
				next: () => fail("should have failed"),
				error: (error: any) =>
				{
					expect(error.status).toBe(500);
					done();
				}
			});

			const req = httpMock.expectOne(`${apiUrl}/statistics`);
			req.flush("Server error", {
				status: 500,
				statusText: "Internal Server Error"
			});
		});
	});
});
