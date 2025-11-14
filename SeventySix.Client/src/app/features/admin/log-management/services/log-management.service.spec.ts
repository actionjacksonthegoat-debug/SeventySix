import { TestBed } from "@angular/core/testing";
import {
	HttpClientTestingModule,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { LogManagementService } from "./log-management.service";
import { LogRepository } from "@admin/log-management/repositories";
import {
	LogFilterRequest,
	PagedLogResponse,
	LogCountResponse,
	LogLevel,
	LogResponse
} from "@admin/log-management/models";
import { of } from "rxjs";

describe("LogManagementService", () =>
{
	let service: LogManagementService;
	let logRepository: jasmine.SpyObj<LogRepository>;
	let queryClient: QueryClient;

	const mockLogResponse: LogResponse = {
		id: 1,
		timestamp: new Date(),
		level: LogLevel.Information,
		message: "Test log",
		sourceContext: "Test",
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

	const mockPagedResponse: PagedLogResponse = {
		data: [mockLogResponse],
		totalCount: 1,
		pageNumber: 1,
		pageSize: 50,
		totalPages: 1,
		hasPreviousPage: false,
		hasNextPage: false
	};

	const mockCountResponse: LogCountResponse = {
		total: 1
	};

	beforeEach(() =>
	{
		logRepository = jasmine.createSpyObj("LogRepository", [
			"getAll",
			"getById",
			"getCount",
			"delete",
			"deleteBatch"
		]);

		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				provideZonelessChangeDetection(),
				provideAngularQuery(queryClient),
				LogManagementService,
				{ provide: LogRepository, useValue: logRepository }
			]
		});

		service = TestBed.inject(LogManagementService);
	});

	afterEach(() =>
	{
		queryClient.clear();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should initialize with default filter", () =>
	{
		const filter = service.filter();
		expect(filter.pageNumber).toBe(1);
		expect(filter.pageSize).toBe(50);
	});

	it("should initialize with empty selection", () =>
	{
		const ids = service.selectedIds();
		expect(ids.size).toBe(0);
	});

	it("should compute selected count", () =>
	{
		expect(service.selectedCount()).toBe(0);
		service.toggleSelection(1);
		expect(service.selectedCount()).toBe(1);
	});

	describe("getLogs", () =>
	{
		it("should create query with correct key", () =>
		{
			logRepository.getAll.and.returnValue(of(mockPagedResponse));

			const query = service.getLogs();

			expect(query.queryKey()).toEqual(["logs", service.filter()]);
		});

		it("should fetch logs from repository", async () =>
		{
			logRepository.getAll.and.returnValue(of(mockPagedResponse));

			const query = service.getLogs();
			await query.refetch();

			expect(logRepository.getAll).toHaveBeenCalledWith(service.filter());
			expect(query.data()).toEqual(mockPagedResponse);
		});
	});

	describe("getLogCount", () =>
	{
		it("should create query with correct key", () =>
		{
			logRepository.getCount.and.returnValue(of(mockCountResponse));

			const query = service.getLogCount();

			expect(query.queryKey()).toEqual([
				"logs",
				"count",
				service.filter()
			]);
		});

		it("should fetch log count from repository", async () =>
		{
			logRepository.getCount.and.returnValue(of(mockCountResponse));

			const query = service.getLogCount();
			await query.refetch();

			expect(logRepository.getCount).toHaveBeenCalledWith(
				service.filter()
			);
			expect(query.data()).toEqual(mockCountResponse);
		});
	});

	it("should update filter and reset to page 1", () =>
	{
		service.updateFilter({ logLevel: LogLevel.Error });

		const filter = service.filter();
		expect(filter.logLevel).toBe(LogLevel.Error);
		expect(filter.pageNumber).toBe(1);
	});

	it("should set page number", () =>
	{
		service.setPage(2);

		const filter = service.filter();
		expect(filter.pageNumber).toBe(2);
	});

	it("should set page size and reset to page 1", () =>
	{
		service.setPage(5); // Set to page 5
		service.setPageSize(100);

		const filter = service.filter();
		expect(filter.pageSize).toBe(100);
		expect(filter.pageNumber).toBe(1);
	});

	it("should clear filters", () =>
	{
		service.updateFilter({
			logLevel: LogLevel.Error,
			startDate: new Date()
		});

		service.clearFilters();

		const filter = service.filter();
		expect(filter.logLevel).toBeUndefined();
		expect(filter.startDate).toBeUndefined();
		expect(filter.pageNumber).toBe(1);
		expect(service.selectedIds().size).toBe(0);
	});

	it("should toggle selection", () =>
	{
		service.toggleSelection(1);

		expect(service.selectedIds().has(1)).toBe(true);
	});

	it("should toggle selection off", () =>
	{
		service.toggleSelection(1);
		service.toggleSelection(1);

		expect(service.selectedIds().has(1)).toBe(false);
	});

	it("should select all visible logs", () =>
	{
		service.selectAll([1, 2, 3]);

		expect(service.selectedIds().size).toBe(3);
		expect(service.selectedIds().has(1)).toBe(true);
		expect(service.selectedIds().has(2)).toBe(true);
		expect(service.selectedIds().has(3)).toBe(true);
	});

	it("should clear selection", () =>
	{
		service.toggleSelection(1);
		service.clearSelection();

		expect(service.selectedIds().size).toBe(0);
	});

	describe("deleteLog", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.deleteLog();

			expect(mutation).toBeTruthy();
		});

		it("should delete log via mutation", async () =>
		{
			logRepository.delete.and.returnValue(of(void 0));

			const mutation = service.deleteLog();
			await mutation.mutateAsync(1);

			expect(logRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should invalidate logs queries on success", async () =>
		{
			logRepository.delete.and.returnValue(of(void 0));

			const mutation = service.deleteLog();
			await mutation.mutateAsync(1);

			expect(
				queryClient.isFetching({ queryKey: ["logs"] })
			).toBeGreaterThan(0);
		});
	});

	describe("deleteLogs", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.deleteLogs();

			expect(mutation).toBeTruthy();
		});

		it("should delete logs via mutation", async () =>
		{
			logRepository.deleteBatch.and.returnValue(of(void 0));

			const mutation = service.deleteLogs();
			await mutation.mutateAsync([1, 2, 3]);

			expect(logRepository.deleteBatch).toHaveBeenCalledWith([1, 2, 3]);
		});

		it("should clear selection and invalidate queries on success", async () =>
		{
			logRepository.deleteBatch.and.returnValue(of(void 0));
			service.toggleSelection(1);
			service.toggleSelection(2);

			const mutation = service.deleteLogs();
			await mutation.mutateAsync([1, 2]);

			expect(service.selectedIds().size).toBe(0);
			expect(
				queryClient.isFetching({ queryKey: ["logs"] })
			).toBeGreaterThan(0);
		});
	});
});
