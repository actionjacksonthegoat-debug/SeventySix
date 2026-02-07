/**
 * Toggles an item in a Set, returning a new Set (immutable).
 *
 * @param {Set<T>} currentSet
 * The original Set.
 *
 * @param {T} targetItem
 * The item to toggle.
 *
 * @returns {Set<T>}
 * A new Set with the item toggled.
 *
 * @example
 * ```typescript
 * const selectedIds: Set<number> = new Set([1, 2, 3]);
 * const updated: Set<number> = toggleSetItem(selectedIds, 2);
 * // updated contains [1, 3] - item 2 was removed
 *
 * const added: Set<number> = toggleSetItem(selectedIds, 4);
 * // added contains [1, 2, 3, 4] - item 4 was added
 * ```
 */
export function toggleSetItem<T>(
	currentSet: Set<T>,
	targetItem: T): Set<T>
{
	const updatedSet: Set<T> =
		new Set(currentSet);

	if (updatedSet.has(targetItem))
	{
		updatedSet.delete(targetItem);
	}
	else
	{
		updatedSet.add(targetItem);
	}

	return updatedSet;
}

/**
 * Toggles an item in an array, returning a new array (immutable).
 *
 * @param {readonly T[]} sourceArray
 * The original array.
 *
 * @param {T} targetItem
 * The item to toggle.
 *
 * @param {(existingItem: T, itemToFind: T) => boolean} comparator
 * Optional comparator function. Defaults to strict equality.
 *
 * @returns {T[]}
 * A new array with the item toggled.
 *
 * @example
 * ```typescript
 * // Simple array toggle
 * const numbers: number[] = [1, 2, 3];
 * const toggled: number[] = toggleArrayItem(numbers, 2);
 * // toggled is [1, 3]
 *
 * // Object array with custom comparator
 * interface User { id: number; name: string; }
 * const users: User[] = [{ id: 1, name: "Alice" }];
 * const result: User[] = toggleArrayItem(
 *     users,
 *     { id: 1, name: "Alice" },
 *     (existing, target) => existing.id === target.id
 * );
 * // result is [] - user was removed by id match
 * ```
 */
export function toggleArrayItem<T>(
	sourceArray: readonly T[],
	targetItem: T,
	comparator: (existingItem: T, itemToFind: T) => boolean = (existingItem, itemToFind): boolean =>
		existingItem === itemToFind): T[]
{
	const existingIndex: number =
		sourceArray.findIndex(
			(existingItem): boolean =>
				comparator(
					existingItem,
					targetItem));

	if (existingIndex >= 0)
	{
		return [
			...sourceArray.slice(
				0,
				existingIndex),
			...sourceArray.slice(existingIndex + 1)
		];
	}

	return [
		...sourceArray,
		targetItem
	];
}
