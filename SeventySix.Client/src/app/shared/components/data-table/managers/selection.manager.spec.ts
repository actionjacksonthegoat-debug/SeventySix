import { SelectionModel } from "@angular/cdk/collections";
import { DataTableSelectionManager } from "./selection.manager";

interface TestEntity
{
	id: number;
	name: string;
}

/**
 * Unit tests for DataTableSelectionManager.
 * Covers selection state management and bulk operations.
 */
describe("DataTableSelectionManager",
	() =>
	{
		let manager: DataTableSelectionManager<TestEntity>;

		const mockData: TestEntity[] =
			[
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
				{ id: 3, name: "Item 3" }
			];

		beforeEach(
			() =>
			{
				manager =
					new DataTableSelectionManager<TestEntity>();
			});

		describe("initialization",
			() =>
			{
				it("should initialize with empty selection",
					() =>
					{
						expect(manager.selected())
							.toEqual([]);
						expect(manager.hasSelection())
							.toBe(false);
						expect(manager.selectedCount())
							.toBe(0);
					});

				it("should expose underlying SelectionModel",
					() =>
					{
						expect(manager.selection)
							.toBeInstanceOf(SelectionModel);
					});
			});

		describe("selection tracking",
			() =>
			{
				it("should track selection changes via signal",
					() =>
					{
						manager.selection.select(mockData[0]);

						expect(manager.selected())
							.toEqual(
								[mockData[0]]);
						expect(manager.hasSelection())
							.toBe(true);
						expect(manager.selectedCount())
							.toBe(1);
					});

				it("should support multi-select",
					() =>
					{
						manager.selection.select(mockData[0], mockData[1]);

						expect(manager.selectedCount())
							.toBe(2);
						expect(manager.selected())
							.toContain(mockData[0]);
						expect(manager.selected())
							.toContain(mockData[1]);
					});

				it("should update hasSelection when items deselected",
					() =>
					{
						manager.selection.select(mockData[0]);
						expect(manager.hasSelection())
							.toBe(true);

						manager.selection.deselect(mockData[0]);
						expect(manager.hasSelection())
							.toBe(false);
					});
			});

		describe("toggleAll",
			() =>
			{
				it("should select all rows when none selected",
					() =>
					{
						manager.toggleAll(mockData);

						expect(manager.selectedCount())
							.toBe(3);
						expect(manager.selected())
							.toEqual(mockData);
					});

				it("should clear all rows when all selected",
					() =>
					{
						manager.selection.select(...mockData);
						expect(manager.selectedCount())
							.toBe(3);

						manager.toggleAll(mockData);

						expect(manager.selectedCount())
							.toBe(0);
						expect(manager.hasSelection())
							.toBe(false);
					});

				it("should select all when partially selected",
					() =>
					{
						manager.selection.select(mockData[0]);
						expect(manager.selectedCount())
							.toBe(1);

						manager.toggleAll(mockData);

						expect(manager.selectedCount())
							.toBe(3);
					});
			});

		describe("isAllSelected",
			() =>
			{
				it("should return false when no rows selected",
					() =>
					{
						expect(manager.isAllSelected(mockData.length))
							.toBe(false);
					});

				it("should return false when partially selected",
					() =>
					{
						manager.selection.select(mockData[0]);

						expect(manager.isAllSelected(mockData.length))
							.toBe(false);
					});

				it("should return true when all rows selected",
					() =>
					{
						manager.selection.select(...mockData);

						expect(manager.isAllSelected(mockData.length))
							.toBe(true);
					});

				it("should return false when data is empty",
					() =>
					{
						expect(manager.isAllSelected(0))
							.toBe(false);
					});
			});

		describe("clear",
			() =>
			{
				it("should clear all selections",
					() =>
					{
						manager.selection.select(...mockData);
						expect(manager.selectedCount())
							.toBe(3);

						manager.clear();

						expect(manager.selectedCount())
							.toBe(0);
						expect(manager.hasSelection())
							.toBe(false);
						expect(manager.selected())
							.toEqual([]);
					});

				it("should be safe to call when already empty",
					() =>
					{
						expect(
							() => manager.clear())
							.not
							.toThrow();
						expect(manager.selectedCount())
							.toBe(0);
					});
			});
	});
