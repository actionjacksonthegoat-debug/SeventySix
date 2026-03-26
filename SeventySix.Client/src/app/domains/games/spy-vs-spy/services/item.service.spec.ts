/**
 * Item Service unit tests.
 * Tests item spawning, collection mechanics, room-item mapping, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import {
	ISLAND_ROOMS,
	REQUIRED_ITEM_COUNT
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	RoomId,
	SpyIdentity
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { WorldItem } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { ItemService } from "./item.service";

describe("ItemService",
	() =>
	{
		let service: ItemService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							ItemService
						]
					});

				service =
					TestBed.inject(ItemService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("initializeItems",
			() =>
			{
				it("should spawn exactly REQUIRED_ITEM_COUNT items",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();

						expect(uncollected.length)
							.toBe(REQUIRED_ITEM_COUNT);
					});

				it("should spawn exactly one instance of each ItemType",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();
						const itemTypes: ItemType[] =
							uncollected.map(
								(item) => item.type);

						expect(itemTypes)
							.toContain(ItemType.SecretDocuments);
						expect(itemTypes)
							.toContain(ItemType.Passport);
						expect(itemTypes)
							.toContain(ItemType.KeyCard);
						expect(itemTypes)
							.toContain(ItemType.MoneyBag);
					});
			});

		describe("tryCollect",
			() =>
			{
				it("should return ItemType when spy is within ITEM_COLLECTION_RADIUS",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();
						const targetItem: WorldItem =
							uncollected[0];

						const collected: ItemType | null =
							service.tryCollect(
								targetItem.positionX,
								targetItem.positionZ,
								SpyIdentity.Black);

						expect(collected)
							.toBe(targetItem.type);
					});

				it("should return null when spy is outside ITEM_COLLECTION_RADIUS",
					() =>
					{
						service.initializeItems(scene);

						const collected: ItemType | null =
							service.tryCollect(
								9999,
								9999,
								SpyIdentity.Black);

						expect(collected)
							.toBeNull();
					});

				it("should return null for already-collected items",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();
						const targetItem: WorldItem =
							uncollected[0];

						/* Collect the item once. */
						service.tryCollect(
							targetItem.positionX,
							targetItem.positionZ,
							SpyIdentity.Black);

						/* Attempt to collect at the same position again. */
						const secondAttempt: ItemType | null =
							service.tryCollect(
								targetItem.positionX,
								targetItem.positionZ,
								SpyIdentity.Black);

						expect(secondAttempt)
							.toBeNull();
					});
			});

		describe("getUncollectedItems",
			() =>
			{
				it("should return all items initially",
					() =>
					{
						service.initializeItems(scene);

						expect(service.getUncollectedItems().length)
							.toBe(REQUIRED_ITEM_COUNT);
					});

				it("should return fewer items after collection",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();
						const targetItem: WorldItem =
							uncollected[0];

						service.tryCollect(
							targetItem.positionX,
							targetItem.positionZ,
							SpyIdentity.Black);

						expect(service.getUncollectedItems().length)
							.toBe(REQUIRED_ITEM_COUNT - 1);
					});
			});

		describe("getCollectedByIdentity",
			() =>
			{
				it("should return empty initially",
					() =>
					{
						service.initializeItems(scene);

						const collected: ReadonlyArray<WorldItem> =
							service.getCollectedByIdentity(SpyIdentity.Black);

						expect(collected.length)
							.toBe(0);
					});

				it("should return items collected by specific spy",
					() =>
					{
						service.initializeItems(scene);

						const uncollected: ReadonlyArray<WorldItem> =
							service.getUncollectedItems();
						const targetItem: WorldItem =
							uncollected[0];

						service.tryCollect(
							targetItem.positionX,
							targetItem.positionZ,
							SpyIdentity.Black);

						const collected: ReadonlyArray<WorldItem> =
							service.getCollectedByIdentity(SpyIdentity.Black);

						expect(collected.length)
							.toBe(1);
						expect(collected[0].type)
							.toBe(targetItem.type);
					});
			});

		describe("dispose",
			() =>
			{
				it("should not throw",
					() =>
					{
						service.initializeItems(scene);

						expect(() => service.dispose())
							.not
							.toThrow();
					});

				it("should not throw when called without initialization",
					() =>
					{
						expect(() => service.dispose())
							.not
							.toThrow();
					});
			});

		describe("collectItemByType",
			() =>
			{
				it("should collect an uncollected item by type",
					() =>
					{
						service.initializeItems(scene);

						const result: WorldItem | null =
							service.collectItemByType(
								ItemType.SecretDocuments,
								SpyIdentity.Black);

						expect(result)
							.not
							.toBeNull();
						expect(result!.type)
							.toBe(ItemType.SecretDocuments);
						expect(result!.collected)
							.toBe(true);
						expect(result!.collectedBy)
							.toBe(SpyIdentity.Black);
					});

				it("should allow both identities to collect the same item type",
					() =>
					{
						service.initializeItems(scene);
						service.collectItemByType(
							ItemType.Passport,
							SpyIdentity.White);

						const second: WorldItem | null =
							service.collectItemByType(
								ItemType.Passport,
								SpyIdentity.Black);

						expect(second)
							.not
							.toBeNull();
						expect(second?.type)
							.toBe(ItemType.Passport);
					});

				it("should return null for items not initialized",
					() =>
					{
						const result: WorldItem | null =
							service.collectItemByType(
								ItemType.KeyCard,
								SpyIdentity.Black);

						expect(result)
							.toBeNull();
					});
			});

		describe("room-item mapping (pure logic)",
			() =>
			{
				it("ISLAND_ROOMS should contain exactly one guaranteed spawn per required item type",
					() =>
					{
						const requiredTypes: ItemType[] =
							[
								ItemType.SecretDocuments,
								ItemType.Passport,
								ItemType.KeyCard,
								ItemType.MoneyBag
							];

						for (const itemType of requiredTypes)
						{
							const roomsWithItem: RoomDefinition[] =
								ISLAND_ROOMS.filter(
									(room) =>
									{
										return room.spawnableItems.includes(itemType)
											&& room.id !== RoomId.Compound;
									});

							expect(
								roomsWithItem.length,
								"Expected exactly 1 non-Compound room for " + itemType)
								.toBe(1);
						}
					});

				it("Compound should be the only room with multiple spawnable items",
					() =>
					{
						const multiItemRooms: RoomDefinition[] =
							ISLAND_ROOMS.filter(
								(room) => room.spawnableItems.length > 1);

						expect(multiItemRooms.length)
							.toBe(1);
						expect(multiItemRooms[0].id)
							.toBe(RoomId.Compound);
					});

				it("Library should have zero spawnable items",
					() =>
					{
						const library: RoomDefinition | undefined =
							ISLAND_ROOMS.find(
								(room) => room.id === RoomId.Library);

						expect(library)
							.toBeTruthy();
						expect(library!.spawnableItems.length)
							.toBe(0);
					});
			});
	});