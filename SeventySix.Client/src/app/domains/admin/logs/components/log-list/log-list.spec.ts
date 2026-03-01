import { LogDto, PagedResultOfLogDto } from "@admin/logs/models";
import { LogManagementService } from "@admin/logs/services";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { DateService } from "@shared/services";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockNotificationService,
	MockNotificationService
} from "@shared/testing";
import {
	createMockMutationResult,
	createMockQueryResult
} from "@testing/tanstack-query-helpers";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { of } from "rxjs";
import { Mock, vi } from "vitest";
import { LogList } from "./log-list";

interface MockLogManagementService
{
	getLogs: ReturnType<typeof vi.fn>;
	deleteLog: ReturnType<typeof vi.fn>;
	deleteLogs: ReturnType<typeof vi.fn>;
	updateFilter: ReturnType<typeof vi.fn>;
	clearSelection: ReturnType<typeof vi.fn>;
	selectAll: ReturnType<typeof vi.fn>;
	deleteSelected: ReturnType<typeof vi.fn>;
}

describe("LogList",
	() =>
	{
		let component: LogList;
		let fixture: ComponentFixture<LogList>;
		let mockLogService: MockLogManagementService;

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
					{
						getLogs: vi.fn(),
						deleteLog: vi.fn(),
						deleteLogs: vi.fn(),
						updateFilter: vi.fn(),
						clearSelection: vi.fn(),
						selectAll: vi.fn(),
						deleteSelected: vi.fn()
					};

				// Configure mock return values
				mockLogService.getLogs.mockReturnValue(mockQuery);
				mockLogService.deleteLog.mockReturnValue(mockDeleteMutation);
				mockLogService.deleteLogs.mockReturnValue(mockBatchDeleteMutation);

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

const TEST_LOG: LogDto =
	{
		id: 99,
		logLevel: "Error",
		message: "test error",
		exceptionMessage: null,
		baseExceptionMessage: null,
		stackTrace: null,
		sourceContext: null,
		requestMethod: null,
		requestPath: null,
		statusCode: null,
		durationMs: null,
		properties: null,
		createDate: "2024-01-01T00:00:00Z",
		machineName: null,
		environment: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null
	};

describe("LogList action handlers",
	() =>
	{
		let component: LogList;
		let fixture: ComponentFixture<LogList>;
		let mockLogService: {
			getLogs: Mock;
			deleteLog: Mock;
			deleteLogs: Mock;
			updateFilter: Mock;
			clearSelection: Mock;
			selectAll: Mock;
			deleteSelected: Mock;
			setPage: Mock;
			setPageSize: Mock;
			forceRefresh: Mock;
		};
		let mockDeleteMutation: ReturnType<typeof createMockMutationResult<void, Error, number>>;
		let mockBatchDeleteMutation: ReturnType<typeof createMockMutationResult<number, Error, number[]>>;
		let mockDialogService: { confirmDelete: Mock; };
		let mockNotificationService: MockNotificationService;
		let mockMatDialog: { open: Mock; };

		beforeEach(
			async () =>
			{
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

				mockDeleteMutation =
					createMockMutationResult<void, Error, number>();
				mockBatchDeleteMutation =
					createMockMutationResult<number, Error, number[]>();

				mockLogService =
					{
						getLogs: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(mockPagedResponse)),
						deleteLog: vi
							.fn()
							.mockReturnValue(mockDeleteMutation),
						deleteLogs: vi
							.fn()
							.mockReturnValue(mockBatchDeleteMutation),
						updateFilter: vi.fn(),
						clearSelection: vi.fn(),
						selectAll: vi.fn(),
						deleteSelected: vi.fn(),
						setPage: vi.fn(),
						setPageSize: vi.fn(),
						forceRefresh: vi.fn()
					};

				mockDialogService =
					{
						confirmDelete: vi
							.fn()
							.mockReturnValue(of(true))
					};

				mockNotificationService =
					createMockNotificationService();

				mockMatDialog =
					{
						open: vi
							.fn()
							.mockReturnValue(
								{
									componentInstance: {
										deleteLog: {
											subscribe: vi
												.fn()
												.mockReturnValue(
													{ unsubscribe: vi.fn() })
										}
									},
									afterClosed: vi
										.fn()
										.mockReturnValue(of(undefined))
								})
					};

				fixture =
					await new ComponentTestBed<LogList>()
						.withAdminDefaults()
						.withProvider(
							{
								provide: LogManagementService,
								useValue: mockLogService
							})
						.withProvider(
							{
								provide: DialogService,
								useValue: mockDialogService
							})
						.withProvider(
							{
								provide: NotificationService,
								useValue: mockNotificationService
							})
						.withProvider(
							{
								provide: MatDialog,
								useValue: mockMatDialog
							})
						.build(LogList);

				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		describe("onSearch",
			() =>
			{
				it("should update filter with search term",
					() =>
					{
						component.onSearch("test");

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ searchTerm: "test" });
					});

				it("should update filter with undefined when search is empty",
					() =>
					{
						component.onSearch("");

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ searchTerm: undefined });
					});
			});

		describe("onFilterChange",
			() =>
			{
				it("should set logLevel to Warning for warnings filter",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "warnings", active: true });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ logLevel: "Warning" });
					});

				it("should set logLevel to Error for errors filter",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "errors", active: true });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ logLevel: "Error" });
					});

				it("should set logLevel to null for all filter",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "all", active: true });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ logLevel: null });
					});

				it("should revert to all when deactivating current filter",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "warnings", active: false });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ logLevel: null });
					});
			});

		describe("onRowAction delete",
			() =>
			{
				it("should call confirmDelete and mutate when confirmed",
					() =>
					{
						component.onRowAction(
							{ action: "delete", row: TEST_LOG });

						expect(mockDialogService.confirmDelete)
							.toHaveBeenCalledWith("log");
						expect(mockDeleteMutation.mutate)
							.toHaveBeenCalledWith(
								TEST_LOG.id,
								expect.anything());
					});

				it("should not mutate when delete is cancelled",
					() =>
					{
						mockDialogService.confirmDelete.mockReturnValue(of(false));

						component.onRowAction(
							{ action: "delete", row: TEST_LOG });

						expect(mockDeleteMutation.mutate)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("onBulkAction delete",
			() =>
			{
				it("should confirm and mutate with selected ids",
					() =>
					{
						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: [1, 2, 3]
							});

						expect(mockDialogService.confirmDelete)
							.toHaveBeenCalledWith("log", 3);
						expect(mockBatchDeleteMutation.mutate)
							.toHaveBeenCalledWith(
								[1, 2, 3],
								expect.anything());
					});

				it("should show warning when no logs are selected",
					() =>
					{
						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: []
							});

						expect(mockNotificationService.warning)
							.toHaveBeenCalledWith(
								"No logs selected for deletion");
						expect(mockDialogService.confirmDelete)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("onPageChange",
			() =>
			{
				it("should call setPage with 1-based index",
					() =>
					{
						component.onPageChange(2);

						expect(mockLogService.setPage)
							.toHaveBeenCalledWith(3);
					});
			});

		describe("mutation callbacks",
			() =>
			{
				it("should show success notification when bulk delete succeeds",
					() =>
					{
						(mockBatchDeleteMutation.mutate as unknown as Mock).mockImplementation(
							(
								_ids: number[],
								options?: { onSuccess?: () => void; }) =>
							{
								options?.onSuccess?.();
							});

						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: [1, 2]
							});

						expect(mockNotificationService.success)
							.toHaveBeenCalled();
					});

				it("should show error notification when bulk delete fails",
					() =>
					{
						(mockBatchDeleteMutation.mutate as unknown as Mock).mockImplementation(
							(
								_ids: number[],
								options?: { onError?: (error: Error) => void; }) =>
							{
								options?.onError?.(new Error("Server error"));
							});

						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: [1]
							});

						expect(mockNotificationService.error)
							.toHaveBeenCalled();
					});

				it("should show success notification when single delete succeeds",
					() =>
					{
						(mockDeleteMutation.mutate as unknown as Mock).mockImplementation(
							(
								_id: number,
								options?: { onSuccess?: () => void; }) =>
							{
								options?.onSuccess?.();
							});

						component.onRowAction(
							{ action: "delete", row: TEST_LOG });

						expect(mockNotificationService.success)
							.toHaveBeenCalled();
					});

				it("should show error notification when single delete fails",
					() =>
					{
						(mockDeleteMutation.mutate as unknown as Mock).mockImplementation(
							(
								_id: number,
								options?: { onError?: (error: Error) => void; }) =>
							{
								options?.onError?.(new Error("Delete failed"));
							});

						component.onRowAction(
							{ action: "delete", row: TEST_LOG });

						expect(mockNotificationService.error)
							.toHaveBeenCalled();
					});
			});

		describe("column formatters",
			() =>
			{
				describe("badgeColor formatter",
					() =>
					{
						it("should return warn for Error level",
							() =>
							{
								expect(component.columns[0].badgeColor!("Error"))
									.toBe("warn");
							});

						it("should return warn for Fatal level",
							() =>
							{
								expect(component.columns[0].badgeColor!("Fatal"))
									.toBe("warn");
							});

						it("should return accent for Warning level",
							() =>
							{
								expect(component.columns[0].badgeColor!("Warning"))
									.toBe("accent");
							});

						it("should return primary for Information level",
							() =>
							{
								expect(component.columns[0].badgeColor!("Information"))
									.toBe("primary");
							});
					});

				describe("message formatter",
					() =>
					{
						it("should return exceptionMessage when present",
							() =>
							{
								const result: string =
									component.columns[2].formatter!(
										null,
										{ ...TEST_LOG, exceptionMessage: "ex error", message: "msg" });

								expect(result)
									.toBe("ex error");
							});

						it("should return message when exceptionMessage is null",
							() =>
							{
								const result: string =
									component.columns[2].formatter!(
										null,
										{ ...TEST_LOG, exceptionMessage: null, message: "fallback" });

								expect(result)
									.toBe("fallback");
							});

						it("should return empty string when row is undefined",
							() =>
							{
								const result: string =
									component.columns[2].formatter!(
										null,
										undefined);

								expect(result)
									.toBe("");
							});
					});
			});

		describe("onDateRangeChange",
			() =>
			{
				it("should pass start and end dates from event to updateFilter",
					() =>
					{
						const dateService: DateService =
							new DateService();
						const startDate: Date =
							dateService.nowDate();
						const endDate: Date =
							dateService.nowDate();

						component.onDateRangeChange(
							{ preset: "30d", startDate, endDate });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ startDate, endDate });
					});

				it("should pass undefined dates when preset has no date range",
					() =>
					{
						component.onDateRangeChange(
							{ preset: "all" });

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{ startDate: undefined, endDate: undefined });
					});
			});

		describe("onSortChange",
			() =>
			{
				it("should update filter with sort parameters",
					() =>
					{
						component.onSortChange(
							{
								sortBy: "logLevel",
								sortDescending: true
							});

						expect(mockLogService.updateFilter)
							.toHaveBeenCalledWith(
								{
									sortBy: "logLevel",
									sortDescending: true
								});
					});
			});

		describe("onPageSizeChange",
			() =>
			{
				it("should call setPageSize with new size",
					() =>
					{
						component.onPageSizeChange(25);

						expect(mockLogService.setPageSize)
							.toHaveBeenCalledWith(25);
					});
			});

		describe("onRowClick",
			() =>
			{
				it("should open log detail dialog",
					() =>
					{
						component.onRowClick(TEST_LOG);

						expect(mockMatDialog.open)
							.toHaveBeenCalled();
					});
			});

		describe("onRowAction view",
			() =>
			{
				it("should open log detail dialog",
					() =>
					{
						component.onRowAction(
							{ action: "view", row: TEST_LOG });

						expect(mockMatDialog.open)
							.toHaveBeenCalled();
					});
			});

		describe("singular bulk delete message",
			() =>
			{
				it("should use singular entry when deleting exactly one log",
					() =>
					{
						(mockBatchDeleteMutation.mutate as unknown as Mock).mockImplementation(
							(
								_ids: number[],
								options?: { onSuccess?: () => void; }) =>
							{
								options?.onSuccess?.();
							});

						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: [42]
							});

						expect(mockNotificationService.success)
							.toHaveBeenCalledWith(
								"Successfully deleted 1 log entry");
					});
			});

		describe("logLevel formatter",
			() =>
			{
				it("should format Error level to string",
					() =>
					{
						const result: string =
							component.columns[0].formatter!("Error");

						expect(result)
							.toBe("Error");
					});

				it("should format Warning level to string",
					() =>
					{
						const result: string =
							component.columns[0].formatter!("Warning");

						expect(result)
							.toBe("Warning");
					});

				it("should format Information level to string",
					() =>
					{
						const result: string =
							component.columns[0].formatter!("Information");

						expect(result)
							.toBe("Information");
					});
			});

		describe("createDate formatter",
			() =>
			{
				it("should format date value",
					() =>
					{
						const result: string =
							component.columns[1].formatter!("2024-01-01T00:00:00Z");

						expect(result)
							.toBeTruthy();
					});
			});

		describe("onRefresh",
			() =>
			{
				it("should call forceRefresh on the log service",
					() =>
					{
						component.onRefresh();

						expect(mockLogService.forceRefresh)
							.toHaveBeenCalled();
					});
			});

		describe("onBulkAction delete cancellation",
			() =>
			{
				it("should not mutate when bulk delete is cancelled",
					() =>
					{
						mockDialogService.confirmDelete.mockReturnValue(of(false));

						component.onBulkAction(
							{
								action: "delete",
								selectedRows: [],
								selectedIds: [1, 2]
							});

						expect(mockBatchDeleteMutation.mutate)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("viewLogDetails dialog interaction",
			() =>
			{
				it("should subscribe to deleteLog event from dialog",
					() =>
					{
						component.onRowClick(TEST_LOG);

						const dialogRef: { componentInstance: { deleteLog: { subscribe: Mock; }; }; } =
							mockMatDialog
								.open
								.mock
								.results[0]
								.value;

						expect(dialogRef.componentInstance.deleteLog.subscribe)
							.toHaveBeenCalled();
					});

				it("should clean up subscription when dialog closes",
					() =>
					{
						component.onRowClick(TEST_LOG);

						const dialogRef: { afterClosed: Mock; } =
							mockMatDialog.open.mock.results[0].value;

						expect(dialogRef.afterClosed)
							.toHaveBeenCalled();
					});
			});
	});