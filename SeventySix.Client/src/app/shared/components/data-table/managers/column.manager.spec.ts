import { signal, WritableSignal } from "@angular/core";
import { DisplayColumnOptions, TableColumn } from "@shared/models";
import { DataTableColumnManager } from "./column.manager";

interface TestEntity
{
	id: number;
	name: string;
	status: string;
}

/**
 * Unit tests for DataTableColumnManager.
 * Covers column visibility state and localStorage persistence.
 */
describe("DataTableColumnManager",
	() =>
	{
		let manager: DataTableColumnManager<TestEntity>;
		let columnsSignal: WritableSignal<TableColumn<TestEntity>[]>;

		const mockColumns: TableColumn<TestEntity>[] =
			[
				{
					key: "id",
					label: "ID",
					sortable: true,
					visible: true
				},
				{
					key: "name",
					label: "Name",
					sortable: true,
					visible: true
				},
				{
					key: "status",
					label: "Status",
					sortable: false,
					visible: false
				}
			];

		beforeEach(
			() =>
			{
				columnsSignal =
					signal(mockColumns);
				manager =
					new DataTableColumnManager<TestEntity>(columnsSignal);

				// Clear localStorage before each test
				localStorage.clear();
			});

		describe("initialization",
			() =>
			{
				it("should initialize with column definitions",
					() =>
					{
						const visibleColumns: TableColumn<TestEntity>[] =
							manager.visibleColumns();

						expect(visibleColumns.length)
							.toBe(2);
						expect(
							visibleColumns.map(
								(column: TableColumn<TestEntity>) =>
									column.key))
							.toEqual(
								["id", "name"]);
					});

				it("should respect initial visible property from columns",
					() =>
					{
						expect(manager.isColumnVisible("id"))
							.toBe(true);
						expect(manager.isColumnVisible("name"))
							.toBe(true);
						expect(manager.isColumnVisible("status"))
							.toBe(false);
					});
			});

		describe("visibleColumns",
			() =>
			{
				it("should compute visible columns from definitions",
					() =>
					{
						const visibleColumns: TableColumn<TestEntity>[] =
							manager.visibleColumns();

						expect(visibleColumns)
							.toHaveLength(2);
						expect(visibleColumns[0].key)
							.toBe("id");
						expect(visibleColumns[1].key)
							.toBe("name");
					});

				it("should update when column visibility changes",
					() =>
					{
						manager.toggleColumn("status");

						const visibleColumns: TableColumn<TestEntity>[] =
							manager.visibleColumns();

						expect(visibleColumns)
							.toHaveLength(3);
						expect(
							visibleColumns.map(
								(column: TableColumn<TestEntity>) =>
									column.key))
							.toContain("status");
					});
			});

		describe("getDisplayedColumns",
			() =>
			{
				it("should return visible column keys",
					() =>
					{
						const options: DisplayColumnOptions =
							{
								selectable: false,
								hasRowActions: false
							};

						const columns: string[] =
							manager.getDisplayedColumns(options);

						expect(columns)
							.toEqual(
								["id", "name"]);
					});

				it("should include select column when selectable",
					() =>
					{
						const options: DisplayColumnOptions =
							{
								selectable: true,
								hasRowActions: false
							};

						const columns: string[] =
							manager.getDisplayedColumns(options);

						expect(columns[0])
							.toBe("select");
						expect(columns)
							.toContain("id");
						expect(columns)
							.toContain("name");
					});

				it("should include actions column when rowActions provided",
					() =>
					{
						const options: DisplayColumnOptions =
							{
								selectable: false,
								hasRowActions: true
							};

						const columns: string[] =
							manager.getDisplayedColumns(options);

						expect(columns[columns.length - 1])
							.toBe("actions");
					});

				it("should include both select and actions when both enabled",
					() =>
					{
						const options: DisplayColumnOptions =
							{
								selectable: true,
								hasRowActions: true
							};

						const columns: string[] =
							manager.getDisplayedColumns(options);

						expect(columns[0])
							.toBe("select");
						expect(columns[columns.length - 1])
							.toBe("actions");
					});
			});

		describe("toggleColumn",
			() =>
			{
				it("should toggle column visibility from visible to hidden",
					() =>
					{
						expect(manager.isColumnVisible("id"))
							.toBe(true);

						manager.toggleColumn("id");

						expect(manager.isColumnVisible("id"))
							.toBe(false);
					});

				it("should toggle column visibility from hidden to visible",
					() =>
					{
						expect(manager.isColumnVisible("status"))
							.toBe(false);

						manager.toggleColumn("status");

						expect(manager.isColumnVisible("status"))
							.toBe(true);
					});

				it("should not throw for unknown column key",
					() =>
					{
						expect(
							() => manager.toggleColumn("unknown"))
							.not
							.toThrow();
					});
			});

		describe("isColumnVisible",
			() =>
			{
				it("should return true for visible columns",
					() =>
					{
						expect(manager.isColumnVisible("id"))
							.toBe(true);
					});

				it("should return false for hidden columns",
					() =>
					{
						expect(manager.isColumnVisible("status"))
							.toBe(false);
					});

				it("should return true for unknown columns (default visible)",
					() =>
					{
						expect(manager.isColumnVisible("unknown"))
							.toBe(true);
					});
			});

		describe("localStorage persistence",
			() =>
			{
				const storageKey: string = "test-table-columns";

				it("should save preferences to localStorage",
					() =>
					{
						manager.toggleColumn("status");
						manager.savePreferences(storageKey);

						const stored: string | null =
							localStorage.getItem(storageKey);

						expect(stored)
							.not
							.toBeNull();

						const parsed: Record<string, boolean> =
							JSON.parse(stored!);

						expect(parsed["status"])
							.toBe(true);
					});

				it("should load preferences from localStorage",
					() =>
					{
						const preferences: Record<string, boolean> =
							{
								id: false,
								name: true,
								status: true
							};
						localStorage.setItem(storageKey, JSON.stringify(preferences));

						manager.loadPreferences(storageKey);

						expect(manager.isColumnVisible("id"))
							.toBe(false);
						expect(manager.isColumnVisible("name"))
							.toBe(true);
						expect(manager.isColumnVisible("status"))
							.toBe(true);
					});

				it("should handle missing localStorage key gracefully",
					() =>
					{
						expect(
							() =>
								manager.loadPreferences("nonexistent-key"))
							.not
							.toThrow();

						// Should keep default visibility
						expect(manager.isColumnVisible("id"))
							.toBe(true);
					});

				it("should handle invalid JSON in localStorage gracefully",
					() =>
					{
						localStorage.setItem(storageKey, "invalid-json");

						expect(
							() =>
								manager.loadPreferences(storageKey))
							.not
							.toThrow();

						// Should keep default visibility
						expect(manager.isColumnVisible("id"))
							.toBe(true);
					});

				it("should not save when storageKey is null",
					() =>
					{
						manager.toggleColumn("status");

						// Should not throw
						expect(
							() => manager.savePreferences(null))
							.not
							.toThrow();
					});

				it("should not load when storageKey is null",
					() =>
					{
						expect(
							() => manager.loadPreferences(null))
							.not
							.toThrow();
					});
			});
	});
