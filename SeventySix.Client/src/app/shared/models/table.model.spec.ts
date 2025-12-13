import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	BulkAction,
	BulkActionEvent,
	CellValue,
	DateRangeEvent,
	FilterChangeEvent,
	QuickFilter,
	RowAction,
	RowActionEvent,
	TableColumn
} from "./table.model";

/**
 * Test entity for type validation
 */
interface TestEntity
{
	id: number;
	name: string;
	status: "active" | "inactive";
	createdAt: Date;
}

describe("Table Models", () =>
{
	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
	});

	describe("TableColumn<T>", () =>
	{
		it("should define a valid text column", () =>
		{
			const column: TableColumn<TestEntity> =
				{
					key: "name",
					label: "Name",
					sortable: true,
					visible: true,
					type: "text"
				};

			expect(column.key)
				.toBe("name");
			expect(column.label)
				.toBe("Name");
			expect(column.sortable)
				.toBe(true);
			expect(column.visible)
				.toBe(true);
			expect(column.type)
				.toBe("text");
		});

		it("should define a valid date column with formatter", () =>
		{
			const column: TableColumn<TestEntity> =
				{
					key: "createdAt",
					label: "Created",
					sortable: true,
					visible: true,
					type: "date",
					formatter: (value: CellValue) =>
						(value as Date).toLocaleDateString()
				};

			const testDate: Date =
				new Date("2024-01-01");
			expect(column.formatter?.(testDate))
				.toBe(
					testDate.toLocaleDateString());
		});

		it("should define a valid badge column with color function", () =>
		{
			const column: TableColumn<TestEntity> =
				{
					key: "status",
					label: "Status",
					sortable: false,
					visible: true,
					type: "badge",
					badgeColor: (value: CellValue, _row?: TestEntity) =>
						value === "active" ? "primary" : "warn"
				};

			expect(column.badgeColor?.("active"))
				.toBe("primary");
			expect(column.badgeColor?.("inactive"))
				.toBe("warn");
		});

		it("should support formatter with row context", () =>
		{
			const column: TableColumn<TestEntity> =
				{
					key: "name",
					label: "Display Name",
					sortable: true,
					visible: true,
					formatter: (value: CellValue, row?: TestEntity) =>
						`${value} (${row?.status})`
				};

			const testRow: TestEntity =
				{
					id: 1,
					name: "Test",
					status: "active",
					createdAt: new Date()
				};

			expect(column.formatter?.("Test", testRow))
				.toBe("Test (active)");
		});
	});

	describe("QuickFilter<T>", () =>
	{
		it("should define a valid filter with predicate", () =>
		{
			const filter: QuickFilter<TestEntity> =
				{
					key: "active",
					label: "Active",
					icon: "check_circle",
					filterFn: (item: TestEntity) =>
						item.status === "active"
				};

			const activeItem: TestEntity =
				{
					id: 1,
					name: "Active User",
					status: "active",
					createdAt: new Date()
				};
			const inactiveItem: TestEntity =
				{
					id: 2,
					name: "Inactive User",
					status: "inactive",
					createdAt: new Date()
				};

			expect(filter.filterFn)
				.toBeDefined();
			expect(filter.filterFn?.(activeItem))
				.toBe(true);
			expect(filter.filterFn?.(inactiveItem))
				.toBe(false);
		});

		it("should support filter without icon", () =>
		{
			const filter: QuickFilter<TestEntity> =
				{
					key: "all",
					label: "All",
					filterFn: () => true
				};

			expect(filter.icon)
				.toBeUndefined();
		});
	});

	describe("RowAction<T>", () =>
	{
		it("should define a basic row action", () =>
		{
			const action: RowAction<TestEntity> =
				{
					key: "edit",
					label: "Edit",
					icon: "edit",
					color: "primary"
				};

			expect(action.key)
				.toBe("edit");
			expect(action.label)
				.toBe("Edit");
			expect(action.icon)
				.toBe("edit");
			expect(action.color)
				.toBe("primary");
		});

		it("should support conditional visibility with showIf", () =>
		{
			const action: RowAction<TestEntity> =
				{
					key: "activate",
					label: "Activate",
					icon: "check",
					showIf: (row: TestEntity) =>
						row.status === "inactive"
				};

			const activeRow: TestEntity =
				{
					id: 1,
					name: "Active",
					status: "active",
					createdAt: new Date()
				};
			const inactiveRow: TestEntity =
				{
					id: 2,
					name: "Inactive",
					status: "inactive",
					createdAt: new Date()
				};

			expect(action.showIf?.(activeRow))
				.toBe(false);
			expect(action.showIf?.(inactiveRow))
				.toBe(true);
		});

		it("should support action without color", () =>
		{
			const action: RowAction<TestEntity> =
				{
					key: "view",
					label: "View",
					icon: "visibility"
				};

			expect(action.color)
				.toBeUndefined();
		});
	});

	describe("BulkAction", () =>
	{
		it("should define a basic bulk action", () =>
		{
			const action: BulkAction =
				{
					key: "delete-all",
					label: "Delete Selected",
					icon: "delete",
					color: "warn",
					requiresSelection: true
				};

			expect(action.key)
				.toBe("delete-all");
			expect(action.label)
				.toBe("Delete Selected");
			expect(action.icon)
				.toBe("delete");
			expect(action.color)
				.toBe("warn");
			expect(action.requiresSelection)
				.toBe(true);
		});

		it("should support bulk action without requiresSelection", () =>
		{
			const action: BulkAction =
				{
					key: "select-all",
					label: "Select All",
					icon: "done_all"
				};

			expect(action.requiresSelection)
				.toBeUndefined();
		});
	});

	describe("RowActionEvent<T>", () =>
	{
		it("should create a valid row action event", () =>
		{
			const testRow: TestEntity =
				{
					id: 1,
					name: "Test",
					status: "active",
					createdAt: new Date()
				};

			const event: RowActionEvent<TestEntity> =
				{
					action: "edit",
					row: testRow
				};

			expect(event.action)
				.toBe("edit");
			expect(event.row)
				.toBe(testRow);
			expect(event.row.id)
				.toBe(1);
		});
	});

	describe("BulkActionEvent<T>", () =>
	{
		it("should create a valid bulk action event", () =>
		{
			const selectedRows: TestEntity[] =
				[
					{
						id: 1,
						name: "User 1",
						status: "active",
						createdAt: new Date()
					},
					{
						id: 2,
						name: "User 2",
						status: "inactive",
						createdAt: new Date()
					}
				];

			const event: BulkActionEvent<TestEntity> =
				{
					action: "delete-all",
					selectedRows: selectedRows,
					selectedIds: [1, 2]
				};

			expect(event.action)
				.toBe("delete-all");
			expect(event.selectedRows.length)
				.toBe(2);
			expect(event.selectedIds)
				.toEqual([1, 2]);
		});
	});

	describe("FilterChangeEvent", () =>
	{
		it("should create a valid filter change event", () =>
		{
			const event: FilterChangeEvent =
				{
					filterKey: "active",
					active: true
				};

			expect(event.filterKey)
				.toBe("active");
			expect(event.active)
				.toBe(true);
		});
	});

	describe("DateRangeEvent", () =>
	{
		it("should create event with date range", () =>
		{
			const startDate: Date =
				new Date("2024-01-01");
			const endDate: Date =
				new Date("2024-12-31");

			const event: DateRangeEvent =
				{
					startDate: startDate,
					endDate: endDate,
					preset: "30d"
				};

			expect(event.startDate)
				.toBe(startDate);
			expect(event.endDate)
				.toBe(endDate);
			expect(event.preset)
				.toBe("30d");
		});

		it("should create event for 'all' preset without dates", () =>
		{
			const event: DateRangeEvent =
				{
					preset: "all"
				};

			expect(event.startDate)
				.toBeUndefined();
			expect(event.endDate)
				.toBeUndefined();
			expect(event.preset)
				.toBe("all");
		});

		it("should support all preset values", () =>
		{
			const presets: DateRangeEvent["preset"][] =
				[
					"24h",
					"7d",
					"30d",
					"all"
				];

			presets.forEach((preset) =>
			{
				const event: DateRangeEvent =
					{
						preset: preset
					};
				expect(event.preset)
					.toBe(preset);
			});
		});
	});

	describe("Type Safety", () =>
	{
		it("should enforce generic type constraints", () =>
		{
			const column: TableColumn<TestEntity> =
				{
					key: "id",
					label: "ID",
					sortable: true,
					visible: true,
					formatter: (value: CellValue, row?: TestEntity) =>
				{
					// TypeScript ensures row is TestEntity | undefined
					return row?.name ?? String(value);
				}
				};

			const testRow: TestEntity =
				{
					id: 1,
					name: "Test",
					status: "active",
					createdAt: new Date()
				};

			expect(column.formatter?.(1, testRow))
				.toBe("Test");
		});

		it("should support unknown generic for flexible usage", () =>
		{
			const genericColumn: TableColumn =
				{
					key: "data",
					label: "Data",
					sortable: false,
					visible: true
				};

			expect(genericColumn.key)
				.toBe("data");
		});
	});
});
