import { describe, expect, it } from "vitest";
import {
	DataTablePaginationManager,
	PaginationConfig
} from "./pagination.manager";

describe("DataTablePaginationManager",
	() =>
	{
		describe("initialization",
			() =>
			{
				it("should initialize with default values",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager();

						expect(manager.pageIndex())
							.toBe(0);
						expect(manager.pageSize())
							.toBe(50);
						expect(manager.pageSizeOptions)
							.toEqual(
								[25, 50, 100]);
					});

				it("should initialize with custom config",
					() =>
					{
						const config: PaginationConfig =
							{
								initialPageIndex: 2,
								initialPageSize: 25,
								pageSizeOptions: [10, 25, 50]
							};

						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(config);

						expect(manager.pageIndex())
							.toBe(2);
						expect(manager.pageSize())
							.toBe(25);
						expect(manager.pageSizeOptions)
							.toEqual(
								[10, 25, 50]);
					});

				it("should merge partial config with defaults",
					() =>
					{
						const config: PaginationConfig =
							{ initialPageSize: 100 };

						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(config);

						expect(manager.pageIndex())
							.toBe(0);
						expect(manager.pageSize())
							.toBe(100);
					});
			});

		describe("handlePageChange",
			() =>
			{
				it("should update page index when changed",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager();

						const result: { pageChanged: boolean; sizeChanged: boolean; } =
							manager.handlePageChange(
								{
									pageIndex: 3,
									pageSize: 50,
									length: 200,
									previousPageIndex: 0
								});

						expect(result.pageChanged)
							.toBe(true);
						expect(result.sizeChanged)
							.toBe(false);
						expect(manager.pageIndex())
							.toBe(3);
					});

				it("should update page size and reset to first page when size changed",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(
								{ initialPageIndex: 5 });

						const result: { pageChanged: boolean; sizeChanged: boolean; } =
							manager.handlePageChange(
								{
									pageIndex: 5,
									pageSize: 100,
									length: 500,
									previousPageIndex: 5
								});

						expect(result.sizeChanged)
							.toBe(true);
						expect(manager.pageSize())
							.toBe(100);
						expect(manager.pageIndex())
							.toBe(0);
					});

				it("should return false for both when nothing changed",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager();

						const result: { pageChanged: boolean; sizeChanged: boolean; } =
							manager.handlePageChange(
								{
									pageIndex: 0,
									pageSize: 50,
									length: 100,
									previousPageIndex: 0
								});

						expect(result.pageChanged)
							.toBe(false);
						expect(result.sizeChanged)
							.toBe(false);
					});
			});

		describe("setPageIndex",
			() =>
			{
				it("should set valid page index",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager();

						manager.setPageIndex(5);

						expect(manager.pageIndex())
							.toBe(5);
					});

				it("should not set negative page index",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(
								{ initialPageIndex: 3 });

						manager.setPageIndex(-1);

						expect(manager.pageIndex())
							.toBe(3);
					});
			});

		describe("setPageSize",
			() =>
			{
				it("should set valid page size",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager();

						manager.setPageSize(100);

						expect(manager.pageSize())
							.toBe(100);
					});

				it("should not set zero or negative page size",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(
								{ initialPageSize: 50 });

						manager.setPageSize(0);
						expect(manager.pageSize())
							.toBe(50);

						manager.setPageSize(-10);
						expect(manager.pageSize())
							.toBe(50);
					});
			});

		describe("resetToFirstPage",
			() =>
			{
				it("should reset page index to zero",
					() =>
					{
						const manager: DataTablePaginationManager =
							new DataTablePaginationManager(
								{ initialPageIndex: 10 });

						manager.resetToFirstPage();

						expect(manager.pageIndex())
							.toBe(0);
					});
			});
	});
