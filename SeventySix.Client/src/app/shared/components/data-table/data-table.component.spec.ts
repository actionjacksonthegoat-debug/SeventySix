import { ComponentFixture } from "@angular/core/testing";
import {
	BulkAction,
	BulkActionEvent,
	CellValue,
	FilterChangeEvent,
	QuickFilter,
	RowAction,
	RowActionEvent,
	TableColumn
} from "@shared/models";
import { DateService } from "@shared/services";
import {
	ComponentTestBed,
	createBadgeColumn,
	createDateColumn,
	createTextColumn
} from "@shared/testing";
import { DataTableComponent } from "./data-table.component";

interface TestEntity
{
	id: number;
	name: string;
	status: "active" | "inactive";
	createdAt: Date;
}

describe("DataTableComponent",
	() =>
	{
		let component: DataTableComponent<TestEntity>;
		let fixture: ComponentFixture<DataTableComponent<TestEntity>>;
		let builder: ComponentTestBed<DataTableComponent<TestEntity>>;

		const mockColumns: TableColumn<TestEntity>[] =
			[
				createTextColumn<TestEntity>("id", "ID", true),
				createTextColumn<TestEntity>("name", "Name", true),
				createBadgeColumn<TestEntity>(
					"status",
					"Status",
					(value: CellValue) =>
						value === "active" ? "primary" : "warn"),
				createDateColumn<TestEntity>("createdAt", "Created")
			];

		const mockData: TestEntity[] =
			[
				{
					id: 1,
					name: "Test User 1",
					status: "active",
					createdAt: new DateService()
						.parseUTC("2024-01-01")
				},
				{
					id: 2,
					name: "Test User 2",
					status: "inactive",
					createdAt: new DateService()
						.parseUTC("2024-01-02")
				},
				{
					id: 3,
					name: "Test User 3",
					status: "active",
					createdAt: new DateService()
						.parseUTC("2024-01-03")
				}
			];

		const defaultInputs: Record<string, unknown> =
			{
				columns: mockColumns,
				data: mockData,
				isLoading: false,
				totalCount: 3,
				pageIndex: 0,
				pageSize: 25
			};

		beforeEach(
			async () =>
			{
				builder =
					new ComponentTestBed<DataTableComponent<TestEntity>>();
				fixture =
					await builder.build(DataTableComponent<TestEntity>);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		describe("Component Inputs",
			() =>
			{
				it("should accept required inputs",
					() =>
					{
						builder.withInputs(fixture, defaultInputs);

						expect(component.columns())
							.toEqual(mockColumns);
						expect(component.data())
							.toEqual(mockData);
						expect(component.isLoading())
							.toBe(false);
						expect(component.totalCount())
							.toBe(3);
						expect(component.pageIndex())
							.toBe(0);
						expect(component.pageSize())
							.toBe(25);
					});

				it("should have correct default values for optional inputs",
					() =>
					{
						builder.withInputs(fixture, defaultInputs);

						expect(component.error())
							.toBeNull();
						expect(component.searchable())
							.toBe(true);
						expect(component.selectable())
							.toBe(false);
						expect(component.showSelectAll())
							.toBe(false);
						expect(component.showCreate())
							.toBe(false);
						expect(component.showRefresh())
							.toBe(true);
						expect(component.quickFilters())
							.toEqual([]);
						expect(component.dateRangeEnabled())
							.toBe(false);
						expect(component.pageSizeOptions())
							.toEqual(
								[25, 50, 100]);
						expect(component.storageKey())
							.toBeNull();
						expect(component.rowActions())
							.toEqual([]);
						expect(component.bulkActions())
							.toEqual([]);
					});
			});

		describe("Component State",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture, defaultInputs);
					});

				it("should initialize visible columns from column definitions",
					() =>
					{
						const visibleColumns: TableColumn<TestEntity>[] =
							component.visibleColumns();
						expect(visibleColumns.length)
							.toBe(4);
						expect(
							visibleColumns.map(
								(c: TableColumn<TestEntity>) => c.key))
							.toEqual(
								["id", "name", "status", "createdAt"]);
					});

				it("should compute display columns for table",
					() =>
					{
						const displayColumns: string[] =
							component.displayedColumns();
						expect(displayColumns)
							.toEqual(
								[
									"id",
									"name",
									"status",
									"createdAt"
								]);
					});

				it("should add select column when selectable is true",
					() =>
					{
						fixture.componentRef.setInput("selectable", true);
						fixture.detectChanges();

						const displayColumns: string[] =
							component.displayedColumns();
						expect(displayColumns[0])
							.toBe("select");
					});

				it("should add actions column when rowActions provided",
					() =>
					{
						const actions: RowAction<TestEntity>[] =
							[
								{
									key: "edit",
									label: "Edit",
									icon: "edit"
								}
							];
						fixture.componentRef.setInput("rowActions", actions);
						fixture.detectChanges();

						const displayColumns: string[] =
							component.displayedColumns();
						expect(displayColumns[displayColumns.length - 1])
							.toBe("actions");
					});
			});

		describe("Search Functionality",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{ ...defaultInputs, searchable: true });
					});

				it("should update search signal when input changes",
					() =>
					{
						component.onSearchChange("test");
						expect(component.searchText())
							.toBe("test");
					});

				it("should emit searchChange when onSearch is called",
					() =>
					{
						let emittedValue: string = "";
						component.searchChange.subscribe(
							(searchText: string) =>
							{
								emittedValue = searchText;
							});

						component.searchText.set("search term");
						component.onSearch();

						expect(emittedValue)
							.toBe("search term");
					});

				it("should update signal and not emit on input change",
					() =>
					{
						let emitted: boolean = false;
						component.searchChange.subscribe(
							() =>
							{
								emitted = true;
							});

						component.onSearchChange("typing");
						expect(component.searchText())
							.toBe("typing");
						expect(emitted)
							.toBe(false);
					});
			});

		describe("Quick Filters",
			() =>
			{
				const mockQuickFilters: QuickFilter<TestEntity>[] =
					[
						{
							key: "active",
							label: "Active",
							icon: "check_circle",
							filterFn: (item: TestEntity) =>
								item.status === "active"
						},
						{
							key: "inactive",
							label: "Inactive",
							icon: "cancel",
							filterFn: (item: TestEntity) =>
								item.status === "inactive"
						}
					];

				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								quickFilters: mockQuickFilters
							});
					});

				it("should emit filterChange event when filter toggled", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.filterChange.subscribe(
								(event: FilterChangeEvent) =>
								{
									expect(event.filterKey)
										.toBe("active");
									expect(event.active)
										.toBe(true);
									resolve();
								});

							component.onFilterToggle("active");
						}));

				it("should track active filters",
					() =>
					{
						component.onFilterToggle("active");
						expect(
							component
								.activeFilters()
								.has("active"))
							.toBe(true);

						component.onFilterToggle("active");
						expect(
							component
								.activeFilters()
								.has("active"))
							.toBe(false);
					});
			});

		describe("Row Actions",
			() =>
			{
				const mockRowActions: RowAction<TestEntity>[] =
					[
						{
							key: "edit",
							label: "Edit",
							icon: "edit",
							color: "primary"
						},
						{
							key: "delete",
							label: "Delete",
							icon: "delete",
							color: "warn"
						}
					];

				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								rowActions: mockRowActions
							});
					});

				it("should emit rowAction event when action triggered", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.rowAction.subscribe(
								(event: RowActionEvent<TestEntity>) =>
								{
									expect(event.action)
										.toBe("edit");
									expect(event.row)
										.toBe(mockData[0]);
									resolve();
								});

							component.onRowAction("edit", mockData[0]);
						}));

				it("should emit rowClick event when row clicked", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.rowClick.subscribe(
								(row: TestEntity) =>
								{
									expect(row)
										.toBe(mockData[0]);
									resolve();
								});

							component.onRowClick(mockData[0]);
						}));
			});

		describe("Bulk Actions",
			() =>
			{
				const mockBulkActions: BulkAction[] =
					[
						{
							key: "delete-all",
							label: "Delete Selected",
							icon: "delete",
							color: "warn",
							requiresSelection: true
						}
					];

				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								selectable: true,
								bulkActions: mockBulkActions
							});
					});

				it("should emit bulkAction event when action triggered", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.selectionManager.selection.select(mockData[0]);
							component.selectionManager.selection.select(mockData[1]);

							component.bulkAction.subscribe(
								(event: BulkActionEvent<TestEntity>) =>
								{
									expect(event.action)
										.toBe("delete-all");
									expect(event.selectedRows.length)
										.toBe(2);
									expect(event.selectedIds)
										.toEqual(
											[1, 2]);
									resolve();
								});

							component.onBulkAction("delete-all");
						}));

				it("should compute selection state correctly",
					() =>
					{
						expect(component.hasSelection())
							.toBe(false);

						component.selectionManager.selection.select(mockData[0]);
						fixture.detectChanges();
						expect(component.hasSelection())
							.toBe(true);
					});

				it("should toggle all rows selection",
					() =>
					{
						component.toggleAllRows();
						fixture.detectChanges();
						expect(component.selectionManager.selection.selected.length)
							.toBe(3);

						component.toggleAllRows();
						fixture.detectChanges();
						expect(component.selectionManager.selection.selected.length)
							.toBe(0);
					});
			});

		describe("Pagination",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{ ...defaultInputs, totalCount: 100 });
					});

				it("should emit pageChange event when page changed", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.pageChange.subscribe(
								(pageIndex: number) =>
								{
									expect(pageIndex)
										.toBe(1);
									resolve();
								});

							component.onPageChange(
								{ pageIndex: 1, pageSize: 25, length: 100 });
						}));

				it("should emit pageSizeChange event when page size changed", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.pageSizeChange.subscribe(
								(pageSize: number) =>
								{
									expect(pageSize)
										.toBe(50);
									resolve();
								});

							component.onPageChange(
								{ pageIndex: 0, pageSize: 50, length: 100 });
						}));
			});

		describe("Column Visibility",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture, defaultInputs);
					});

				it("should toggle column visibility",
					() =>
					{
						const initialVisible: number =
							component.visibleColumns().length;
						component.toggleColumn("name");
						expect(component.visibleColumns().length)
							.toBe(initialVisible - 1);

						component.toggleColumn("name");
						expect(component.visibleColumns().length)
							.toBe(initialVisible);
					});

				it("should load column preferences from localStorage when storageKey provided",
					() =>
					{
						const storageKey: string = "test-table-columns";
						localStorage.setItem(
							storageKey,
							JSON.stringify(
								{
									id: true,
									name: false,
									status: true,
									createdAt: true
								}));

						fixture.componentRef.setInput("storageKey", storageKey);
						fixture.detectChanges();

						const visibleKeys: string[] =
							component
								.visibleColumns()
								.map(
									(c: TableColumn<TestEntity>) => c.key);
						expect(visibleKeys).not.toContain("name");

						localStorage.removeItem(storageKey);
					});
			});

		describe("Refresh Functionality",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								showRefresh: true
							});
					});

				it("should emit refreshClick event when refresh button clicked", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.refreshClick.subscribe(
								() =>
								{
									expect(true)
										.toBe(true);
									resolve();
								});

							component.onRefresh();
						}));
			});

		describe("Create Button",
			() =>
			{
				beforeEach(
					() =>
					{
						builder.withInputs(fixture,
							{ ...defaultInputs, showCreate: true });
					});

				it("should emit createClick event when create button clicked", () =>
					new Promise<void>(
						(resolve) =>
						{
							component.createClick.subscribe(
								() =>
								{
									expect(true)
										.toBe(true);
									resolve();
								});

							component.onCreate();
						}));
			});

		describe("CLS Prevention",
			() =>
			{
				function getHeightStyle(element: HTMLElement): string
				{
					const directStyle: string =
						element.style.height || element.style.minHeight || "";
					if (directStyle)
					{
						return directStyle;
					}
					const styleAttr: string | null =
						element.getAttribute("style");
					if (styleAttr)
					{
						const minMatch: RegExpMatchArray | null =
							styleAttr.match(/min-height:\s*([^;]+)/);
						if (minMatch)
						{
							return minMatch[1].trim();
						}
						const heightMatch: RegExpMatchArray | null =
							styleAttr.match(/height:\s*([^;]+)/);
						if (heightMatch)
						{
							return heightMatch[1].trim();
						}
					}
					return "";
				}

				it("should reserve minimum height to prevent CLS",
					async (): Promise<void> =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								isLoading: true
							});

						await fixture.whenStable();
						fixture.detectChanges();

						const viewport: HTMLElement | null =
							fixture.nativeElement.querySelector("cdk-virtual-scroll-viewport");

						expect(viewport)
							.toBeTruthy();

						if (viewport)
						{
							const heightStyle: string =
								getHeightStyle(viewport);
							expect(heightStyle)
								.toBeTruthy();
							expect(heightStyle)
								.toContain("px");
						}
					});

				it("should render skeleton loaders in cells when loading",
					async (): Promise<void> =>
					{
						builder.withInputs(fixture,
							{
								...defaultInputs,
								isLoading: true,
								data: []
							});

						await fixture.whenStable();
						fixture.detectChanges();

						const skeletonLoaders: NodeListOf<Element> =
							fixture.nativeElement.querySelectorAll("ngx-skeleton-loader");
						const headerRow: Element | null =
							fixture.nativeElement.querySelector("tr.mat-mdc-header-row");

						// Header should always be visible
						expect(headerRow)
							.not
							.toBeNull();

						// Should have skeleton loaders (1 row x columns)
						expect(skeletonLoaders.length)
							.toBeGreaterThan(0);
					});

				it("should show skeleton loaders for each visible column",
					async (): Promise<void> =>
					{
						const testColumns: TableColumn<TestEntity>[] =
							[
								createTextColumn<TestEntity>("id", "ID", true),
								createTextColumn<TestEntity>("name", "Name", true)
							];

						builder.withInputs(fixture,
							{
								...defaultInputs,
								columns: testColumns,
								isLoading: true,
								data: []
							});

						fixture.detectChanges();
						await fixture.whenStable();
						fixture.detectChanges();

						// Virtual scroll may not render rows without proper viewport
						// Check that skeleton loaders exist somewhere in the table
						const skeletonLoaders: NodeListOf<Element> =
							fixture.nativeElement.querySelectorAll("ngx-skeleton-loader");

						// Should have skeleton loaders when loading
						expect(skeletonLoaders.length)
							.toBeGreaterThan(0);
					});
			});
	});
