import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { LogRepository } from "./log.repository";
import {
	LogResponse,
	LogFilterRequest,
	LogCountResponse,
	PagedLogResponse
} from "@admin/log-management/models";
import { LogLevel } from "@admin/log-management/models/log.model";
import { environment } from "@environments/environment";

describe("LogRepository", () =>
{
	let repository: LogRepository;
	let httpMock: HttpTestingController;
	const apiUrl = `${environment.apiUrl}/logs`;

	const mockLog: LogResponse = {
		id: 1,
		timestamp: new Date("2024-01-01T00:00:00Z"),
		level: LogLevel.Information,
		message: "Test log message",
		sourceContext: "TestContext",
		exception: null,
		stackTrace: null,
		requestId: null,
		requestPath: "/api/test",
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

	const mockPagedResponse: PagedLogResponse = {
		data: [mockLog],
		totalCount: 1,
		pageNumber: 1,
		pageSize: 10,
		totalPages: 1,
		hasPreviousPage: false,
		hasNextPage: false
	};

	const mockCountResponse: LogCountResponse = {
		total: 42
	};

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				LogRepository
			]
		});

		repository = TestBed.inject(LogRepository);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	describe("getAll", () =>
	{
		it("should get all logs without filters", (done) =>
		{
			repository.getAll().subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne(apiUrl);
			expect(req.request.method).toBe("GET");
			expect(req.request.params.keys().length).toBe(0);
			req.flush(mockPagedResponse);
		});

		it("should get logs with log level filter", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Error
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Error.toString()
			);
			req.flush(mockPagedResponse);
		});

		it("should get logs with date range filters", (done) =>
		{
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-01-31");
			const filter: LogFilterRequest = {
				startDate,
				endDate
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("startDate")).toBe(
				startDate.toISOString()
			);
			expect(req.request.params.get("endDate")).toBe(
				endDate.toISOString()
			);
			req.flush(mockPagedResponse);
		});

		it("should get logs with source context filter", (done) =>
		{
			const filter: LogFilterRequest = {
				sourceContext: "TestContext"
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("sourceContext")).toBe("TestContext");
			req.flush(mockPagedResponse);
		});

		it("should get logs with request path filter", (done) =>
		{
			const filter: LogFilterRequest = {
				requestPath: "/api/test"
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("requestPath")).toBe("/api/test");
			req.flush(mockPagedResponse);
		});

		it("should get logs with pagination parameters", (done) =>
		{
			const filter: LogFilterRequest = {
				pageNumber: 2,
				pageSize: 25
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("pageNumber")).toBe("2");
			expect(req.request.params.get("pageSize")).toBe("25");
			req.flush(mockPagedResponse);
		});

		it("should get logs with search term", (done) =>
		{
			const filter: LogFilterRequest = {
				searchTerm: "error"
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("searchTerm")).toBe("error");
			req.flush(mockPagedResponse);
		});

		it("should get logs with multiple filters", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Warning,
				startDate: new Date("2024-01-01"),
				sourceContext: "TestContext",
				pageNumber: 1,
				pageSize: 10,
				searchTerm: "test"
			};

			repository.getAll(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Warning.toString()
			);
			expect(req.request.params.get("sourceContext")).toBe("TestContext");
			expect(req.request.params.get("pageNumber")).toBe("1");
			expect(req.request.params.get("pageSize")).toBe("10");
			expect(req.request.params.get("searchTerm")).toBe("test");
			req.flush(mockPagedResponse);
		});

		it("should handle log level 0 (Verbose)", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Verbose
			};

			repository.getAll(filter).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne((request) => request.url === apiUrl);
			expect(req.request.params.get("logLevel")).toBe("0");
			req.flush(mockPagedResponse);
		});
	});

	describe("getById", () =>
	{
		it("should get log by id", (done) =>
		{
			repository.getById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockLog);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/1`);
			expect(req.request.method).toBe("GET");
			req.flush(mockLog);
		});

		it("should handle different log ids", (done) =>
		{
			repository.getById(42).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/42`);
			expect(req.request.method).toBe("GET");
			req.flush(mockLog);
		});
	});

	describe("getCount", () =>
	{
		it("should get log count without filters", (done) =>
		{
			repository.getCount().subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/count`);
			expect(req.request.method).toBe("GET");
			expect(req.request.params.keys().length).toBe(0);
			req.flush(mockCountResponse);
		});

		it("should get log count with log level filter", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Error
			};

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Error.toString()
			);
			req.flush(mockCountResponse);
		});

		it("should get log count with date range filters", (done) =>
		{
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-01-31");
			const filter: LogFilterRequest = {
				startDate,
				endDate
			};

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.get("startDate")).toBe(
				startDate.toISOString()
			);
			expect(req.request.params.get("endDate")).toBe(
				endDate.toISOString()
			);
			req.flush(mockCountResponse);
		});

		it("should get log count with source context filter", (done) =>
		{
			const filter: LogFilterRequest = {
				sourceContext: "TestContext"
			};

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.get("sourceContext")).toBe("TestContext");
			req.flush(mockCountResponse);
		});

		it("should get log count with request path filter", (done) =>
		{
			const filter: LogFilterRequest = {
				requestPath: "/api/test"
			};

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.get("requestPath")).toBe("/api/test");
			req.flush(mockCountResponse);
		});

		it("should get log count with multiple filters", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Warning,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-01-31"),
				sourceContext: "TestContext",
				requestPath: "/api/test"
			};

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.get("logLevel")).toBe(
				LogLevel.Warning.toString()
			);
			expect(req.request.params.get("sourceContext")).toBe("TestContext");
			expect(req.request.params.get("requestPath")).toBe("/api/test");
			req.flush(mockCountResponse);
		});

		it("should not include pagination params in count request", (done) =>
		{
			const filter: LogFilterRequest = {
				pageNumber: 2,
				pageSize: 25
			};

			repository.getCount(filter).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.has("pageNumber")).toBe(false);
			expect(req.request.params.has("pageSize")).toBe(false);
			req.flush(mockCountResponse);
		});

		it("should not include search term in count request", (done) =>
		{
			const filter: LogFilterRequest = {
				searchTerm: "test"
			};

			repository.getCount(filter).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(
				(request) => request.url === `${apiUrl}/count`
			);
			expect(req.request.params.has("searchTerm")).toBe(false);
			req.flush(mockCountResponse);
		});
	});

	describe("delete", () =>
	{
		it("should delete log by id", (done) =>
		{
			repository.delete(1).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/1`);
			expect(req.request.method).toBe("DELETE");
			req.flush(null);
		});

		it("should handle different log ids for deletion", (done) =>
		{
			repository.delete(99).subscribe(() =>
			{
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/99`);
			expect(req.request.method).toBe("DELETE");
			req.flush(null);
		});
	});

	describe("deleteBatch", () =>
	{
		it("should delete multiple logs by ids", (done) =>
		{
			const ids = [1, 2, 3];
			const deletedCount = 3;

			repository.deleteBatch(ids).subscribe((result) =>
			{
				expect(result).toBe(deletedCount);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});

		it("should handle single id in batch delete", (done) =>
		{
			const ids = [42];
			const deletedCount = 1;

			repository.deleteBatch(ids).subscribe((result) =>
			{
				expect(result).toBe(deletedCount);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});

		it("should handle empty array in batch delete", (done) =>
		{
			const ids: number[] = [];
			const deletedCount = 0;

			repository.deleteBatch(ids).subscribe((result) =>
			{
				expect(result).toBe(deletedCount);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});

		it("should handle large batch of ids", (done) =>
		{
			const ids = Array.from({ length: 100 }, (_, i) => i + 1);
			const deletedCount = 100;

			repository.deleteBatch(ids).subscribe((result) =>
			{
				expect(result).toBe(deletedCount);
				done();
			});

			const req = httpMock.expectOne(`${apiUrl}/batch`);
			expect(req.request.method).toBe("DELETE");
			expect(req.request.body).toEqual(ids);
			req.flush(deletedCount);
		});
	});
});
