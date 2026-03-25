/**
 * AI Coordinator Service (SpyAiCoordinatorService) unit tests.
 * Tests per-frame AI updates: search delegation, combat engagement,
 * trap placement, cooldown management, and player state building.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ItemType,
	RemedyType,
	RoomId,
	SearchResult,
	SpyIdentity,
	StunState,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	PlacedTrap,
	SearchAttemptResult,
	SpyPhysicsState,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { CombatService } from "./combat.service";
import { SearchService } from "./search.service";
import { SpyAiCoordinatorService } from "./spy-ai-coordinator.service";
import { SpyAiService } from "./spy-ai.service";
import { SpyPhysicsService } from "./spy-physics.service";
import { TrapService } from "./trap.service";

/** Creates a default player physics state for test setup. */
function createPlayerState(
	overrides?: Partial<SpyPhysicsState>): SpyPhysicsState
{
	return {
		positionX: 0,
		positionZ: 0,
		rotationY: 0,
		stunState: StunState.None,
		stunRemainingSeconds: 0,
		...overrides
	};
}

/** Creates a default AI spy state for test setup. */
function createAiState(
	overrides?: Partial<SpyState>): Readonly<SpyState>
{
	return {
		identity: SpyIdentity.White,
		currentRoomId: RoomId.CoveCave,
		positionX: 5,
		positionZ: 5,
		rotationY: 0,
		inventory: [],
		remedies: [],
		stunState: StunState.None,
		stunRemainingSeconds: 0,
		personalTimer: 300,
		...overrides
	};
}

describe("SpyAiCoordinatorService",
	() =>
	{
		let service: SpyAiCoordinatorService;
		let mockAi: SpyAiService;
		let mockPhysics: SpyPhysicsService;
		let mockSearchService: SearchService;
		let mockTrapService: TrapService;
		let mockCombatService: CombatService;

		beforeEach(
			() =>
			{
				mockAi =
					{
						update: (): void =>
						{/* mock */},
						getState: (): Readonly<SpyState> =>
							createAiState(),
						getWantsSearch: (): boolean => false,
						getWantsCombat: (): boolean => false,
						getRemedies: (): ReadonlyArray<RemedyType> => [],
						markFurnitureSearched: (): void =>
						{/* mock */},
						setStunned: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAiService;

				mockPhysics =
					{
						getState: (): SpyPhysicsState =>
							createPlayerState(),
						setStunned: (): void =>
						{/* mock */},
						resetPosition: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyPhysicsService;

				mockSearchService =
					{
						initialize: (): void =>
						{/* mock */},
						searchNearby: (): SearchAttemptResult | null => null,
						isSearched: (): boolean => false,
						getUnsearched: (): ReadonlyArray<string> => [],
						placeTrapInFurniture: (): boolean => true,
						redistributeItem: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SearchService;

				mockTrapService =
					{
						getActiveTraps: (): ReadonlyArray<PlacedTrap> => [],
						getAvailableTrapTypes: (): ReadonlyArray<TrapType> => [],
						consumeTrap: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as TrapService;

				mockCombatService =
					{
						isInCombat: (): boolean => false,
						canEngage: (): boolean => false,
						startCombat: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as CombatService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyAiCoordinatorService,
							{ provide: SpyAiService, useValue: mockAi },
							{ provide: SpyPhysicsService, useValue: mockPhysics },
							{ provide: SearchService, useValue: mockSearchService },
							{ provide: TrapService, useValue: mockTrapService },
							{ provide: CombatService, useValue: mockCombatService }
						]
					});

				service =
					TestBed.inject(SpyAiCoordinatorService);
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("updateAi should call spyAi.update with provided delta and player state",
			() =>
			{
				let receivedDelta: number = -1;
				let receivedPlayerState: Readonly<SpyState> | null = null;

				mockAi.update =
					(dt: number, playerState: Readonly<SpyState>): void =>
					{
						receivedDelta = dt;
						receivedPlayerState = playerState;
					};

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				service.updateAi(0.016, playerState);

				expect(receivedDelta)
					.toBeCloseTo(0.016, 4);
				expect(receivedPlayerState)
					.not
					.toBeNull();
			});

		it("updateAi should return null when AI does not want to search",
			() =>
			{
				mockAi.getWantsSearch =
					(): boolean => false;

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });
				const result: SearchAttemptResult | null =
					service.updateAi(0.016, playerState);

				expect(result)
					.toBeNull();
			});

		it("updateAi should return search result when AI searches successfully",
			() =>
			{
				const expectedResult: SearchAttemptResult =
					{
						result: SearchResult.FoundItem,
						itemType: ItemType.Passport,
						furnitureId: "desk-junglehq-0"
					};

				mockAi.getWantsSearch =
					(): boolean => true;
				mockSearchService.searchNearby =
					(): SearchAttemptResult | null =>
						expectedResult;

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });
				const result: SearchAttemptResult | null =
					service.updateAi(0.016, playerState);

				expect(result)
					.toEqual(expectedResult);
			});

		it("updateAi should mark furniture as searched when AI finds something",
			() =>
			{
				let markedId: string = "";

				mockAi.getWantsSearch =
					(): boolean => true;
				mockAi.markFurnitureSearched =
					(furnitureId: string): void =>
					{
						markedId = furnitureId;
					};
				mockSearchService.searchNearby =
					(): SearchAttemptResult | null => ({
						result: SearchResult.FoundItem,
						itemType: ItemType.KeyCard,
						furnitureId: "barrel-cove-1"
					});

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				service.updateAi(0.016, playerState);

				expect(markedId)
					.toBe("barrel-cove-1");
			});

		it("updateAi should start combat when AI wants combat and can engage",
			() =>
			{
				let combatStarted: boolean = false;

				mockAi.getWantsCombat =
					(): boolean => true;
				mockCombatService.canEngage =
					(): boolean => true;
				mockCombatService.startCombat =
					(): void =>
					{
						combatStarted = true;
					};

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				service.updateAi(0.016, playerState);

				expect(combatStarted)
					.toBe(true);
			});

		it("updateAi should not start combat when already in combat",
			() =>
			{
				let combatStarted: boolean = false;

				mockAi.getWantsCombat =
					(): boolean => true;
				mockCombatService.isInCombat =
					(): boolean => true;
				mockCombatService.canEngage =
					(): boolean => true;
				mockCombatService.startCombat =
					(): void =>
					{
						combatStarted = true;
					};

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				service.updateAi(0.016, playerState);

				expect(combatStarted)
					.toBe(false);
			});

		it("updateAi should attempt trap placement when cooldown expires",
			() =>
			{
				let trapConsumed: boolean = false;

				mockTrapService.getAvailableTrapTypes =
					(): ReadonlyArray<TrapType> =>
						[TrapType.Bomb];
				mockTrapService.consumeTrap =
					(): void =>
					{
						trapConsumed = true;
					};
				mockSearchService.placeTrapInFurniture =
					(): boolean => true;

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				/* Cooldown starts at 0, so first update should trigger placement. */
				service.updateAi(0.016, playerState);

				expect(trapConsumed)
					.toBe(true);
			});

		it("updateAi should skip trap placement when no traps available",
			() =>
			{
				let trapConsumed: boolean = false;

				mockTrapService.getAvailableTrapTypes =
					(): ReadonlyArray<TrapType> => [];
				mockTrapService.consumeTrap =
					(): void =>
					{
						trapConsumed = true;
					};

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				service.updateAi(0.016, playerState);

				expect(trapConsumed)
					.toBe(false);
			});

		it("buildPlayerSpyState should construct frozen state snapshot",
			() =>
			{
				const physState: SpyPhysicsState =
					createPlayerState(
						{ positionX: 10, positionZ: 20, rotationY: 1.5 });
				const inventory: ItemType[] =
					[ItemType.Passport, ItemType.KeyCard];
				const remedies: RemedyType[] =
					[RemedyType.WireCutters];

				const result: Readonly<SpyState> =
					service.buildPlayerSpyState(
						physState,
						RoomId.JungleHq,
						inventory,
						remedies,
						250);

				expect(result.identity)
					.toBe(SpyIdentity.Black);
				expect(result.currentRoomId)
					.toBe(RoomId.JungleHq);
				expect(result.positionX)
					.toBe(10);
				expect(result.positionZ)
					.toBe(20);
				expect(result.rotationY)
					.toBe(1.5);
				expect(result.inventory)
					.toEqual(
						[ItemType.Passport, ItemType.KeyCard]);
				expect(result.remedies)
					.toEqual(
						[RemedyType.WireCutters]);
				expect(result.personalTimer)
					.toBe(250);
			});

		it("reset should allow immediate trap placement on next update",
			() =>
			{
				let placementCount: number = 0;

				mockTrapService.getAvailableTrapTypes =
					(): ReadonlyArray<TrapType> =>
						[TrapType.SpringTrap];
				mockSearchService.placeTrapInFurniture =
					(): boolean => true;
				mockTrapService.consumeTrap =
					(): void =>
					{
						placementCount++;
					};

				const playerState: Readonly<SpyState> =
					createAiState(
						{ identity: SpyIdentity.Black });

				/* First update triggers placement (cooldown starts at 0). */
				service.updateAi(0.016, playerState);

				expect(placementCount)
					.toBe(1);

				/* After placement, cooldown is 20. Reset clears it. */
				service.reset();
				service.updateAi(0.016, playerState);

				expect(placementCount)
					.toBe(2);
			});
	});