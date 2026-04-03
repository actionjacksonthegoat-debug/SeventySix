// <copyright file="search.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Search Service.
 * Manages furniture search interaction: distributing items, traps,
 * and remedies into furniture, and resolving search results.
 * Single Responsibility: search logic only.
 */

import { Injectable } from "@angular/core";
import { distanceXZ } from "@games/shared/utilities/math.utility";
import {
	FURNITURE_SEARCH_RADIUS,
	ROOM_COLUMNS,
	ROOM_FURNITURE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { ISLAND_ROOMS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	type FurnitureDefinition,
	type ItemType,
	RemedyType,
	type RoomDefinition,
	type SearchAttemptResult,
	SearchResult,
	SpyIdentity,
	TrapType,
	type WorldItem
} from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Contents hidden inside a single furniture piece. */
interface FurnitureContents
{
	/** Item type for Black spy (Player 1), or null. */
	blackItemType: ItemType | null;

	/** Item type for White spy (Player 2 / AI), or null. */
	whiteItemType: ItemType | null;

	/** Trap type hidden inside (shared), or null. */
	trapType: TrapType | null;

	/** Identity of the spy who placed the trap, or null for game-distributed traps. */
	trapPlacedBy: SpyIdentity | null;

	/** Remedy type hidden inside (shared), or null. */
	remedyType: RemedyType | null;

	/** Whether Black spy has searched this furniture. */
	blackSearched: boolean;

	/** Whether White spy has searched this furniture. */
	whiteSearched: boolean;
}

/**
 * Manages furniture search interaction for the Spy vs Spy game.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SearchService
{
	/** Furniture contents map: furnitureId → contents. */
	private readonly contentsMap: Map<string, FurnitureContents> =
		new Map<string, FurnitureContents>();

	/**
	 * Initialize search state by distributing items, traps, and remedies into furniture.
	 * @param items
	 * Items to distribute into furniture.
	 * @param traps
	 * Trap types to hide in furniture.
	 * @param remedies
	 * Remedy types to hide in furniture.
	 */
	initialize(
		items: ReadonlyArray<WorldItem>,
		traps: ReadonlyArray<TrapType>,
		remedies: ReadonlyArray<RemedyType>): void
	{
		this.contentsMap.clear();

		/* Initialize all furniture as empty. */
		for (const furniture of ROOM_FURNITURE)
		{
			this.contentsMap.set(
				furniture.id,
				{
					blackItemType: null,
					whiteItemType: null,
					trapType: null,
					trapPlacedBy: null,
					remedyType: null,
					blackSearched: false,
					whiteSearched: false
				});
		}

		/* Get shuffled furniture IDs for distribution. */
		const availableIds: string[] =
			ROOM_FURNITURE.map((furn) => furn.id);
		this.shuffleArray(availableIds);

		this.distributeContents(
			availableIds,
			items,
			traps,
			remedies);
	}

	/**
	 * Attempt to search the nearest furniture to position.
	 * @param positionX
	 * Spy world X position.
	 * @param positionZ
	 * Spy world Z position.
	 * @param playerRemedies
	 * Remedies the searching spy currently holds.
	 * @param searcherIdentity
	 * Identity of the searching spy (for self-trap immunity).
	 * @returns
	 * Search result, or null if no furniture nearby.
	 */
	searchNearby(
		positionX: number,
		positionZ: number,
		playerRemedies: ReadonlyArray<RemedyType>,
		searcherIdentity: SpyIdentity = SpyIdentity.Black): SearchAttemptResult | null
	{
		const nearest: FurnitureDefinition | null =
			this.findNearestFurniture(positionX, positionZ);

		if (nearest == null)
		{
			return null;
		}

		const contents: FurnitureContents | undefined =
			this.contentsMap.get(nearest.id);

		if (contents == null)
		{
			return {
				result: SearchResult.Empty,
				furnitureId: nearest.id
			};
		}

		const alreadySearched: boolean =
			searcherIdentity === SpyIdentity.Black
				? contents.blackSearched
				: contents.whiteSearched;

		if (alreadySearched)
		{
			return {
				result: SearchResult.Empty,
				furnitureId: nearest.id
			};
		}

		const result: SearchAttemptResult =
			this.resolveSearchContents(
				contents,
				nearest.id,
				playerRemedies,
				searcherIdentity);

		/* Only mark as searched when the spy wasn't stopped by a trap
		   or when a remedy auto-defused a trap (spy must return to find item). */
		if (
			result.result !== SearchResult.FoundTrap
				&& result.wasDefusal !== true)
		{
			if (searcherIdentity === SpyIdentity.Black)
			{
				contents.blackSearched = true;
			}
			else
			{
				contents.whiteSearched = true;
			}
		}

		return result;
	}

	/**
	 * Check if a furniture piece has been searched.
	 * @param furnitureId
	 * The furniture ID to check.
	 * @returns
	 * True if the furniture has been searched.
	 */
	isSearched(
		furnitureId: string,
		identity: SpyIdentity = SpyIdentity.Black): boolean
	{
		const contents: FurnitureContents | undefined =
			this.contentsMap.get(furnitureId);

		if (contents == null)
		{
			return false;
		}

		return identity === SpyIdentity.Black
			? contents.blackSearched
			: contents.whiteSearched;
	}

	/**
	 * Place a trap into the nearest furniture.
	 * Re-sets 'searched' to false so the trap can trigger on next search.
	 * @param positionX
	 * World X position of the spy placing the trap.
	 * @param positionZ
	 * World Z position of the spy placing the trap.
	 * @param trapType
	 * The type of trap to place.
	 * @param placerIdentity
	 * Identity of the spy placing the trap.
	 * @returns
	 * True if the trap was successfully placed.
	 */
	placeTrapInFurniture(
		positionX: number,
		positionZ: number,
		trapType: TrapType,
		placerIdentity: SpyIdentity): boolean
	{
		const nearest: FurnitureDefinition | null =
			this.findNearestFurniture(positionX, positionZ);

		if (nearest == null)
		{
			return false;
		}

		const contents: FurnitureContents | undefined =
			this.contentsMap.get(nearest.id);

		if (contents == null)
		{
			return false;
		}

		/* Cannot overwrite an existing trap. */
		if (contents.trapType != null)
		{
			return false;
		}

		contents.trapType = trapType;
		contents.trapPlacedBy = placerIdentity;
		contents.blackSearched = false;
		contents.whiteSearched = false;

		return true;
	}

	/**
	 * Get all furniture IDs that have not yet been searched by the given identity.
	 * @param identity
	 * The spy identity to check searched state for.
	 * @returns
	 * Array of unsearched furniture IDs for the given identity.
	 */
	getUnsearched(identity: SpyIdentity = SpyIdentity.Black): ReadonlyArray<string>
	{
		const unsearched: string[] = [];

		for (const [furnitureId, contents] of this.contentsMap)
		{
			const alreadySearched: boolean =
				identity === SpyIdentity.Black
					? contents.blackSearched
					: contents.whiteSearched;

			if (!alreadySearched)
			{
				unsearched.push(furnitureId);
			}
		}

		return unsearched;
	}

	/**
	 * Redistributes a dropped item back into a random furniture piece.
	 * Marks the receiving furniture as unsearched for the given identity
	 * so the spy can find it again.
	 * @param itemType
	 * The item type to place back into furniture.
	 * @param identity
	 * The spy identity whose item slot should be populated.
	 */
	redistributeItem(
		itemType: ItemType,
		identity: SpyIdentity): void
	{
		const field: "blackItemType" | "whiteItemType" =
			identity === SpyIdentity.Black
				? "blackItemType"
				: "whiteItemType";

		/* Build list of furniture that does NOT already hold an item for this identity. */
		const candidates: string[] = [];

		for (const [furnitureId, contents] of this.contentsMap)
		{
			if (contents[field] == null)
			{
				candidates.push(furnitureId);
			}
		}

		if (candidates.length === 0)
		{
			return;
		}

		const targetId: string =
			candidates[Math.floor(Math.random() * candidates.length)]!;
		const contents: FurnitureContents | undefined =
			this.contentsMap.get(targetId);

		if (contents != null)
		{
			contents[field] = itemType;

			/* Mark unsearched so the spy can discover the item again. */
			if (identity === SpyIdentity.Black)
			{
				contents.blackSearched = false;
			}
			else
			{
				contents.whiteSearched = false;
			}
		}
	}

	/**
	 * Reset search state and redistribute contents.
	 * @param items
	 * Items to distribute.
	 * @param traps
	 * Trap types to hide.
	 * @param remedies
	 * Remedy types to hide.
	 */
	reset(
		items: ReadonlyArray<WorldItem>,
		traps: ReadonlyArray<TrapType>,
		remedies: ReadonlyArray<RemedyType>): void
	{
		this.initialize(items, traps, remedies);
	}

	/**
	 * Dispose and clear state.
	 */
	dispose(): void
	{
		this.contentsMap.clear();
	}

	/**
	 * Find the nearest furniture within search radius.
	 * @param positionX
	 * World X position.
	 * @param positionZ
	 * World Z position.
	 * @returns
	 * Nearest furniture definition, or null if none in range.
	 */
	private findNearestFurniture(
		positionX: number,
		positionZ: number): FurnitureDefinition | null
	{
		let nearest: FurnitureDefinition | null = null;
		let nearestDist: number =
			FURNITURE_SEARCH_RADIUS;

		for (const furniture of ROOM_FURNITURE)
		{
			const room: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === furniture.roomId);

			if (room == null)
			{
				continue;
			}

			const furnX: number =
				room.centerX + furniture.offsetX;
			const furnZ: number =
				room.centerZ + furniture.offsetZ;
			const dist: number =
				distanceXZ(positionX, positionZ, furnX, furnZ);

			if (dist < nearestDist)
			{
				nearestDist = dist;
				nearest = furniture;
			}
		}

		return nearest;
	}

	/**
	 * Check if a remedy matches a trap type.
	 * @param remedy
	 * The remedy type.
	 * @param trap
	 * The trap type.
	 * @returns
	 * True if the remedy defuses the trap.
	 */
	private remedyMatchesTrap(
		remedy: RemedyType,
		trap: TrapType): boolean
	{
		return (remedy === RemedyType.WireCutters && trap === TrapType.Bomb)
			|| (remedy === RemedyType.Shield && trap === TrapType.SpringTrap);
	}

	/**
	 * Fisher-Yates shuffle for an array (in-place).
	 * @param array
	 * Array to shuffle.
	 */
	private shuffleArray<T>(array: T[]): void
	{
		for (let idx: number =
			array.length - 1; idx > 0; idx--)
		{
			const randomIndex: number =
				Math.floor(Math.random() * (idx + 1));
			const temp: T =
				array[idx];
			array[idx] =
				array[randomIndex];
			array[randomIndex] = temp;
		}
	}

	/**
	 * Distributes items (per-identity), traps, and remedies into shuffled furniture slots.
	 * Items are independently distributed for each spy identity.
	 * Traps and remedies are shared across both identities.
	 * @param availableIds
	 * Shuffled furniture IDs for shared content assignment.
	 * @param items
	 * World items to place (distributed independently per identity).
	 * @param traps
	 * Trap types to hide (shared).
	 * @param remedies
	 * Remedy types to hide (shared).
	 */
	private distributeContents(
		availableIds: ReadonlyArray<string>,
		items: ReadonlyArray<WorldItem>,
		traps: ReadonlyArray<TrapType>,
		remedies: ReadonlyArray<RemedyType>): void
	{
		/* Distribute items independently per identity using separate shuffles. */
		this.distributeItemsForIdentity(
			items,
			"blackItemType");
		this.distributeItemsForIdentity(
			items,
			"whiteItemType");

		/* Distribute shared traps and remedies. */
		const sharedEntries: Array<[string, TrapType | RemedyType]> =
			[
				...traps.map(
					(trap): [string, TrapType] =>
						["trapType", trap]),
				...remedies.map(
					(remedy): [string, RemedyType] =>
						["remedyType", remedy])
			];

		for (let idx: number = 0; idx < sharedEntries.length && idx < availableIds.length; idx++)
		{
			const contents: FurnitureContents | undefined =
				this.contentsMap.get(availableIds[idx]!);

			if (contents != null)
			{
				Object.assign(
					contents,
					{ [sharedEntries[idx]![0]]: sharedEntries[idx]![1] });
			}
		}
	}

	/**
	 * Distributes items for a single identity into independently shuffled furniture slots.
	 * Enforces a column-spread constraint: items must span at least 2 of the 3
	 * map columns to prevent clustering in one area.
	 * @param items
	 * World items to distribute.
	 * @param fieldName
	 * The FurnitureContents field name to assign item types to.
	 */
	private distributeItemsForIdentity(
		items: ReadonlyArray<WorldItem>,
		fieldName: "blackItemType" | "whiteItemType"): void
	{
		const furnitureIds: string[] =
			ROOM_FURNITURE.map((furn) => furn.id);
		this.shuffleArray(furnitureIds);

		/* Enforce column-spread constraint: if all selected items fall in a
		   single column, swap one item slot with a furniture from another column. */
		const itemSlotCount: number =
			Math.min(items.length, furnitureIds.length);

		if (itemSlotCount > 1)
		{
			this.enforceColumnSpread(furnitureIds, itemSlotCount);
		}

		for (let idx: number = 0; idx < itemSlotCount; idx++)
		{
			const contents: FurnitureContents | undefined =
				this.contentsMap.get(furnitureIds[idx]!);

			if (contents != null)
			{
				contents[fieldName] =
					items[idx]!.type;
			}
		}
	}

	/**
	 * Ensures the first `slotCount` furniture IDs in the array span at least
	 * 2 distinct room columns. If all slots are in the same column, swaps
	 * one slot with a furniture from a different column found later in the array.
	 * @param furnitureIds
	 * Shuffled furniture ID array (modified in-place).
	 * @param slotCount
	 * Number of leading slots to check for column spread.
	 */
	private enforceColumnSpread(
		furnitureIds: string[],
		slotCount: number): void
	{
		const slotColumns: Set<number> =
			new Set<number>();

		for (let idx: number = 0; idx < slotCount; idx++)
		{
			const column: number =
				this.getColumnForFurniture(furnitureIds[idx]!);
			slotColumns.add(column);
		}

		/* Already spans 2+ columns — no swap needed. */
		if (slotColumns.size >= 2)
		{
			return;
		}

		/* All items in one column — find a furniture from a different column
		   in the remaining (non-slot) positions and swap with slot 0. */
		const singleColumn: number =
			slotColumns
				.values()
				.next()
				.value!;

		for (let swapIdx: number = slotCount; swapIdx < furnitureIds.length; swapIdx++)
		{
			const candidateColumn: number =
				this.getColumnForFurniture(furnitureIds[swapIdx]!);

			if (candidateColumn !== singleColumn)
			{
				/* Swap slot 0 with the different-column furniture. */
				const temp: string =
					furnitureIds[0]!;
				furnitureIds[0] =
					furnitureIds[swapIdx]!;
				furnitureIds[swapIdx] = temp;
				return;
			}
		}
	}

	/**
	 * Determines which column index (0=left, 1=center, 2=right) a furniture
	 * piece belongs to based on its room's position in ROOM_COLUMNS.
	 * @param furnitureId
	 * The furniture identifier.
	 * @returns
	 * Column index, or -1 if the furniture is not found.
	 */
	private getColumnForFurniture(furnitureId: string): number
	{
		const furniture: FurnitureDefinition | undefined =
			ROOM_FURNITURE.find(
				(furn) => furn.id === furnitureId);

		if (furniture == null)
		{
			return -1;
		}

		for (let colIdx: number = 0; colIdx < ROOM_COLUMNS.length; colIdx++)
		{
			if (ROOM_COLUMNS[colIdx]!.includes(furniture.roomId))
			{
				return colIdx;
			}
		}

		return -1;
	}

	/**
	 * Resolves search result from furniture contents.
	 * Checks for traps, items, and remedies in priority order.
	 * Self-placed traps are skipped (immunity).
	 * @param contents
	 * The furniture contents to examine.
	 * @param furnitureId
	 * The furniture identifier.
	 * @param playerRemedies
	 * Remedies the searching spy holds.
	 * @param searcherIdentity
	 * Identity of the searching spy (for self-trap immunity).
	 * @returns
	 * The search attempt result.
	 */
	private resolveSearchContents(
		contents: FurnitureContents,
		furnitureId: string,
		playerRemedies: ReadonlyArray<RemedyType>,
		searcherIdentity: SpyIdentity): SearchAttemptResult
	{
		/* Check for trap — skip if the searcher placed it (self-immunity). */
		if (
			contents.trapType != null
				&& contents.trapPlacedBy !== searcherIdentity)
		{
			return this.resolveTrapSearch(
				contents,
				furnitureId,
				playerRemedies);
		}

		/* Check items for the searching spy's identity. */
		const itemField: "blackItemType" | "whiteItemType" =
			searcherIdentity === SpyIdentity.Black
				? "blackItemType"
				: "whiteItemType";

		if (contents[itemField] != null)
		{
			const foundItem: ItemType =
				contents[itemField];
			contents[itemField] = null;

			return {
				result: SearchResult.FoundItem,
				itemType: foundItem,
				furnitureId
			};
		}

		if (contents.remedyType != null)
		{
			const foundRemedy: RemedyType =
				contents.remedyType;
			contents.remedyType = null;

			return {
				result: SearchResult.FoundRemedy,
				remedyType: foundRemedy,
				furnitureId
			};
		}

		return {
			result: SearchResult.Empty,
			furnitureId
		};
	}

	/**
	 * Resolves a trap encounter during furniture search.
	 * Checks if player has a matching remedy to defuse the trap.
	 * @param contents
	 * The furniture contents with a trap.
	 * @param furnitureId
	 * The furniture identifier.
	 * @param playerRemedies
	 * Remedies the searching spy holds.
	 * @returns
	 * Trap or remedy search result.
	 */
	private resolveTrapSearch(
		contents: FurnitureContents,
		furnitureId: string,
		playerRemedies: ReadonlyArray<RemedyType>): SearchAttemptResult
	{
		const matchingRemedy: RemedyType | undefined =
			playerRemedies.find(
				(remedy) =>
					this.remedyMatchesTrap(remedy, contents.trapType!));

		if (matchingRemedy != null)
		{
			contents.trapType = null;

			return {
				result: SearchResult.FoundRemedy,
				remedyType: matchingRemedy,
				wasDefusal: true,
				furnitureId
			};
		}

		const trapType: TrapType =
			contents.trapType!;
		const placedBy: SpyIdentity | undefined =
			contents.trapPlacedBy ?? undefined;

		/* Trap detonates — clear it so the spy can search again for items. */
		contents.trapType = null;
		contents.trapPlacedBy = null;

		return {
			result: SearchResult.FoundTrap,
			trapType,
			trapPlacedBy: placedBy,
			furnitureId
		};
	}
}