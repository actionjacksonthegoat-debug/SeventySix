/**
 * Search Handler Service (SpySearchHandlerService) unit tests.
 * Tests search result processing, notification signals, search overlay,
 * and timer-based auto-hide behavior.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ItemType,
	RemedyType,
	SearchResult,
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { SearchAttemptResult } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { ItemService } from "./item.service";
import { SpyAudioService } from "./spy-audio.service";
import type { SearchOutcome } from "./spy-search-handler.service";
import { SpySearchHandlerService } from "./spy-search-handler.service";

describe("SpySearchHandlerService",
	() =>
	{
		let service: SpySearchHandlerService;
		let mockItems: ItemService;
		let mockAudio: SpyAudioService;

		beforeEach(
			() =>
			{
				mockItems =
					{
						collectItemByType: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as ItemService;

				mockAudio =
					{
						playItemCollected: (): void =>
						{/* mock */},
						playBombTriggered: (): void =>
						{/* mock */},
						playSpringTriggered: (): void =>
						{/* mock */},
						playCombatHit: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAudioService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpySearchHandlerService,
							{ provide: ItemService, useValue: mockItems },
							{ provide: SpyAudioService, useValue: mockAudio }
						]
					});

				service =
					TestBed.inject(SpySearchHandlerService);
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initial signals should have default values",
			() =>
			{
				expect(service.isSearching())
					.toBe(false);
				expect(service.notificationMessage())
					.toBe("");
				expect(service.notificationColor())
					.toBe("#0f0");
			});

		describe("handleSearchResult",
			() =>
			{
				it("should return item outcome and collect item when FoundItem",
					() =>
					{
						let collectedType: ItemType | null = null;
						let collectedIdentity: SpyIdentity | null = null;

						mockItems.collectItemByType =
							(itemType: ItemType, identity: SpyIdentity): void =>
							{
								collectedType = itemType;
								collectedIdentity = identity;
							};

						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundItem,
								itemType: ItemType.Passport,
								furnitureId: "desk-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, true);

						expect(outcome.type)
							.toBe("item");
						expect(outcome.itemType)
							.toBe(ItemType.Passport);
						expect(collectedType)
							.toBe(ItemType.Passport);
						expect(collectedIdentity)
							.toBe(SpyIdentity.Black);
					});

				it("should collect item for White identity when not player 1",
					() =>
					{
						let collectedIdentity: SpyIdentity | null = null;

						mockItems.collectItemByType =
							(_itemType: ItemType, identity: SpyIdentity): void =>
							{
								collectedIdentity = identity;
							};

						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundItem,
								itemType: ItemType.KeyCard,
								furnitureId: "barrel-0"
							};

						service.handleSearchResult(result, false);

						expect(collectedIdentity)
							.toBe(SpyIdentity.White);
					});

				it("should play item collected audio on FoundItem",
					() =>
					{
						let audioPlayed: boolean = false;

						mockAudio.playItemCollected =
							(): void =>
							{
								audioPlayed = true;
							};

						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundItem,
								itemType: ItemType.MoneyBag,
								furnitureId: "crate-0"
							};

						service.handleSearchResult(result, true);

						expect(audioPlayed)
							.toBe(true);
					});

				it("should return trap outcome with trap details on FoundTrap",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundTrap,
								trapType: TrapType.Bomb,
								trapPlacedBy: SpyIdentity.White,
								furnitureId: "barrel-cove-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, true);

						expect(outcome.type)
							.toBe("trap");
						expect(outcome.trapType)
							.toBe(TrapType.Bomb);
						expect(outcome.trapPlacedBy)
							.toBe(SpyIdentity.White);
					});

				it("should show stun notification for player 1 on bomb trap",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundTrap,
								trapType: TrapType.Bomb,
								furnitureId: "barrel-0"
							};

						service.handleSearchResult(result, true);

						expect(service.notificationMessage())
							.toContain("BOMB");
						expect(service.notificationColor())
							.toBe("#f00");
					});

				it("should show enemy hit notification for player 2 trap",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundTrap,
								trapType: TrapType.SpringTrap,
								furnitureId: "barrel-0"
							};

						service.handleSearchResult(result, false);

						expect(service.notificationMessage())
							.toContain("Enemy hit");
						expect(service.notificationColor())
							.toBe("#0f0");
					});

				it("should return remedy-defused outcome when wasDefusal is true",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundRemedy,
								remedyType: RemedyType.WireCutters,
								wasDefusal: true,
								furnitureId: "cabinet-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, true);

						expect(outcome.type)
							.toBe("remedy-defused");
						expect(outcome.remedyType)
							.toBe(RemedyType.WireCutters);
					});

				it("should return remedy-pickup outcome when wasDefusal is not true",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.FoundRemedy,
								remedyType: RemedyType.WireCutters,
								furnitureId: "cabinet-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, true);

						expect(outcome.type)
							.toBe("remedy-pickup");
						expect(outcome.remedyType)
							.toBe(RemedyType.WireCutters);
					});

				it("should return empty outcome and show notification for player 1 on Empty",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.Empty,
								furnitureId: "desk-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, true);

						expect(outcome.type)
							.toBe("empty");
						expect(service.notificationMessage())
							.toContain("Nothing");
					});

				it("should return empty outcome without notification for player 2 on Empty",
					() =>
					{
						const result: SearchAttemptResult =
							{
								result: SearchResult.Empty,
								furnitureId: "desk-0"
							};

						const outcome: SearchOutcome =
							service.handleSearchResult(result, false);

						expect(outcome.type)
							.toBe("empty");
						expect(service.notificationMessage())
							.toBe("");
					});
			});

		describe("showSearchOverlay",
			() =>
			{
				it("should set isSearching to true",
					() =>
					{
						service.showSearchOverlay();

						expect(service.isSearching())
							.toBe(true);
					});
			});

		describe("clearSearchTimer",
			() =>
			{
				it("should not throw when no timer is active",
					() =>
					{
						expect(() => service.clearSearchTimer())
							.not
							.toThrow();
					});
			});

		describe("showNotification",
			() =>
			{
				it("should update notification message and color signals",
					() =>
					{
						service.showNotification("Test message", 0, "#ff0");

						expect(service.notificationMessage())
							.toBe("Test message");
						expect(service.notificationColor())
							.toBe("#ff0");
					});

				it("should use default green color when color is omitted",
					() =>
					{
						service.showNotification("Default color", 0);

						expect(service.notificationColor())
							.toBe("#0f0");
					});
			});

		describe("dispose",
			() =>
			{
				it("should reset all signals to defaults",
					() =>
					{
						service.showNotification("Active message", 0, "#f00");
						service.showSearchOverlay();

						service.dispose();

						expect(service.isSearching())
							.toBe(false);
						expect(service.notificationMessage())
							.toBe("");
						expect(service.notificationColor())
							.toBe("#0f0");
					});
			});
	});