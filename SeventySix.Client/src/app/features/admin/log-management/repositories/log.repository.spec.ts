import { TestBed } from "@angular/core/testing";
import { LogRepository } from "./log.repository";
import { ApiService } from "@core/api-services/api.service";
import {
	LogResponse,
	LogFilterRequest,
	LogCountResponse,
	PagedLogResponse,
	LogLevel
} from "@admin/log-management/models";
import { of } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { setupRepositoryTest, createMockApiService } from "@testing";

describe("LogRepository", () =>
{
	let repository: LogRepository;
	let mockApiService: jasmine.SpyObj<ApiService>;

	const mockLog: LogResponse = {
		id: 1,
		timestamp: new Date("2024-01-01T00:00:00Z"),
		logLevel: "Information",
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
		spanId: null,
		parentSpanId: null,
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
		mockApiService = createMockApiService();

		repository = setupRepositoryTest(LogRepository, [
			{ provide: ApiService, useValue: mockApiService }
		]);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	describe("getAllPaged", () =>
	{
		it("should fetch paged logs without filter", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockPagedResponse));

			repository.getAllPaged().subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"logs",
					undefined,
					jasmine.anything()
				);
				done();
			});
		});

		it("should fetch paged logs with filter", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Error,
				pageNumber: 2,
				pageSize: 25
			};
			mockApiService.get.and.returnValue(of(mockPagedResponse));

			repository.getAllPaged(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockPagedResponse);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"logs",
					jasmine.any(HttpParams),
					jasmine.anything()
				);
				done();
			});
		});
	});

	describe("getById", () =>
	{
		it("should fetch single log by id", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockLog));

			repository.getById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockLog);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"logs/1",
					undefined,
					jasmine.anything()
				);
				done();
			});
		});
	});

	describe("getCount", () =>
	{
		it("should fetch log count without filter", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockCountResponse));

			repository.getCount().subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"logs/count",
					undefined
				);
				done();
			});
		});

		it("should fetch log count with filter", (done) =>
		{
			const filter: LogFilterRequest = {
				logLevel: LogLevel.Warning,
				sourceContext: "TestContext"
			};
			mockApiService.get.and.returnValue(of(mockCountResponse));

			repository.getCount(filter).subscribe((result) =>
			{
				expect(result).toEqual(mockCountResponse);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"logs/count",
					jasmine.any(HttpParams)
				);
				done();
			});
		});
	});

	describe("delete", () =>
	{
		it("should delete log by id", (done) =>
		{
			mockApiService.delete.and.returnValue(of(void 0));

			repository.delete(1).subscribe(() =>
			{
				expect(mockApiService.delete).toHaveBeenCalledWith("logs/1");
				done();
			});
		});
	});

	describe("deleteBatch", () =>
	{
		it("should delete multiple logs", (done) =>
		{
			const ids = [1, 2, 3];
			mockApiService.delete.and.returnValue(of(3));

			repository.deleteBatch(ids).subscribe((result) =>
			{
				expect(result).toBe(3);
				expect(mockApiService.delete).toHaveBeenCalledWith(
					"logs/batch",
					ids
				);
				done();
			});
		});
	});
});
