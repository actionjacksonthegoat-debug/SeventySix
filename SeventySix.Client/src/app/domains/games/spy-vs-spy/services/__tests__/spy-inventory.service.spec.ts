/**
 * Spy Inventory Service unit tests.
 * Tests per-player item and remedy collection, consumption, signals, and reset.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ItemType,
	RemedyType,
	SpyIdentity
} from "@games/spy-vs-spy/models/spy-vs-spy.models";

import { SpyInventoryService } from "@games/spy-vs-spy/services/spy-inventory.service";

describe("SpyInventoryService",
	() =>
	{
		let service: SpyInventoryService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyInventoryService
						]
					});

				service =
					TestBed.inject(SpyInventoryService);
			});

		describe("initial state",
			() =>
			{
				it("should start with zero items for both players",
					() =>
					{
						expect(service.player1ItemCount())
							.toBe(0);
						expect(service.player2ItemCount())
							.toBe(0);
					});

				it("should start with zero remedies",
					() =>
					{
						expect(service.player1RemedyCount())
							.toBe(0);
					});

				it("should start with allItemsCollected false",
					() =>
					{
						expect(service.allItemsCollected())
							.toBe(false);
					});
			});

		describe("collectItem",
			() =>
			{
				it("should increment player 1 item count",
					() =>
					{
						service.collectItem(
							SpyIdentity.Black,
							ItemType.Passport);

						expect(service.player1ItemCount())
							.toBe(1);
					});

				it("should increment player 2 item count",
					() =>
					{
						service.collectItem(
							SpyIdentity.White,
							ItemType.KeyCard);

						expect(service.player2ItemCount())
							.toBe(1);
					});

				it("should set allItemsCollected when player 1 reaches 4 items",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);
						service.collectItem(SpyIdentity.Black, ItemType.KeyCard);
						service.collectItem(SpyIdentity.Black, ItemType.SecretDocuments);
						service.collectItem(SpyIdentity.Black, ItemType.MoneyBag);

						expect(service.allItemsCollected())
							.toBe(true);
					});

				it("should not set allItemsCollected for player 2",
					() =>
					{
						service.collectItem(SpyIdentity.White, ItemType.Passport);
						service.collectItem(SpyIdentity.White, ItemType.KeyCard);
						service.collectItem(SpyIdentity.White, ItemType.SecretDocuments);
						service.collectItem(SpyIdentity.White, ItemType.MoneyBag);

						expect(service.allItemsCollected())
							.toBe(false);
					});
			});

		describe("dropRandomItem",
			() =>
			{
				it("should return null when inventory is empty",
					() =>
					{
						const dropped: ItemType | null =
							service.dropRandomItem(SpyIdentity.Black);

						expect(dropped)
							.toBeNull();
					});

				it("should remove and return an item from player 1",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);
						service.collectItem(SpyIdentity.Black, ItemType.KeyCard);

						const dropped: ItemType | null =
							service.dropRandomItem(SpyIdentity.Black);

						expect(dropped)
							.not
							.toBeNull();
						expect(service.player1ItemCount())
							.toBe(1);
					});

				it("should remove and return an item from player 2",
					() =>
					{
						service.collectItem(SpyIdentity.White, ItemType.Passport);

						const dropped: ItemType | null =
							service.dropRandomItem(SpyIdentity.White);

						expect(dropped)
							.toBe(ItemType.Passport);
						expect(service.player2ItemCount())
							.toBe(0);
					});
			});

		describe("getItemCount",
			() =>
			{
				it("should return correct item count",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);
						service.collectItem(SpyIdentity.Black, ItemType.KeyCard);

						expect(service.getItemCount(SpyIdentity.Black))
							.toBe(2);
						expect(service.getItemCount(SpyIdentity.White))
							.toBe(0);
					});
			});

		describe("hasAllItems",
			() =>
			{
				it("should return false when fewer than 4 items",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);

						expect(service.hasAllItems(SpyIdentity.Black))
							.toBe(false);
					});

				it("should return true when 4 or more items",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);
						service.collectItem(SpyIdentity.Black, ItemType.KeyCard);
						service.collectItem(SpyIdentity.Black, ItemType.SecretDocuments);
						service.collectItem(SpyIdentity.Black, ItemType.MoneyBag);

						expect(service.hasAllItems(SpyIdentity.Black))
							.toBe(true);
					});
			});

		describe("collectRemedy",
			() =>
			{
				it("should increment player 1 remedy count signal",
					() =>
					{
						service.collectRemedy(
							SpyIdentity.Black,
							RemedyType.WireCutters);

						expect(service.player1RemedyCount())
							.toBe(1);
					});

				it("should track player 2 remedies without signal update",
					() =>
					{
						service.collectRemedy(
							SpyIdentity.White,
							RemedyType.Shield);

						const remedies: readonly RemedyType[] =
							service.getRemedies(SpyIdentity.White);

						expect(remedies)
							.toHaveLength(1);
						expect(remedies[0])
							.toBe(RemedyType.Shield);
					});
			});

		describe("consumeRemedy",
			() =>
			{
				it("should remove a remedy from player 1 inventory",
					() =>
					{
						service.collectRemedy(SpyIdentity.Black, RemedyType.WireCutters);
						service.collectRemedy(SpyIdentity.Black, RemedyType.Shield);

						service.consumeRemedy(SpyIdentity.Black, RemedyType.WireCutters);

						expect(service.player1RemedyCount())
							.toBe(1);
					});

				it("should no-op if remedy is not in inventory",
					() =>
					{
						service.consumeRemedy(SpyIdentity.Black, RemedyType.WireCutters);

						expect(service.player1RemedyCount())
							.toBe(0);
					});
			});

		describe("getItemDisplayName",
			() =>
			{
				it("should return readable names for all item types",
					() =>
					{
						expect(service.getItemDisplayName(ItemType.SecretDocuments))
							.toBe("Secret Documents");
						expect(service.getItemDisplayName(ItemType.Passport))
							.toBe("Passport");
						expect(service.getItemDisplayName(ItemType.KeyCard))
							.toBe("Key Card");
						expect(service.getItemDisplayName(ItemType.MoneyBag))
							.toBe("Money Bag");
					});
			});

		describe("reset",
			() =>
			{
				it("should clear all inventories and signals",
					() =>
					{
						service.collectItem(SpyIdentity.Black, ItemType.Passport);
						service.collectItem(SpyIdentity.White, ItemType.KeyCard);
						service.collectRemedy(SpyIdentity.Black, RemedyType.WireCutters);
						service.collectItem(SpyIdentity.Black, ItemType.SecretDocuments);
						service.collectItem(SpyIdentity.Black, ItemType.MoneyBag);
						service.collectItem(SpyIdentity.Black, ItemType.KeyCard);

						service.reset();

						expect(service.player1ItemCount())
							.toBe(0);
						expect(service.player2ItemCount())
							.toBe(0);
						expect(service.player1RemedyCount())
							.toBe(0);
						expect(service.allItemsCollected())
							.toBe(false);
						expect(service.getItemCount(SpyIdentity.Black))
							.toBe(0);
						expect(service.getItemCount(SpyIdentity.White))
							.toBe(0);
					});
			});
	});