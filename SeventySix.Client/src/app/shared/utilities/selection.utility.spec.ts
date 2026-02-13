import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { toggleSetItem } from "./selection.utility";

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
	});
