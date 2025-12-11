import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { LogManagementService } from "./log-management.service";
import { LogRepository } from "@admin/logs/repositories";
import { LogDto, LogLevel } from "@admin/logs/models";
import { PagedResultOfLogDto } from "@infrastructure/api";
import { setupServiceTest, createMockLogRepository } from "@testing";

describe("LogManagementService", () =>
{
	let service: LogManagementService;
	let mockRepository: ReturnType<typeof createMockLogRepository>;

	const mockLog: LogDto = {
		id: 1,
		createDate: "2024-01-01T12:00:00Z",
		logLevel: "Information",
		message: "Test log",
		exceptionMessage: null,
		baseExceptionMessage: null,
		stackTrace: null,
		sourceContext: "Test",
		requestMethod: null,
		requestPath: null,
		statusCode: null,
		durationMs: null,
		properties: null,
		machineName: null,
		environment: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null
	};

	const mockPagedResponse: PagedResultOfLogDto = {
		items: [mockLog as any],
		totalCount: 1,
		page: 1,
		pageSize: 50,
		totalPages: 1,
		hasPrevious: false,
		hasNext: false
	};

	beforeEach(() =>
	{
		mockRepository = createMockLogRepository();

		setupServiceTest(LogManagementService, [
			{ provide: LogRepository, useValue: mockRepository }
		]);

		service = TestBed.inject(LogManagementService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getLogs", () =>
	{
		it("should fetch logs from repository", async () =>
		{
			mockRepository.getAllPaged.and.returnValue(of(mockPagedResponse));

			const query = TestBed.runInInjectionContext(() =>
				service.getLogs()
			);
			const result = await query.refetch();

			expect(mockRepository.getAllPaged).toHaveBeenCalledWith(
				service.getCurrentFilter(),
				undefined
			);
			expect(result.data).toEqual(mockPagedResponse);
		});
	});

	describe("updateFilter", () =>
	{
		it("should update filter and reset to page 1", () =>
		{
			service.updateFilter({ logLevel: LogLevel.Error.toString() });

			const filter = service.getCurrentFilter();
			expect(filter.logLevel).toBe(LogLevel.Error.toString());
			expect(filter.page).toBe(1);
		});
	});

	describe("setPage", () =>
	{
		it("should update page number without resetting other filters", () =>
		{
			service.updateFilter({ logLevel: LogLevel.Error.toString() });
			service.setPage(3);

			const filter = service.getCurrentFilter();
			expect(filter.page).toBe(3);
			expect(filter.logLevel).toBe(LogLevel.Error.toString());
		});
	});

	describe("setPageSize", () =>
	{
		it("should update page size and reset to page 1", () =>
		{
			service.setPage(5);
			service.setPageSize(100);

			const filter = service.getCurrentFilter();
			expect(filter.pageSize).toBe(100);
			expect(filter.page).toBe(1);
		});
	});

	describe("clearFilters", () =>
	{
		it("should reset filters and clear selection", () =>
		{
			service.updateFilter({
				logLevel: LogLevel.Error.toString(),
				startDate: new Date()
			});
			service.toggleSelection(1);

			service.clearFilters();

			const filter = service.getCurrentFilter();
			expect(filter.logLevel).toBeUndefined();
			// startDate/endDate are reset to initial values (last 24 hours), not undefined
			expect(filter.startDate).toBeDefined();
			expect(filter.endDate).toBeDefined();
			expect(filter.page).toBe(1);
			expect(filter.pageSize).toBe(50);
			expect(service.selectedIds().size).toBe(0);
		});
	});

	describe("selection", () =>
	{
		it("should toggle selection on and off", () =>
		{
			service.toggleSelection(1);
			expect(service.selectedIds().has(1)).toBe(true);
			expect(service.selectedCount()).toBe(1);

			service.toggleSelection(1);
			expect(service.selectedIds().has(1)).toBe(false);
			expect(service.selectedCount()).toBe(0);
		});

		it("should select all visible logs", () =>
		{
			service.selectAll([1, 2, 3]);

			expect(service.selectedIds().size).toBe(3);
			expect(service.selectedCount()).toBe(3);
		});

		it("should clear selection", () =>
		{
			service.toggleSelection(1);
			service.clearSelection();

			expect(service.selectedIds().size).toBe(0);
		});
	});

	describe("deleteLog", () =>
	{
		it("should delete single log", async () =>
		{
			mockRepository.delete.and.returnValue(of(void 0));

			const mutation = TestBed.runInInjectionContext(() =>
				service.deleteLog()
			);
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});
	});

	describe("deleteLogs", () =>
	{
		it("should delete multiple logs and clear selection", async () =>
		{
			mockRepository.deleteBatch.and.returnValue(of(2));
			service.toggleSelection(1);
			service.toggleSelection(2);

			const mutation = TestBed.runInInjectionContext(() =>
				service.deleteLogs()
			);
			await mutation.mutateAsync([1, 2]);

			expect(mockRepository.deleteBatch).toHaveBeenCalledWith([1, 2]);
			expect(service.selectedIds().size).toBe(0);
		});
	});

	describe("forceRefresh", () =>
	{
		it("should toggle force refresh trigger", async () =>
		{
			// Access the private signal via bracket notation for testing
			const getSignalValue = (): boolean =>
				(service as any)["forceRefreshTrigger"]();

			const initialValue: boolean = getSignalValue();

			// Force refresh
			await TestBed.runInInjectionContext(() => service.forceRefresh());

			const newValue: boolean = getSignalValue();

			// Signal should have toggled
			expect(newValue).toBe(!initialValue);
		});
	});
});
