import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	TableColumn,
	QuickFilter,
	RowAction,
	BulkAction,
	RowActionEvent,
	BulkActionEvent,
	FilterChangeEvent
} from "@shared/models";
import { DataTableComponent } from "./data-table.component";

interface TestEntity
{
	id: number;
	name: string;
	status: "active" | "inactive";
	createdAt: Date;
}

describe("DataTableComponent", () =>
{
	let component: DataTableComponent<TestEntity>;
	let fixture: ComponentFixture<DataTableComponent<TestEntity>>;

	const mockColumns: TableColumn<TestEntity>[] = [
		{
			key: "id",
			label: "ID",
			sortable: true,
			visible: true,
			type: "text"
		},
		{
			key: "name",
			label: "Name",
			sortable: true,
			visible: true,
			type: "text"
		},
		{
			key: "status",
			label: "Status",
			sortable: false,
			visible: true,
			type: "badge",
			badgeColor: (value: unknown) =>
				value === "active" ? "primary" : "warn"
		},
		{
			key: "createdAt",
			label: "Created",
			sortable: true,
			visible: true,
			type: "date"
		}
	];

	const mockData: TestEntity[] = [
		{
			id: 1,
			name: "Test User 1",
			status: "active",
			createdAt: new Date("2024-01-01")
		},
		{
			id: 2,
			name: "Test User 2",
			status: "inactive",
			createdAt: new Date("2024-01-02")
		},
		{
			id: 3,
			name: "Test User 3",
			status: "active",
			createdAt: new Date("2024-01-03")
		}
	];

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [DataTableComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(DataTableComponent<TestEntity>);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	describe("Component Inputs", () =>
	{
		it("should accept required inputs", () =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);

			fixture.detectChanges();

			expect(component.columns()).toEqual(mockColumns);
			expect(component.data()).toEqual(mockData);
			expect(component.isLoading()).toBe(false);
			expect(component.totalCount()).toBe(3);
			expect(component.pageIndex()).toBe(0);
			expect(component.pageSize()).toBe(25);
		});

		it("should have correct default values for optional inputs", () =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);

			fixture.detectChanges();

			expect(component.error()).toBeNull();
			expect(component.searchable()).toBe(true);
			expect(component.selectable()).toBe(false);
			expect(component.showSelectAll()).toBe(false);
			expect(component.showCreate()).toBe(false);
			expect(component.showRefresh()).toBe(true);
			expect(component.quickFilters()).toEqual([]);
			expect(component.dateRangeEnabled()).toBe(false);
			expect(component.pageSizeOptions()).toEqual([25, 50, 100]);
			expect(component.storageKey()).toBeNull();
			expect(component.rowActions()).toEqual([]);
			expect(component.bulkActions()).toEqual([]);
		});
	});

	describe("Component State", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.detectChanges();
		});

		it("should initialize visible columns from column definitions", () =>
		{
			const visibleColumns = component.visibleColumns();
			expect(visibleColumns.length).toBe(4);
			expect(
				visibleColumns.map((c: TableColumn<TestEntity>) => c.key)
			).toEqual(["id", "name", "status", "createdAt"]);
		});

		it("should compute display columns for table", () =>
		{
			const displayColumns = component.displayedColumns();
			expect(displayColumns).toEqual([
				"id",
				"name",
				"status",
				"createdAt"
			]);
		});

		it("should add select column when selectable is true", () =>
		{
			fixture.componentRef.setInput("selectable", true);
			fixture.detectChanges();

			const displayColumns = component.displayedColumns();
			expect(displayColumns[0]).toBe("select");
		});

		it("should add actions column when rowActions provided", () =>
		{
			const actions: RowAction<TestEntity>[] = [
				{
					key: "edit",
					label: "Edit",
					icon: "edit"
				}
			];
			fixture.componentRef.setInput("rowActions", actions);
			fixture.detectChanges();

			const displayColumns = component.displayedColumns();
			expect(displayColumns[displayColumns.length - 1]).toBe("actions");
		});
	});

	describe("Search Functionality", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("searchable", true);
			fixture.detectChanges();
		});

		it("should update search signal when input changes", () =>
		{
			component.onSearchChange("test");
			expect(component.searchText()).toBe("test");
		});

		it("should emit searchChange when onSearch is called", () =>
		{
			let emittedValue: string = "";
			component.searchChange.subscribe((searchText: string) =>
			{
				emittedValue = searchText;
			});

			component.searchText.set("search term");
			component.onSearch();

			expect(emittedValue).toBe("search term");
		});

		it("should update signal and not emit on input change", () =>
		{
			let emitted: boolean = false;
			component.searchChange.subscribe(() =>
			{
				emitted = true;
			});

			component.onSearchChange("typing");
			expect(component.searchText()).toBe("typing");
			expect(emitted).toBe(false);
		});
	});

	describe("Quick Filters", () =>
	{
		const mockQuickFilters: QuickFilter<TestEntity>[] = [
			{
				key: "active",
				label: "Active",
				icon: "check_circle",
				filterFn: (item: TestEntity) => item.status === "active"
			},
			{
				key: "inactive",
				label: "Inactive",
				icon: "cancel",
				filterFn: (item: TestEntity) => item.status === "inactive"
			}
		];

		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("quickFilters", mockQuickFilters);
			fixture.detectChanges();
		});

		it("should emit filterChange event when filter toggled", (done) =>
		{
			component.filterChange.subscribe((event: FilterChangeEvent) =>
			{
				expect(event.filterKey).toBe("active");
				expect(event.active).toBe(true);
				done();
			});

			component.onFilterToggle("active");
		});

		it("should track active filters", () =>
		{
			component.onFilterToggle("active");
			expect(component.activeFilters().has("active")).toBe(true);

			component.onFilterToggle("active");
			expect(component.activeFilters().has("active")).toBe(false);
		});
	});

	describe("Row Actions", () =>
	{
		const mockRowActions: RowAction<TestEntity>[] = [
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

		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("rowActions", mockRowActions);
			fixture.detectChanges();
		});

		it("should emit rowAction event when action triggered", (done) =>
		{
			component.rowAction.subscribe(
				(event: RowActionEvent<TestEntity>) =>
				{
					expect(event.action).toBe("edit");
					expect(event.row).toBe(mockData[0]);
					done();
				}
			);

			component.onRowAction("edit", mockData[0]);
		});

		it("should emit rowClick event when row clicked", (done) =>
		{
			component.rowClick.subscribe((row: TestEntity) =>
			{
				expect(row).toBe(mockData[0]);
				done();
			});

			component.onRowClick(mockData[0]);
		});
	});

	describe("Bulk Actions", () =>
	{
		const mockBulkActions: BulkAction[] = [
			{
				key: "delete-all",
				label: "Delete Selected",
				icon: "delete",
				color: "warn",
				requiresSelection: true
			}
		];

		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("selectable", true);
			fixture.componentRef.setInput("bulkActions", mockBulkActions);
			fixture.detectChanges();
		});

		it("should emit bulkAction event when action triggered", (done) =>
		{
			component.selection.select(mockData[0]);
			component.selection.select(mockData[1]);

			component.bulkAction.subscribe(
				(event: BulkActionEvent<TestEntity>) =>
				{
					expect(event.action).toBe("delete-all");
					expect(event.selectedRows.length).toBe(2);
					expect(event.selectedIds).toEqual([1, 2]);
					done();
				}
			);

			component.onBulkAction("delete-all");
		});

		it("should compute selection state correctly", () =>
		{
			expect(component.hasSelection()).toBe(false);

			component.selection.select(mockData[0]);
			fixture.detectChanges();
			expect(component.hasSelection()).toBe(true);
		});

		it("should toggle all rows selection", () =>
		{
			component.toggleAllRows();
			fixture.detectChanges();
			expect(component.selection.selected.length).toBe(3);

			component.toggleAllRows();
			fixture.detectChanges();
			expect(component.selection.selected.length).toBe(0);
		});
	});

	describe("Pagination", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 100);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.detectChanges();
		});

		it("should emit pageChange event when page changed", (done) =>
		{
			component.pageChange.subscribe((pageIndex: number) =>
			{
				expect(pageIndex).toBe(1);
				done();
			});

			component.onPageChange({ pageIndex: 1, pageSize: 25, length: 100 });
		});

		it("should emit pageSizeChange event when page size changed", (done) =>
		{
			component.pageSizeChange.subscribe((pageSize: number) =>
			{
				expect(pageSize).toBe(50);
				done();
			});

			component.onPageChange({ pageIndex: 0, pageSize: 50, length: 100 });
		});
	});

	describe("Column Visibility", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.detectChanges();
		});

		it("should toggle column visibility", () =>
		{
			const initialVisible = component.visibleColumns().length;
			component.toggleColumn("name");
			expect(component.visibleColumns().length).toBe(initialVisible - 1);

			component.toggleColumn("name");
			expect(component.visibleColumns().length).toBe(initialVisible);
		});

		it("should load column preferences from localStorage when storageKey provided", () =>
		{
			const storageKey = "test-table-columns";
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					id: true,
					name: false,
					status: true,
					createdAt: true
				})
			);

			fixture.componentRef.setInput("storageKey", storageKey);
			fixture.detectChanges();

			const visibleKeys = component
				.visibleColumns()
				.map((c: TableColumn<TestEntity>) => c.key);
			expect(visibleKeys).not.toContain("name");

			localStorage.removeItem(storageKey);
		});
	});

	describe("Refresh Functionality", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("showRefresh", true);
			fixture.detectChanges();
		});

		it("should emit refreshClick event when refresh button clicked", (done) =>
		{
			component.refreshClick.subscribe(() =>
			{
				expect(true).toBe(true);
				done();
			});

			component.onRefresh();
		});
	});

	describe("Create Button", () =>
	{
		beforeEach(() =>
		{
			fixture.componentRef.setInput("columns", mockColumns);
			fixture.componentRef.setInput("data", mockData);
			fixture.componentRef.setInput("isLoading", false);
			fixture.componentRef.setInput("totalCount", 3);
			fixture.componentRef.setInput("pageIndex", 0);
			fixture.componentRef.setInput("pageSize", 25);
			fixture.componentRef.setInput("showCreate", true);
			fixture.detectChanges();
		});

		it("should emit createClick event when create button clicked", (done) =>
		{
			component.createClick.subscribe(() =>
			{
				expect(true).toBe(true);
				done();
			});

			component.onCreate();
		});
	});
});
