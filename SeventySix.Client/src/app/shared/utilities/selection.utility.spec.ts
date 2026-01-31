import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	toggleArrayItem,
	toggleSetItem
} from "./selection.utility";

describe("Selection Utilities",
	() =>
	{
		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [provideZonelessChangeDetection()]
					});
			});

		describe("toggleSetItem",
			() =>
			{
				it("should add item when not present in Set",
					() =>
					{
						const originalSet: Set<number> =
							new Set(
								[
									1,
									2,
									3
								]);

						const result: Set<number> =
							toggleSetItem(
								originalSet,
								4);

						expect(result.has(4))
							.toBe(true);
						expect(result.size)
							.toBe(4);
					});

				it("should remove item when already present in Set",
					() =>
					{
						const originalSet: Set<number> =
							new Set(
								[
									1,
									2,
									3
								]);

						const result: Set<number> =
							toggleSetItem(
								originalSet,
								2);

						expect(result.has(2))
							.toBe(false);
						expect(result.size)
							.toBe(2);
					});

				it("should return new Set instance (immutability)",
					() =>
					{
						const originalSet: Set<number> =
							new Set(
								[
									1,
									2,
									3
								]);

						const result: Set<number> =
							toggleSetItem(
								originalSet,
								4);

						expect(result)
							.not
							.toBe(originalSet);
						expect(originalSet.has(4))
							.toBe(false);
					});

				it("should work with empty Set",
					() =>
					{
						const emptySet: Set<string> =
							new Set();

						const result: Set<string> =
							toggleSetItem(
								emptySet,
								"test");

						expect(result.has("test"))
							.toBe(true);
						expect(result.size)
							.toBe(1);
					});

				it("should work with string items",
					() =>
					{
						const stringSet: Set<string> =
							new Set(
								[
									"apple",
									"banana"
								]);

						const addResult: Set<string> =
							toggleSetItem(
								stringSet,
								"cherry");

						expect(addResult.has("cherry"))
							.toBe(true);

						const removeResult: Set<string> =
							toggleSetItem(
								stringSet,
								"apple");

						expect(removeResult.has("apple"))
							.toBe(false);
					});
			});

		describe("toggleArrayItem",
			() =>
			{
				it("should add item when not present in array",
					() =>
					{
						const originalArray: readonly number[] =
							[
								1,
								2,
								3
							];

						const result: number[] =
							toggleArrayItem(
								originalArray,
								4);

						expect(result)
							.toContain(4);
						expect(result.length)
							.toBe(4);
					});

				it("should remove item when already present in array",
					() =>
					{
						const originalArray: readonly number[] =
							[
								1,
								2,
								3
							];

						const result: number[] =
							toggleArrayItem(
								originalArray,
								2);

						expect(result)
							.not
							.toContain(2);
						expect(result.length)
							.toBe(2);
					});

				it("should return new array instance (immutability)",
					() =>
					{
						const originalArray: number[] =
							[
								1,
								2,
								3
							];

						const result: number[] =
							toggleArrayItem(
								originalArray,
								4);

						expect(result)
							.not
							.toBe(originalArray);
						expect(originalArray)
							.not
							.toContain(4);
					});

				it("should work with empty array",
					() =>
					{
						const emptyArray: readonly string[] = [];

						const result: string[] =
							toggleArrayItem(
								emptyArray,
								"test");

						expect(result)
							.toContain("test");
						expect(result.length)
							.toBe(1);
					});

				it("should use custom comparator correctly",
					() =>
					{
						interface TestItem
						{
							id: number;
							name: string;
						}

						const items: readonly TestItem[] =
							[
								{
									id: 1,
									name: "Alice"
								},
								{
									id: 2,
									name: "Bob"
								}
							];

						const itemToToggle: TestItem =
							{
								id: 2,
								name: "Bob Updated"
							};

						const comparator: (existingItem: TestItem, targetItem: TestItem) => boolean =
							(
								existingItem: TestItem,
								targetItem: TestItem): boolean =>
								existingItem.id === targetItem.id;

						const result: TestItem[] =
							toggleArrayItem(
								items,
								itemToToggle,
								comparator);

						expect(result.length)
							.toBe(1);
						expect(result[0].id)
							.toBe(1);
					});

				it("should add item with custom comparator when not found",
					() =>
					{
						interface TestItem
						{
							id: number;
							name: string;
						}

						const items: readonly TestItem[] =
							[
								{
									id: 1,
									name: "Alice"
								}
							];

						const newItem: TestItem =
							{
								id: 3,
								name: "Charlie"
							};

						const comparator: (existingItem: TestItem, targetItem: TestItem) => boolean =
							(
								existingItem: TestItem,
								targetItem: TestItem): boolean =>
								existingItem.id === targetItem.id;

						const result: TestItem[] =
							toggleArrayItem(
								items,
								newItem,
								comparator);

						expect(result.length)
							.toBe(2);
						expect(result[1].id)
							.toBe(3);
					});

				it("should preserve array order when removing item",
					() =>
					{
						const originalArray: readonly number[] =
							[
								1,
								2,
								3,
								4,
								5
							];

						const result: number[] =
							toggleArrayItem(
								originalArray,
								3);

						expect(result)
							.toEqual(
								[
									1,
									2,
									4,
									5
								]);
					});
			});
	});
