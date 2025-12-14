import { LogManagementService } from "@admin/logs/services";
import { ComponentFixture } from "@angular/core/testing";
import { PagedResultOfLogDto } from "@infrastructure/api";
import {
	createMockMutationResult,
	createMockQueryResult
} from "@testing/tanstack-query-helpers";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { LogList } from "./log-list";

describe("LogList",
	() =>
	{
		let component: LogList;
		let fixture: ComponentFixture<LogList>;
		let mockLogService: jasmine.SpyObj<LogManagementService>;

		beforeEach(
			async () =>
			{
			// Create properly typed mock query/mutation results
				const mockPagedResponse: PagedResultOfLogDto =
					{
						items: [],
						totalCount: 0,
						page: 1,
						pageSize: 50,
						totalPages: 0,
						hasPrevious: false,
						hasNext: false
					};

				const mockQuery: ReturnType<typeof createMockQueryResult<PagedResultOfLogDto>> =
					createMockQueryResult<
						PagedResultOfLogDto>(mockPagedResponse);
				const mockDeleteMutation: ReturnType<typeof createMockMutationResult<void, Error, number>> =
					createMockMutationResult<
						void,
						Error,
						number>();
				const mockBatchDeleteMutation: ReturnType<typeof createMockMutationResult<number, Error, number[]>> =
					createMockMutationResult<
						number,
						Error,
						number[]>();

				// Create mock service with all required methods
				mockLogService =
					jasmine.createSpyObj("LogManagementService",
						[
							"getLogs",
							"deleteLog",
							"deleteLogs",
							"updateFilter",
							"clearSelection",
							"selectAll",
							"deleteSelected"
						]);

				// Configure mock return values
				mockLogService.getLogs.and.returnValue(mockQuery);
				mockLogService.deleteLog.and.returnValue(mockDeleteMutation);
				mockLogService.deleteLogs.and.returnValue(mockBatchDeleteMutation);

				fixture =
					await new ComponentTestBed<LogList>()
					.withAdminDefaults()
					.withProvider(
						{
							provide: LogManagementService,
							useValue: mockLogService
						})
					.build(LogList);

				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				fixture.detectChanges();
				expect(component)
				.toBeTruthy();
			});

		it("should define column configuration",
			() =>
			{
				fixture.detectChanges();
				expect(component.columns)
				.toBeDefined();
				expect(component.columns.length as number)
				.toBe(6);
				expect(component.columns[0].key as string)
				.toBe("logLevel");
				expect(component.columns[1].key as string)
				.toBe("createDate");
			});

		it("should define quick filters",
			() =>
			{
				fixture.detectChanges();
				expect(component.quickFilters)
				.toBeDefined();
				expect(component.quickFilters.length as number)
				.toBe(3);
				expect(component.quickFilters[0].key as string)
				.toBe("all");
				expect(component.quickFilters[1].key as string)
				.toBe("warnings");
				expect(component.quickFilters[2].key as string)
				.toBe("errors");
			});

		it("should define row actions",
			() =>
			{
				fixture.detectChanges();
				expect(component.rowActions)
				.toBeDefined();
				expect(component.rowActions.length as number)
				.toBe(1);
				expect(component.rowActions[0].key as string)
				.toBe("delete");
			});

		it("should define bulk actions",
			() =>
			{
				fixture.detectChanges();
				expect(component.bulkActions)
				.toBeDefined();
				expect(component.bulkActions.length as number)
				.toBe(1);
				expect(component.bulkActions[0].key as string)
				.toBe("delete");
			});
	});
