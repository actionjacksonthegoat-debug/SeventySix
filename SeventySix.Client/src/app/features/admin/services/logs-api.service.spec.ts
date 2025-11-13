import { TestBed } from "@angular/core/testing";
import {
	HttpClientTestingModule,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogsApiService } from "./logs-api.service";
import { LogLevel, LogFilterRequest } from "@core/models/logs";
import { environment } from "@environments/environment";

describe("LogsApiService", () =>
{
	let service: LogsApiService;
	let httpMock: HttpTestingController;
	const apiUrl = `${environment.apiUrl}/logs`;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [provideZonelessChangeDetection(), LogsApiService]
		});
		service = TestBed.inject(LogsApiService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	describe("getLogs", () =>
	{
		it("should get logs without filters", () =>
		{
			const mockResponse = {
				data: [],
				pageNumber: 1,
				pageSize: 50,
				totalCount: 0,
				totalPages: 0,
				hasPreviousPage: false,
				hasNextPage: false
			};

			service.getLogs().subscribe((response) =>
			{
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.method).toBe("GET");
			req.flush(mockResponse);
		});

		it("should get logs with all filter parameters", () =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Error,
				startDate: new Date("2025-01-01"),
				endDate: new Date("2025-01-02"),
				sourceContext: "TestService",
				requestPath: "/api/test",
				pageNumber: 2,
				pageSize: 25,
				searchTerm: "error message"
			};

			const mockResponse = {
				data: [],
				pageNumber: 2,
				pageSize: 25,
				totalCount: 100,
				totalPages: 4,
				hasPreviousPage: true,
				hasNextPage: true
			};

			service.getLogs(filter).subscribe((response) =>
			{
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.method).toBe("GET");
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Error.toString()
			);
			expect(req.request.params.get("startDate")).toBe(
				filter.startDate!.toISOString()
			);
			expect(req.request.params.get("endDate")).toBe(
				filter.endDate!.toISOString()
			);
			expect(req.request.params.get("sourceContext")).toBe("TestService");
			expect(req.request.params.get("requestPath")).toBe("/api/test");
			expect(req.request.params.get("pageNumber")).toBe("2");
			expect(req.request.params.get("pageSize")).toBe("25");
			expect(req.request.params.get("searchTerm")).toBe("error message");
			req.flush(mockResponse);
		});

		it("should handle null/undefined filter values", () =>
		{
			const filter: LogFilterRequest = {
				logLevel: null,
				startDate: undefined,
				endDate: null,
				sourceContext: null
			};

			service.getLogs(filter).subscribe();

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.params.keys().length).toBe(0);
			req.flush({
				data: [],
				pageNumber: 1,
				pageSize: 50,
				totalCount: 0,
				totalPages: 0,
				hasPreviousPage: false,
				hasNextPage: false
			});
		});
	});

	describe("getLogCount", () =>
	{
		it("should get log count without filters", () =>
		{
			const mockResponse = { total: 100 };

			service.getLogCount().subscribe((response) =>
			{
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne(`${apiUrl}/count`);
			expect(req.request.method).toBe("GET");
			req.flush(mockResponse);
		});

		it("should get log count with filter parameters", () =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Warning,
				startDate: new Date("2025-01-01"),
				endDate: new Date("2025-01-31"),
				sourceContext: "UserService",
				requestPath: "/api/users"
			};

			const mockResponse = { total: 42 };

			service.getLogCount(filter).subscribe((response) =>
			{
				expect(response.total).toBe(42);
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.method).toBe("GET");
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Warning.toString()
			);
			expect(req.request.params.get("startDate")).toBe(
				filter.startDate!.toISOString()
			);
			expect(req.request.params.get("endDate")).toBe(
				filter.endDate!.toISOString()
			);
			expect(req.request.params.get("sourceContext")).toBe("UserService");
			expect(req.request.params.get("requestPath")).toBe("/api/users");
			req.flush(mockResponse);
		});
	});

	describe("getLogById", () =>
	{
		it("should get a single log by ID", () =>
		{
			const logId = 123;
			const mockLog = {
				id: logId,
				timestamp: new Date(),
				level: LogLevel.Error,
				message: "Test error",
				sourceContext: "TestService",
				exception: null,
				stackTrace: null,
				requestId: null,
				requestPath: null,
				machineName: null,
				threadId: null,
				application: null,
				environment: null,
				userId: null,
				userName: null,
				sessionId: null,
				correlationId: null,
				clientIp: null,
				userAgent: null,
				duration: null,
				statusCode: null,
				properties: null
			};

			service.getLogById(logId).subscribe((response) =>
			{
				expect(response).toEqual(mockLog);
			});

			const req = httpMock.expectOne(`${apiUrl}/${logId}`);
			expect(req.request.method).toBe("GET");
			req.flush(mockLog);
		});
	});

	describe("deleteLog", () =>
	{
		it("should delete a single log by ID", () =>
		{
			const logId = 456;

			service.deleteLog(logId).subscribe((response) =>
			{
				expect(response).toBeNull();
			});

			const req = httpMock.expectOne(`${apiUrl}/${logId}`);
			expect(req.request.method).toBe("DELETE");
			req.flush(null, { status: 204, statusText: "No Content" });
		});
	});

	describe("deleteLogs", () =>
	{
		it("should delete multiple logs by IDs", () =>
		{
			const ids = [1, 2, 3, 4, 5];
			const deletedCount = 5;

			service.deleteLogs(ids).subscribe((response) =>
			{
				expect(response).toBe(deletedCount);
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});

		it("should handle empty ID array", () =>
		{
			const ids: number[] = [];
			const deletedCount = 0;

			service.deleteLogs(ids).subscribe((response) =>
			{
				expect(response).toBe(deletedCount);
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});
	});
});
