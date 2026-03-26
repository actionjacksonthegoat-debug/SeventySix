/**
 * Search Service unit tests.
 * Tests furniture search, item/trap/remedy distribution, and defusal mechanics.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	FURNITURE_SEARCH_RADIUS,
	ISLAND_ROOMS,
	ROOM_COLUMNS,
	ROOM_FURNITURE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	type FurnitureDefinition,
	ItemType,
	RemedyType,
	type RoomDefinition,
	type SearchAttemptResult,
	SearchResult,
	SpyIdentity,
	TrapType,
	type WorldItem
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SearchService } from "./search.service";

/** Build a minimal WorldItem for testing. */
function buildWorldItem(
	type: ItemType,
	instanceId: string): WorldItem
{
	return {
		instanceId,
		type,
		roomId: ROOM_FURNITURE[0].roomId,
		positionX: 0,
		positionZ: 0,
		collected: false,
		collectedBy: undefined,
		furnitureId: null
	};
}

/**
 * Compute world position for a furniture piece.
 * @param furnitureIndex
 * Index into ROOM_FURNITURE.
 * @returns
 * World coordinates.
 */
function furnitureWorldPosition(furnitureIndex: number): { x: number; z: number; }
{
	const furniture: (typeof ROOM_FURNITURE)[number] =
		ROOM_FURNITURE[furnitureIndex];
	const room: RoomDefinition | undefined =
		ISLAND_ROOMS.find(
			(room) => room.id === furniture.roomId);

	if (room == null)
	{
		throw new Error(`Room not found for furniture ${furniture.id}`);
	}

	return {
		x: room.centerX + furniture.offsetX,
		z: room.centerZ + furniture.offsetZ
	};
}

describe("SearchService",
	() =>
	{
		let service: SearchService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SearchService
						]
					});

				service =
					TestBed.inject(SearchService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("initialization",
			() =>
			{
				it("should initialize with empty state",
					() =>
					{
						service.initialize([], [], []);

						const unsearched: ReadonlyArray<string> =
							service.getUnsearched();

						expect(unsearched.length)
							.toBe(ROOM_FURNITURE.length);
					});

				it("should mark all furniture as unsearched after init",
					() =>
					{
						service.initialize([], [], []);

						for (const furniture of ROOM_FURNITURE)
						{
							expect(service.isSearched(furniture.id))
								.toBe(false);
						}
					});
			});

		describe("searchNearby",
			() =>
			{
				it("should return null when no furniture is nearby",
					() =>
					{
						service.initialize([], [], []);

						const result: SearchAttemptResult | null =
							service.searchNearby(9999, 9999, []);

						expect(result)
							.toBeNull();
					});

				it("should return FoundItem when furniture has item",
					() =>
					{
						const items: WorldItem[] =
							[buildWorldItem(ItemType.SecretDocuments, "doc-1")];

						service.initialize(items, [], []);

						let foundItem: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, []);

							if (result != null && result.result === SearchResult.FoundItem)
							{
								expect(result.itemType)
									.toBe(ItemType.SecretDocuments);
								foundItem = true;
								break;
							}
						}

						expect(foundItem)
							.toBe(true);
					});

				it("should return FoundTrap when furniture has trap",
					() =>
					{
						const traps: TrapType[] =
							[TrapType.Bomb];

						service.initialize([], traps, []);

						let foundTrap: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, []);

							if (result != null && result.result === SearchResult.FoundTrap)
							{
								expect(result.trapType)
									.toBe(TrapType.Bomb);
								foundTrap = true;
								break;
							}
						}

						expect(foundTrap)
							.toBe(true);
					});

				it("should allow re-search after trap detonates to find item behind it",
					() =>
					{
						const items: ItemType[] =
							[ItemType.KeyCard];
						const traps: TrapType[] =
							[TrapType.Bomb];

						service.initialize(items, traps, []);

						/* Find the furniture with the trap. */
						let trapPos: { x: number; z: number; } | null = null;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, []);

							if (result != null && result.result === SearchResult.FoundTrap)
							{
								trapPos = pos;
								break;
							}
						}

						expect(trapPos)
							.not
							.toBeNull();

						/* Second search at the same position should not return trap again. */
						const secondResult: SearchAttemptResult | null =
							service.searchNearby(trapPos!.x, trapPos!.z, []);

						expect(secondResult)
							.not
							.toBeNull();
						expect(secondResult!.result)
							.not
							.toBe(SearchResult.FoundTrap);
					});

				it("should return FoundRemedy when furniture has remedy",
					() =>
					{
						const remedies: RemedyType[] =
							[RemedyType.WireCutters];

						service.initialize([], [], remedies);

						let foundRemedy: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, []);

							if (result != null && result.result === SearchResult.FoundRemedy)
							{
								expect(result.remedyType)
									.toBe(RemedyType.WireCutters);
								foundRemedy = true;
								break;
							}
						}

						expect(foundRemedy)
							.toBe(true);
					});

				it("should return Empty for already-searched furniture",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						/* First search. */
						service.searchNearby(pos.x, pos.z, []);

						/* Second search returns Empty since already searched. */
						const result: SearchAttemptResult | null =
							service.searchNearby(pos.x, pos.z, []);

						expect(result)
							.not
							.toBeNull();
						expect(result!.result)
							.toBe(SearchResult.Empty);
					});
			});

		describe("remedy defusal",
			() =>
			{
				it("should defuse matching trap with WireCutters for Bomb",
					() =>
					{
						const traps: TrapType[] =
							[TrapType.Bomb];
						const playerRemedies: RemedyType[] =
							[RemedyType.WireCutters];

						service.initialize([], traps, []);

						let defused: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, playerRemedies);

							if (result != null && result.result === SearchResult.FoundRemedy)
							{
								defused = true;
								break;
							}
						}

						expect(defused)
							.toBe(true);
					});

				it("should defuse matching trap with Shield for SpringTrap",
					() =>
					{
						const traps: TrapType[] =
							[TrapType.SpringTrap];
						const playerRemedies: RemedyType[] =
							[RemedyType.Shield];

						service.initialize([], traps, []);

						let defused: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, playerRemedies);

							if (result != null && result.result === SearchResult.FoundRemedy)
							{
								defused = true;
								break;
							}
						}

						expect(defused)
							.toBe(true);
					});

				it("should NOT defuse trap when remedy does not match",
					() =>
					{
						const traps: TrapType[] =
							[TrapType.Bomb];
						const playerRemedies: RemedyType[] =
							[RemedyType.Shield];

						service.initialize([], traps, []);

						let hitTrap: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, playerRemedies);

							if (result != null && result.result === SearchResult.FoundTrap)
							{
								hitTrap = true;
								break;
							}
						}

						expect(hitTrap)
							.toBe(true);
					});
			});

		describe("isSearched",
			() =>
			{
				it("should return true after searching furniture",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						service.searchNearby(pos.x, pos.z, []);

						expect(service.isSearched(ROOM_FURNITURE[0].id))
							.toBe(true);
					});

				it("should return false for unknown furniture id",
					() =>
					{
						service.initialize([], [], []);

						expect(service.isSearched("nonexistent-furniture"))
							.toBe(false);
					});
			});

		describe("getUnsearched",
			() =>
			{
				it("should return all furniture initially",
					() =>
					{
						service.initialize([], [], []);

						const unsearched: ReadonlyArray<string> =
							service.getUnsearched();

						expect(unsearched.length)
							.toBe(ROOM_FURNITURE.length);
					});

				it("should decrease count after searching",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						service.searchNearby(pos.x, pos.z, []);

						const unsearched: ReadonlyArray<string> =
							service.getUnsearched();

						expect(unsearched.length)
							.toBe(ROOM_FURNITURE.length - 1);
					});
			});

		describe("reset",
			() =>
			{
				it("should re-distribute contents after reset",
					() =>
					{
						const items: WorldItem[] =
							[buildWorldItem(ItemType.Passport, "pass-1")];

						service.initialize(items, [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);
						service.searchNearby(pos.x, pos.z, []);

						service.reset(items, [], []);

						const unsearched: ReadonlyArray<string> =
							service.getUnsearched();

						expect(unsearched.length)
							.toBe(ROOM_FURNITURE.length);
					});
			});

		describe("dispose",
			() =>
			{
				it("should clear all state",
					() =>
					{
						service.initialize([], [], []);
						service.dispose();

						const unsearched: ReadonlyArray<string> =
							service.getUnsearched();

						expect(unsearched.length)
							.toBe(0);
					});

				it("should not throw when called before initialize",
					() =>
					{
						expect(
							() => service.dispose())
							.not
							.toThrow();
					});
			});

		describe("search radius",
			() =>
			{
				it("should not find furniture beyond search radius",
					() =>
					{
						service.initialize([], [], []);

						const result: SearchAttemptResult | null =
							service.searchNearby(500, 500, []);

						expect(result)
							.toBeNull();
					});

				it("should find furniture within search radius",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						const result: SearchAttemptResult | null =
							service.searchNearby(
								pos.x + FURNITURE_SEARCH_RADIUS * 0.5,
								pos.z,
								[]);

						expect(result)
							.not
							.toBeNull();
					});
			});

		describe("placeTrapInFurniture",
			() =>
			{
				it("should return false when no furniture is nearby",
					() =>
					{
						service.initialize([], [], []);

						const placed: boolean =
							service.placeTrapInFurniture(9999, 9999, TrapType.Bomb, SpyIdentity.Black);

						expect(placed)
							.toBe(false);
					});

				it("should place trap and return true when near furniture",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						const placed: boolean =
							service.placeTrapInFurniture(pos.x, pos.z, TrapType.Bomb, SpyIdentity.Black);

						expect(placed)
							.toBe(true);
					});

				it("should not overwrite an existing trap",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						/* Place first trap. */
						service.placeTrapInFurniture(pos.x, pos.z, TrapType.Bomb, SpyIdentity.Black);

						/* Attempt to place second trap — should fail. */
						const secondPlace: boolean =
							service.placeTrapInFurniture(
								pos.x,
								pos.z,
								TrapType.SpringTrap,
								SpyIdentity.White);

						expect(secondPlace)
							.toBe(false);
					});
			});

		describe("self-trap immunity",
			() =>
			{
				it("should not trigger own trap when same identity searches",
					() =>
					{
						service.initialize([], [], []);

						const pos: { x: number; z: number; } =
							furnitureWorldPosition(0);

						/* Black places a trap. */
						service.placeTrapInFurniture(pos.x, pos.z, TrapType.Bomb, SpyIdentity.Black);

						/* Black searches — self-immunity, should not trigger trap. */
						const result: SearchAttemptResult | null =
							service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);

						expect(result?.result)
							.not
							.toBe(SearchResult.FoundTrap);
					});

				it("should trigger trap when opposing identity searches",
					() =>
					{
						service.initialize([], [], []);

						let trapPos: { x: number; z: number; } | null = null;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const fPos: { x: number; z: number; } =
								furnitureWorldPosition(idx);

							const placed: boolean =
								service.placeTrapInFurniture(fPos.x, fPos.z, TrapType.Bomb, SpyIdentity.Black);

							if (placed)
							{
								trapPos = fPos;
								break;
							}
						}

						expect(trapPos)
							.not
							.toBeNull();

						/* White searches the same furniture — should find the trap. */
						const result: SearchAttemptResult | null =
							service.searchNearby(
								trapPos!.x,
								trapPos!.z,
								[],
								SpyIdentity.White);

						expect(result?.result)
							.toBe(SearchResult.FoundTrap);
					});
			});

		describe("per-identity item distribution",
			() =>
			{
				it("should distribute exactly 4 items for Black spy",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						service.initialize(items, [], []);

						let blackCount: number = 0;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);

							if (result != null && result.result === SearchResult.FoundItem)
							{
								blackCount++;
							}
						}

						expect(blackCount)
							.toBe(4);
					});

				it("should distribute exactly 4 items for White spy",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						service.initialize(items, [], []);

						let whiteCount: number = 0;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.White);

							if (result != null && result.result === SearchResult.FoundItem)
							{
								whiteCount++;
							}
						}

						expect(whiteCount)
							.toBe(4);
					});

				it("should not clear White items when Black finds in same furniture",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						service.initialize(items, [], []);

						/* Search ALL furniture as Black first. */
						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);
						}

						/* Now White searches everything — should still find 4 items. */
						let whiteCount: number = 0;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.White);

							if (result != null && result.result === SearchResult.FoundItem)
							{
								whiteCount++;
							}
						}

						expect(whiteCount)
							.toBe(4);
					});

				it("should distribute all 4 item types for each identity",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						service.initialize(items, [], []);

						const blackTypes: Set<ItemType> =
							new Set<ItemType>();

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);

							if (
								result != null
									&& result.result === SearchResult.FoundItem
									&& result.itemType != null)
							{
								blackTypes.add(result.itemType);
							}
						}

						expect(blackTypes.size)
							.toBe(4);
					});
			});

		describe("redistributeItem",
			() =>
			{
				it("should place a dropped item back into furniture and make it findable",
					() =>
					{
						service.initialize([], [], []);

						/* Redistribute a KeyCard for Black. */
						service.redistributeItem(
							ItemType.KeyCard,
							SpyIdentity.Black);

						/* Search all furniture to find the redistributed item. */
						let foundItem: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);

							if (
								result != null
									&& result.result === SearchResult.FoundItem
									&& result.itemType === ItemType.KeyCard)
							{
								foundItem = true;
								break;
							}
						}

						expect(foundItem)
							.toBe(true);
					});

				it("should mark furniture unsearched after redistribution",
					() =>
					{
						const items: WorldItem[] =
							[buildWorldItem(ItemType.SecretDocuments, "doc-1")];

						service.initialize(items, [], []);

						/* Search all furniture as Black. */
						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);
						}

						/* Now redistribute a KeyCard — it should be placed in
						   furniture and that furniture marked unsearched. */
						service.redistributeItem(
							ItemType.KeyCard,
							SpyIdentity.Black);

						let foundKeyCard: boolean = false;

						for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
						{
							const pos: { x: number; z: number; } =
								furnitureWorldPosition(idx);
							const result: SearchAttemptResult | null =
								service.searchNearby(pos.x, pos.z, [], SpyIdentity.Black);

							if (
								result != null
									&& result.result === SearchResult.FoundItem
									&& result.itemType === ItemType.KeyCard)
							{
								foundKeyCard = true;
								break;
							}
						}

						expect(foundKeyCard)
							.toBe(true);
					});
			});

		describe("column distribution constraint",
			() =>
			{
				/**
		 * Determines which column a furniture piece belongs to.
		 * @param furnitureId The furniture identifier.
		 * @returns Column index (0=left, 1=center, 2=right) or -1 if unknown.
		 */
				function getColumnIndex(furnitureId: string): number
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
		 * Finds which furniture IDs contain items for a given identity
		 * by searching all furniture and collecting item locations.
		 * @param identity Spy identity to check items for.
		 * @returns Array of furniture IDs that contain items.
		 */
				function findItemFurnitureIds(identity: SpyIdentity): string[]
				{
					const itemFurnitureIds: string[] = [];

					for (let idx: number = 0; idx < ROOM_FURNITURE.length; idx++)
					{
						const pos: { x: number; z: number; } =
							furnitureWorldPosition(idx);
						const result: SearchAttemptResult | null =
							service.searchNearby(pos.x, pos.z, [], identity);

						if (result != null && result.result === SearchResult.FoundItem)
						{
							itemFurnitureIds.push(ROOM_FURNITURE[idx]!.id);
						}
					}

					return itemFurnitureIds;
				}

				it("should distribute items across at least 2 columns over 50 random runs",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						for (let run: number = 0; run < 50; run++)
						{
							service.initialize(items, [], []);

							const blackFurniture: string[] =
								findItemFurnitureIds(SpyIdentity.Black);
							const blackColumns: Set<number> =
								new Set<number>(
									blackFurniture.map(
										(furnId) => getColumnIndex(furnId)));

							expect(blackColumns.size, `Black items should span 2+ columns (run ${run})`)
								.toBeGreaterThanOrEqual(2);

							/* Re-initialize for White check. */
							service.initialize(items, [], []);

							const whiteFurniture: string[] =
								findItemFurnitureIds(SpyIdentity.White);
							const whiteColumns: Set<number> =
								new Set<number>(
									whiteFurniture.map(
										(furnId) => getColumnIndex(furnId)));

							expect(whiteColumns.size, `White items should span 2+ columns (run ${run})`)
								.toBeGreaterThanOrEqual(2);
						}
					});

				it("should place exactly 4 items per identity with constraint active",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						for (let run: number = 0; run < 20; run++)
						{
							service.initialize(items, [], []);

							const blackFurniture: string[] =
								findItemFurnitureIds(SpyIdentity.Black);

							expect(blackFurniture.length, `Black should have exactly 4 items (run ${run})`)
								.toBe(4);
						}
					});

				it("should only place items in valid furniture slots",
					() =>
					{
						const items: WorldItem[] =
							[
								buildWorldItem(ItemType.SecretDocuments, "doc-1"),
								buildWorldItem(ItemType.Passport, "pass-1"),
								buildWorldItem(ItemType.KeyCard, "key-1"),
								buildWorldItem(ItemType.MoneyBag, "money-1")
							];

						const validIds: Set<string> =
							new Set<string>(
								ROOM_FURNITURE.map(
									(furn) => furn.id));

						for (let run: number = 0; run < 20; run++)
						{
							service.initialize(items, [], []);

							const blackFurniture: string[] =
								findItemFurnitureIds(SpyIdentity.Black);

							for (const furnId of blackFurniture)
							{
								expect(validIds.has(furnId), `Furniture ${furnId} should be valid (run ${run})`)
									.toBe(true);
							}
						}
					});
			});
	});