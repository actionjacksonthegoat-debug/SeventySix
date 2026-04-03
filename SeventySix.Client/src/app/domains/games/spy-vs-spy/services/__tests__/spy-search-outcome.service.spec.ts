// <copyright file="spy-search-outcome.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * SpySearchOutcomeService unit tests.
 * Validates outcome application for items, traps, remedies, and bomb drops.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ItemType,
	RemedyType,
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { LifeChange, SearchOutcome } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyDamageHandlerService } from "@games/spy-vs-spy/services/spy-damage-handler.service";
import { SpyInventoryService } from "@games/spy-vs-spy/services/spy-inventory.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { SpySearchOutcomeService } from "@games/spy-vs-spy/services/spy-search-outcome.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";

describe("SpySearchOutcomeService",
	() =>
	{
		let service: SpySearchOutcomeService;
		let inventoryService: SpyInventoryService;
		let mockDamageHandler: SpyDamageHandlerService;
		let mockSearchService: SearchService;
		let mockSpyAi: SpyAiService;
		let mockSearchHandler: SpySearchHandlerService;
		let mockTrapService: TrapService;

		beforeEach(
			() =>
			{
				mockDamageHandler =
					{
						applyTrapToSpy: vi
							.fn()
							.mockReturnValue(false)
					} as unknown as SpyDamageHandlerService;

				mockSearchService =
					{
						redistributeItem: vi.fn()
					} as unknown as SearchService;

				mockSpyAi =
					{
						collectItem: vi.fn(),
						collectRemedy: vi.fn()
					} as unknown as SpyAiService;

				mockSearchHandler =
					{
						showNotification: vi.fn()
					} as unknown as SpySearchHandlerService;

				mockTrapService =
					{
						replenishTrap: vi.fn()
					} as unknown as TrapService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpySearchOutcomeService,
							SpyInventoryService,
							{ provide: SpyDamageHandlerService, useValue: mockDamageHandler },
							{ provide: SearchService, useValue: mockSearchService },
							{ provide: SpyAiService, useValue: mockSpyAi },
							{ provide: SpySearchHandlerService, useValue: mockSearchHandler },
							{ provide: TrapService, useValue: mockTrapService }
						]
					});

				service =
					TestBed.inject(SpySearchOutcomeService);
				inventoryService =
					TestBed.inject(SpyInventoryService);
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("item outcomes",
			() =>
			{
				it("should add item to player 1 inventory",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "item", itemType: ItemType.Passport };

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
						expect(inventoryService.getItemCount(SpyIdentity.Black))
							.toBe(1);
					});

				it("should add item to player 2 inventory and notify AI",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "item", itemType: ItemType.KeyCard };

						service.applyOutcome(outcome, false);

						expect(inventoryService.getItemCount(SpyIdentity.White))
							.toBe(1);
						expect(mockSpyAi.collectItem)
							.toHaveBeenCalledWith(ItemType.KeyCard);
					});

				it("should show notification for player 1 item",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "item", itemType: ItemType.MoneyBag };

						service.applyOutcome(outcome, true);

						expect(mockSearchHandler.showNotification)
							.toHaveBeenCalled();
					});

				it("should return empty changes when itemType is null",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "item" };

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});
			});

		describe("trap outcomes",
			() =>
			{
				it("should apply trap via damage handler",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.SpringTrap,
								trapPlacedBy: SpyIdentity.White
							};

						service.applyOutcome(outcome, true);

						expect(mockDamageHandler.applyTrapToSpy)
							.toHaveBeenCalledWith(
								TrapType.SpringTrap,
								true);
					});

				it("should replenish trap for placing spy",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.Bomb,
								trapPlacedBy: SpyIdentity.Black
							};

						service.applyOutcome(outcome, false);

						expect(mockTrapService.replenishTrap)
							.toHaveBeenCalledWith(
								SpyIdentity.Black,
								TrapType.Bomb);
					});

				it("should return life change for bomb trap",
					() =>
					{
						vi
							.mocked(mockDamageHandler.applyTrapToSpy)
							.mockReturnValue(true);

						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.Bomb,
								trapPlacedBy: SpyIdentity.White
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(1);
						expect(changes[0].identity)
							.toBe(SpyIdentity.Black);
						expect(changes[0].delta)
							.toBe(-1);
					});

				it("should return empty changes for spring trap",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.SpringTrap,
								trapPlacedBy: SpyIdentity.White
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});

				it("should return empty changes when trapType is null",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "trap" };

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});
			});

		describe("remedy defused outcomes",
			() =>
			{
				it("should consume remedy from player 1 inventory",
					() =>
					{
						inventoryService.collectRemedy(
							SpyIdentity.Black,
							RemedyType.WireCutters);

						const outcome: SearchOutcome =
							{
								type: "remedy-defused",
								remedyType: RemedyType.WireCutters
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
						expect(mockSearchHandler.showNotification)
							.toHaveBeenCalled();
					});

				it("should consume remedy from player 2 inventory",
					() =>
					{
						inventoryService.collectRemedy(
							SpyIdentity.White,
							RemedyType.Shield);

						const outcome: SearchOutcome =
							{
								type: "remedy-defused",
								remedyType: RemedyType.Shield
							};

						service.applyOutcome(outcome, false);
					});

				it("should return empty when remedyType is null",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "remedy-defused" };

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});
			});

		describe("remedy pickup outcomes",
			() =>
			{
				it("should add shield to player 1 and return +1 life change",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "remedy-pickup",
								remedyType: RemedyType.Shield
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(1);
						expect(changes[0].identity)
							.toBe(SpyIdentity.Black);
						expect(changes[0].delta)
							.toBe(1);
					});

				it("should add wire cutters to player 1 with no life change",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "remedy-pickup",
								remedyType: RemedyType.WireCutters
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});

				it("should add shield to player 2 and return +1 life change",
					() =>
					{
						const outcome: SearchOutcome =
							{
								type: "remedy-pickup",
								remedyType: RemedyType.Shield
							};

						const changes: LifeChange[] =
							service.applyOutcome(outcome, false);

						expect(changes)
							.toHaveLength(1);
						expect(changes[0].identity)
							.toBe(SpyIdentity.White);
						expect(changes[0].delta)
							.toBe(1);
						expect(mockSpyAi.collectRemedy)
							.toHaveBeenCalledWith(RemedyType.Shield);
					});
			});

		describe("empty outcomes",
			() =>
			{
				it("should return empty changes",
					() =>
					{
						const outcome: SearchOutcome =
							{ type: "empty" };

						const changes: LifeChange[] =
							service.applyOutcome(outcome, true);

						expect(changes)
							.toHaveLength(0);
					});
			});

		describe("bomb item drop",
			() =>
			{
				it("should redistribute dropped item when player has items",
					() =>
					{
						inventoryService.collectItem(
							SpyIdentity.Black,
							ItemType.Passport);

						vi
							.mocked(mockDamageHandler.applyTrapToSpy)
							.mockReturnValue(true);

						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.Bomb,
								trapPlacedBy: SpyIdentity.White
							};

						service.applyOutcome(outcome, true);

						expect(mockSearchService.redistributeItem)
							.toHaveBeenCalled();
					});

				it("should not redistribute when player has no items",
					() =>
					{
						vi
							.mocked(mockDamageHandler.applyTrapToSpy)
							.mockReturnValue(true);

						const outcome: SearchOutcome =
							{
								type: "trap",
								trapType: TrapType.Bomb,
								trapPlacedBy: SpyIdentity.White
							};

						service.applyOutcome(outcome, true);

						expect(mockSearchService.redistributeItem)
							.not
							.toHaveBeenCalled();
					});
			});
	});