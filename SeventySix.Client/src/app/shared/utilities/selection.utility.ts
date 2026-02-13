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
