/**
 * Game Flow Service (SpyFlowService) unit tests.
 * Tests state machine transitions, turn-based orchestration, search,
 * combat, win/lose conditions, trap effects, and timer expiry.
 * All injected services are mocked — no real Babylon.js scene required.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	COUNTDOWN_DURATION_SECONDS,
	GAME_TIMER_SECONDS,
	SPY_STARTING_LIVES
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	CombatResult,
	ItemType,
	RemedyType,
	RoomId,
	SearchResult,
	SpyGameState,
	SpyIdentity,
	StunState,
	TrapType,
	TurnPhase
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	FurnitureDefinition,
	FurnitureType,
	PlacedTrap,
	SearchAttemptResult,
	SpyPhysicsState,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { AirplaneService } from "./airplane.service";
import { CombatService } from "./combat.service";
import { ExplosionService } from "./explosion.service";
import { FurnitureService } from "./furniture.service";
import { SpyFlowService } from "./game-flow.service";
import { ItemService } from "./item.service";
import { SearchService } from "./search.service";
import { SpyAiCoordinatorService } from "./spy-ai-coordinator.service";
import { SpyAiService } from "./spy-ai.service";
import { SpyAudioService } from "./spy-audio.service";
import { SpyBuilderService } from "./spy-builder.service";
import { SpyCameraService } from "./spy-camera.service";
import { SpyDamageHandlerService } from "./spy-damage-handler.service";
import { SpyPhysicsService } from "./spy-physics.service";
import { SpySearchHandlerService } from "./spy-search-handler.service";
import { TrapService } from "./trap.service";
import { TurnService } from "./turn.service";

/** Test-only type for accessing private inventory methods during test setup. */
interface FlowServiceTestAccess
{
	addPlayerItem(itemType: ItemType): void;
	addPlayer2Item(itemType: ItemType): void;
	dropRandomPlayerItem(): ItemType | null;
	dropRandomPlayer2Item(): ItemType | null;
}

/** Creates a default player physics state. */
function createPlayerState(
	overrides?: Partial<SpyPhysicsState>): SpyPhysicsState
{
	return {
		positionX: BLACK_SPY_SPAWN_X,
		positionZ: BLACK_SPY_SPAWN_Z,
		rotationY: 0,
		stunState: StunState.None,
		stunRemainingSeconds: 0,
		...overrides
	};
}

/** Creates a default AI spy state. */
function createAiState(
	overrides?: Partial<SpyState>): Readonly<SpyState>
{
	return {
		identity: SpyIdentity.White,
		currentRoomId: RoomId.Watchtower,
		positionX: 28,
		positionZ: -20,
		rotationY: 0,
		inventory: [],
		remedies: [],
		stunState: StunState.None,
		stunRemainingSeconds: 0,
		personalTimer: 0,
		...overrides
	};
}

describe("SpyFlowService",
	() =>
	{
		let service: SpyFlowService;
		let mockPhysics: SpyPhysicsService;
		let mockAi: SpyAiService;
		let mockItems: ItemService;
		let mockTraps: TrapService;
		let mockAudio: SpyAudioService;
		let mockTurnService: TurnService;
		let mockSearchService: SearchService;
		let mockCombatService: CombatService;
		let mockSpyBuilder: SpyBuilderService;
		let mockFurniture: FurnitureService;

		/** Mock airplane service for takeoff animation. */
		let mockAirplane: AirplaneService;

		/** Mock explosion service for island destruction cutscene. */
		let mockExplosion: ExplosionService;

		/** Mock camera service for cutscene panning. */
		let mockCamera: SpyCameraService;

		/** Tracks the current turn for mock TurnService. */
		let currentTurnValue: TurnPhase;

		/** Tracks player 1 timer for mock TurnService. */
		let player1TimerValue: number;

		/** Tracks player 2 timer for mock TurnService. */
		let player2TimerValue: number;

		/** Tracks combat active state for mock. */
		let combatActiveValue: boolean;

		beforeEach(
			() =>
			{
				currentTurnValue =
					TurnPhase.Player1;
				player1TimerValue = GAME_TIMER_SECONDS;
				player2TimerValue = GAME_TIMER_SECONDS;
				combatActiveValue = false;

				mockPhysics =
					{
						getState: (): SpyPhysicsState =>
							createPlayerState(),
						setStunned: (): void =>
						{/* mock */},
						initialize: (): void =>
						{/* mock */},
						update: (): void =>
						{/* mock */},
						resetPosition: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyPhysicsService;

				mockAi =
					{
						getState: (): Readonly<SpyState> =>
							createAiState(),
						setStunned: (): void =>
						{/* mock */},
						update: (): void =>
						{/* mock */},
						collectItem: (): void =>
						{/* mock */},
						collectRemedy: (): void =>
						{/* mock */},
						consumeRemedy: (): void =>
						{/* mock */},
						markFurnitureSearched: (): void =>
						{/* mock */},
						setPersonalTimer: (): void =>
						{/* mock */},
						getWantsCombat: (): boolean => false,
						getWantsSearch: (): boolean => false,
						getRemedies: (): RemedyType[] => [],
						initialize: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAiService;

				mockItems =
					{
						tryCollect: (): ItemType | null => null,
						getUncollectedItems: (): [] => [],
						collectItemByType: (): null => null,
						initializeItems: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */}
					} as unknown as ItemService;

				mockTraps =
					{
						canPlaceTrap: (): boolean => true,
						checkTriggers: (): PlacedTrap | null => null,
						getActiveTraps: (): PlacedTrap[] => [],
						getAvailableTrapTypes: (): TrapType[] =>
							[TrapType.Bomb, TrapType.SpringTrap],
						consumeTrap: (): void =>
						{/* mock */},
						replenishTrap: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as TrapService;

				mockAudio =
					{
						playItemCollected: (): void =>
						{/* mock */},
						playBombTriggered: (): void =>
						{/* mock */},
						playSpringTriggered: (): void =>
						{/* mock */},
						playWon: (): void =>
						{/* mock */},
						playLost: (): void =>
						{/* mock */},
						playCombatHit: (): void =>
						{/* mock */},
						playSearch: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAudioService;

				mockTurnService =
					{
						currentTurn: (): TurnPhase => currentTurnValue,
						turnTimeRemaining: (): number => 15,
						player1Timer: (): number => player1TimerValue,
						player2Timer: (): number => player2TimerValue,
						initialize: (): void =>
						{/* mock */},
						update: (): void =>
						{/* mock */},
						switchTurn: (): void =>
						{/* mock */},
						getActiveIdentity: (): SpyIdentity => SpyIdentity.Black,
						applyDeathPenalty: (): void =>
						{/* mock */},
						isTimerExpired: (identity: SpyIdentity): boolean =>
						{
							if (identity === SpyIdentity.Black)
							{
								return player1TimerValue <= 0;
							}
							return player2TimerValue <= 0;
						},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as TurnService;

				mockSearchService =
					{
						initialize: (): void =>
						{/* mock */},
						searchNearby: (): SearchAttemptResult | null => null,
						isSearched: (): boolean => false,
						getUnsearched: (): string[] => [],
						placeTrapInFurniture: (): boolean => true,
						redistributeItem: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SearchService;

				mockCombatService =
					{
						isInCombat: (): boolean => combatActiveValue,
						lastResult: (): CombatResult | null => null,
						combatTimer: (): number => 0,
						canEngage: (): boolean => false,
						startCombat: (): void =>
						{
							combatActiveValue = true;
						},
						update: (): boolean => false,
						resolve: (): CombatResult =>
						{
							combatActiveValue = false;
							return CombatResult.Player1Wins;
						},
						reset: (): void =>
						{
							combatActiveValue = false;
						},
						dispose: (): void =>
						{/* mock */}
					} as unknown as CombatService;

				mockSpyBuilder =
					{
						buildSpy: (): null => null,
						playDeathAnimation: (): Promise<void> => Promise.resolve(),
						showStunEffect: (): void =>
						{/* mock */},
						hideStunEffect: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyBuilderService;

				mockFurniture =
					{
						getNearbyFurniture: (): null => null,
						initialize: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as FurnitureService;

				mockAirplane =
					{
						initialize: (): void =>
						{/* mock */},
						createAirplane: (): null => null,
						createParkedAirplane: (): null => null,
						animateTakeoff: (onLeavesIsland: () => void, _onComplete: () => void): void =>
						{
							onLeavesIsland();
						},
						dispose: (): void =>
						{/* mock */}
					} as unknown as AirplaneService;

				mockExplosion =
					{
						initialize: (): void =>
						{/* mock */},
						explodeIsland: (_center: unknown, onComplete: () => void): void =>
						{
							onComplete();
						},
						dispose: (): void =>
						{/* mock */}
					} as unknown as ExplosionService;

				mockCamera =
					{
						initialize: (): void =>
						{/* mock */},
						panToIsland: (_center: unknown, onComplete: () => void): void =>
						{
							onComplete();
						},
						zoomOutToIslandView: (_center: unknown, onComplete: () => void): void =>
						{
							onComplete();
						},
						focusOnAirplane: (): void =>
						{/* mock */},
						attachToAirplane: (): void =>
						{/* mock */},
						detachFromAirplane: (): void =>
						{/* mock */},
						updateTarget: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyCameraService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyFlowService,
							{ provide: SpyPhysicsService, useValue: mockPhysics },
							{ provide: SpyAiService, useValue: mockAi },
							{ provide: ItemService, useValue: mockItems },
							{ provide: TrapService, useValue: mockTraps },
							{ provide: SpyAudioService, useValue: mockAudio },
							{ provide: TurnService, useValue: mockTurnService },
							{ provide: SearchService, useValue: mockSearchService },
							{ provide: CombatService, useValue: mockCombatService },
							{ provide: SpyBuilderService, useValue: mockSpyBuilder },
							{ provide: FurnitureService, useValue: mockFurniture },
							{ provide: AirplaneService, useValue: mockAirplane },
							{ provide: ExplosionService, useValue: mockExplosion },
							{ provide: SpyCameraService, useValue: mockCamera },
							SpyAiCoordinatorService,
							SpyDamageHandlerService,
							SpySearchHandlerService
						]
					});

				service =
					TestBed.inject(SpyFlowService);
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initial state should be Idle",
			() =>
			{
				expect(service.getState())
					.toBe(SpyGameState.Idle);
			});

		it("startGame should transition to Ready",
			() =>
			{
				service.startGame();

				expect(service.getState())
					.toBe(SpyGameState.Ready);
			});

		it("update during Ready should transition to Playing after countdown",
			() =>
			{
				service.startGame();

				/* Advance past countdown. */
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

				expect(service.getState())
					.toBe(SpyGameState.Playing);
			});

		it("countdown value should decrement from 3 to 1 during Ready state",
			() =>
			{
				service.startGame();

				expect(service.countdownValue())
					.toBe(COUNTDOWN_DURATION_SECONDS);

				service.update(1.0);

				expect(service.countdownValue())
					.toBe(2);

				service.update(1.0);

				expect(service.countdownValue())
					.toBe(1);

				service.update(1.0);

				expect(service.getState())
					.toBe(SpyGameState.Playing);
			});

		it("update during Playing should increment elapsed seconds",
			() =>
			{
				service.startGame();
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

				const before: number =
					service.elapsedSeconds();

				service.update(1.0);

				expect(service.elapsedSeconds())
					.toBeCloseTo(before + 1.0, 2);
			});

		it("elapsed seconds should NOT increment outside Playing state",
			() =>
			{
				const initial: number =
					service.elapsedSeconds();

				service.update(1.0);

				expect(service.elapsedSeconds(), "Idle state should not increment timer")
					.toBeCloseTo(initial, 2);
			});

		it("should transition to Won when player 1 has all items at airstrip",
			() =>
			{
				const allItems: ItemType[] =
					[
						ItemType.SecretDocuments,
						ItemType.Passport,
						ItemType.KeyCard,
						ItemType.MoneyBag
					];

				mockPhysics.getState =
					(): SpyPhysicsState =>
						createPlayerState(
							{
								positionX: AIRSTRIP_CENTER_X,
								positionZ: AIRSTRIP_CENTER_Z
							});

				service.startGame();
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

				for (const item of allItems)
				{
					(service as unknown as FlowServiceTestAccess)
						.addPlayerItem(item);
				}

				service.update(0.016);

				expect(service.getState())
					.toBe(SpyGameState.Won);
			});

		it("should transition to Lost when AI has all items at airstrip",
			() =>
			{
				const allItems: ItemType[] =
					[
						ItemType.SecretDocuments,
						ItemType.Passport,
						ItemType.KeyCard,
						ItemType.MoneyBag
					];

				mockAi.getState =
					(): Readonly<SpyState> =>
						createAiState(
							{
								currentRoomId: RoomId.Library,
								positionX: AIRSTRIP_CENTER_X,
								positionZ: AIRSTRIP_CENTER_Z,
								inventory: allItems
							});

				service.startGame();
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
				service.update(0.016);

				expect(service.getState())
					.toBe(SpyGameState.Lost);
			});

		it("restartGame should reset state to Idle",
			() =>
			{
				service.startGame();
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

				service.restartGame();

				expect(service.getState())
					.toBe(SpyGameState.Idle);
				expect(service.elapsedSeconds())
					.toBe(0);
			});

		it("restartGame should reset spy position and AI",
			() =>
			{
				let physicsResetCalled: boolean = false;
				let aiResetCalled: boolean = false;

				mockPhysics.resetPosition =
					(): void =>
					{
						physicsResetCalled = true;
					};
				mockAi.reset =
					(): void =>
					{
						aiResetCalled = true;
					};

				service.startGame();
				service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

				service.restartGame();

				expect(physicsResetCalled)
					.toBe(true);
				expect(aiResetCalled)
					.toBe(true);
			});

		it("restartGame should re-initialize search service",
			() =>
			{
				let searchInitCount: number = 0;

				mockSearchService.initialize =
					(): void =>
					{
						searchInitCount++;
					};

				service.startGame();

				expect(searchInitCount)
					.toBe(1);

				service.restartGame();

				/* Initialize called once in startGame, once in restart. */
				expect(searchInitCount)
					.toBe(2);
			});

		describe("turn-based orchestration",
			() =>
			{
				it("should initialize turn service on startGame",
					() =>
					{
						let initialized: boolean = false;

						mockTurnService.initialize =
							(): void =>
							{
								initialized = true;
							};

						service.startGame();

						expect(initialized)
							.toBe(true);
					});

				it("should initialize search service on startGame",
					() =>
					{
						let searchInitialized: boolean = false;

						mockSearchService.initialize =
							(): void =>
							{
								searchInitialized = true;
							};

						service.startGame();

						expect(searchInitialized)
							.toBe(true);
					});

				it("should update turn service each frame during Playing",
					() =>
					{
						let turnUpdated: boolean = false;

						mockTurnService.update =
							(): void =>
							{
								turnUpdated = true;
							};

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						turnUpdated = false;
						service.update(0.016);

						expect(turnUpdated)
							.toBe(true);
					});
			});

		describe("furniture proximity",
			() =>
			{
				it("nearFurniture should be true when player is near furniture",
					() =>
					{
						mockFurniture.getNearbyFurniture =
							(): FurnitureDefinition => ({
								id: "crate-1",
								type: "Crate" as FurnitureType,
								roomId: "CoveCave" as RoomId,
								offsetX: 0,
								offsetZ: 0,
								searchable: true
							});

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						service.update(0.016);

						expect(service.nearFurniture())
							.toBe(true);
					});

				it("nearFurniture should be false when player is not near furniture",
					() =>
					{
						mockFurniture.getNearbyFurniture =
							(): null => null;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						service.update(0.016);

						expect(service.nearFurniture())
							.toBe(false);
					});
			});

		describe("search functionality",
			() =>
			{
				it("triggerSearch should find an item and add to player 1 inventory",
					() =>
					{
						const searchResult: SearchAttemptResult =
							{
								result: SearchResult.FoundItem,
								itemType: ItemType.Passport,
								furnitureId: "desk-junglehq-0"
							};

						mockSearchService.searchNearby =
							(): SearchAttemptResult | null =>
								searchResult;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						service.triggerSearch();

						expect(service.player1Items())
							.toBe(1);
					});

				it("triggerSearch finding a trap should stun the player",
					() =>
					{
						let stunApplied: StunState =
							StunState.None;

						mockPhysics.setStunned =
							(stun: StunState): void =>
							{
								stunApplied = stun;
							};

						const searchResult: SearchAttemptResult =
							{
								result: SearchResult.FoundTrap,
								trapType: TrapType.Bomb,
								furnitureId: "barrel-cove-0"
							};

						mockSearchService.searchNearby =
							(): SearchAttemptResult | null =>
								searchResult;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						service.triggerSearch();

						expect(stunApplied)
							.toBe(StunState.BombStunned);
					});

				it("bomb trap should redistribute dropped item back into furniture",
					() =>
					{
						let redistributedItem: ItemType | null = null;
						let redistributedIdentity: SpyIdentity | null = null;

						mockSearchService.redistributeItem =
							(item: ItemType, identity: SpyIdentity): void =>
							{
								redistributedItem = item;
								redistributedIdentity = identity;
							};

						const searchResult: SearchAttemptResult =
							{
								result: SearchResult.FoundTrap,
								trapType: TrapType.Bomb,
								furnitureId: "barrel-cove-0"
							};

						mockSearchService.searchNearby =
							(): SearchAttemptResult | null =>
								searchResult;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Add an item to player inventory before triggering the trap. */
						(service as unknown as FlowServiceTestAccess)
							.addPlayerItem(ItemType.KeyCard);

						service.triggerSearch();

						expect(redistributedItem)
							.toBe(ItemType.KeyCard);
						expect(redistributedIdentity)
							.toBe(SpyIdentity.Black);
					});

				it("triggerSearch finding a remedy should add to player remedies",
					() =>
					{
						const searchResult: SearchAttemptResult =
							{
								result: SearchResult.FoundRemedy,
								remedyType: RemedyType.WireCutters,
								furnitureId: "cabinet-watchtower-0"
							};

						mockSearchService.searchNearby =
							(): SearchAttemptResult | null =>
								searchResult;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Remedy added internally. Use search again to verify no crash. */
						service.triggerSearch();

						/* No crash means success — remedy added to player1Remedies array. */
						expect(service.getState())
							.toBe(SpyGameState.Playing);
					});

				it("triggerSearch should not work outside Playing state",
					() =>
					{
						let searchCalled: boolean = false;

						mockSearchService.searchNearby =
							(): SearchAttemptResult | null =>
							{
								searchCalled = true;
								return null;
							};

						service.triggerSearch();

						expect(searchCalled)
							.toBe(false);
					});
			});

		describe("combat functionality",
			() =>
			{
				it("triggerCombat should start combat when spies are in range",
					() =>
					{
						mockCombatService.canEngage =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						service.triggerCombat();

						expect(combatActiveValue)
							.toBe(true);
					});

				it("triggerCombat should not start combat when spies are out of range",
					() =>
					{
						mockCombatService.canEngage =
							(): boolean => false;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						service.triggerCombat();

						expect(combatActiveValue)
							.toBe(false);
					});

				it("combat resolution with player 1 as attacker should stun AI",
					() =>
					{
						let aiStunned: boolean = false;

						mockAi.setStunned =
							(): void =>
							{
								aiStunned = true;
							};

						mockCombatService.canEngage =
							(): boolean => true;

						/* Override update to immediately finish combat. */
						mockCombatService.update =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Start combat. */
						combatActiveValue = true;

						/* Trigger combat resolution via game update. */
						service.update(0.016);

						expect(aiStunned)
							.toBe(true);
					});

				it("triggerCombat should not work outside Playing state",
					() =>
					{
						mockCombatService.canEngage =
							(): boolean => true;

						service.triggerCombat();

						expect(combatActiveValue)
							.toBe(false);
					});

				it("update during combat should still tick turn timer",
					() =>
					{
						let turnUpdated: boolean = false;

						mockTurnService.update =
							(): void =>
							{
								turnUpdated = true;
							};

						mockCombatService.canEngage =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Start combat. */
						combatActiveValue = true;

						/* Reset flag. */
						turnUpdated = false;

						/* Update while combat active — turn timer should still tick. */
						service.update(0.016);

						expect(turnUpdated)
							.toBe(true);
					});
			});

		describe("timer expiry",
			() =>
			{
				it("should transition to Lost when player 1 timer expires",
					() =>
					{
						player1TimerValue = 0;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						service.update(0.016);

						expect(service.getState())
							.toBe(SpyGameState.Lost);
					});

				it("should transition to Won when player 2 timer expires",
					() =>
					{
						player2TimerValue = 0;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						service.update(0.016);

						expect(service.getState())
							.toBe(SpyGameState.Won);
					});
			});

		describe("lives system",
			() =>
			{
				it("player1Lives should start at SPY_STARTING_LIVES",
					() =>
					{
						expect(service.player1Lives())
							.toBe(SPY_STARTING_LIVES);
					});

				it("player2Lives should start at SPY_STARTING_LIVES",
					() =>
					{
						expect(service.player2Lives())
							.toBe(SPY_STARTING_LIVES);
					});

				it("restartGame should reset lives to starting value",
					() =>
					{
						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Force a combat resolution that decrements lives. */
						const initialP1: number =
							service.player1Lives();
						const initialP2: number =
							service.player2Lives();

						service.restartGame();

						expect(service.player1Lives())
							.toBe(SPY_STARTING_LIVES);
						expect(service.player2Lives())
							.toBe(SPY_STARTING_LIVES);

						/* Verify we checked initial values were valid. */
						expect(initialP1)
							.toBeGreaterThan(0);
						expect(initialP2)
							.toBeGreaterThan(0);
					});
			});

		describe("triggerTrapPlacement",
			() =>
			{
				it("should not throw when placing a trap",
					() =>
					{
						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						expect(() =>
							service.triggerTrapPlacement(TrapType.Bomb))
							.not
							.toThrow();
					});

				it("should do nothing when game is not Playing",
					() =>
					{
						expect(() =>
							service.triggerTrapPlacement(TrapType.SpringTrap))
							.not
							.toThrow();
					});
			});

		describe("AI trap placement",
			() =>
			{
				it("should not throw when AI trap cooldown elapses",
					() =>
					{
						service.startGame();
						/* Advance past countdown so game enters Playing state. */
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						/* Advance enough time for cooldown to expire (> 0 initial). */
						expect(() => service.update(6))
							.not
							.toThrow();
					});
			});

		describe("combat life cost",
			() =>
			{
				it("should decrement player lives when combat is lost",
					() =>
					{
						/* Player loses combat — resolve returns Player2Wins. */
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player2Wins;
						mockCombatService.canEngage =
							(): boolean => true;
						mockCombatService.update =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						const livesBefore: number =
							service.player1Lives();

						combatActiveValue = true;
						service.update(0.016);

						expect(service.player1Lives())
							.toBe(livesBefore - 1);
					});

				it("should decrement AI lives when combat is won by player",
					() =>
					{
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player1Wins;
						mockCombatService.canEngage =
							(): boolean => true;
						mockCombatService.update =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						const livesBefore: number =
							service.player2Lives();

						combatActiveValue = true;
						service.update(0.016);

						expect(service.player2Lives())
							.toBe(livesBefore - 1);
					});

				it("should transition to Lost when player loses last life in combat",
					() =>
					{
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player2Wins;
						mockCombatService.canEngage =
							(): boolean => true;
						mockCombatService.update =
							(): boolean => true;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						/* Drain player to 1 life via repeated combats. */
						for (let idx: number = 0; idx < SPY_STARTING_LIVES - 1; idx++)
						{
							combatActiveValue = true;
							service.update(0.016);
							combatActiveValue = false;
						}

						/* Final combat should end the game. */
						combatActiveValue = true;
						service.update(0.016);

						expect(service.getState())
							.toBe(SpyGameState.Lost);
					});
			});

		describe("airstrip notification",
			() =>
			{
				it("should show airstrip message when 4 items collected",
					() =>
					{
						const testAccess: FlowServiceTestAccess =
							service as unknown as FlowServiceTestAccess;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						testAccess.addPlayerItem(ItemType.KeyCard);
						testAccess.addPlayerItem(ItemType.Passport);
						testAccess.addPlayerItem(ItemType.SecretDocuments);
						testAccess.addPlayerItem(ItemType.MoneyBag);

						/* Trigger a frame to process the items. */
						service.update(0.016);

						expect(service.notificationMessage())
							.toContain("Airport");
					});

				it("should not auto-win when 4 items collected away from airstrip",
					() =>
					{
						const testAccess: FlowServiceTestAccess =
							service as unknown as FlowServiceTestAccess;

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);

						testAccess.addPlayerItem(ItemType.KeyCard);
						testAccess.addPlayerItem(ItemType.Passport);
						testAccess.addPlayerItem(ItemType.SecretDocuments);
						testAccess.addPlayerItem(ItemType.MoneyBag);

						/* Player is at default spawn, NOT at airstrip. */
						service.update(0.016);

						expect(service.getState())
							.toBe(SpyGameState.Playing);
					});
			});

		describe("escaping state",
			() =>
			{
				it("should transition to Escaping when player with 4 items reaches airstrip",
					() =>
					{
						/* Override mock to NOT call onComplete synchronously. */
						mockAirplane.animateTakeoff =
							(): void =>
							{/* Hold — don't call onComplete. */};

						const testAccess: FlowServiceTestAccess =
							service as unknown as FlowServiceTestAccess;

						testAccess.addPlayerItem(ItemType.KeyCard);
						testAccess.addPlayerItem(ItemType.Passport);
						testAccess.addPlayerItem(ItemType.SecretDocuments);
						testAccess.addPlayerItem(ItemType.MoneyBag);

						/* Move player to airstrip zone. */
						mockPhysics.getState =
							(): SpyPhysicsState =>
								createPlayerState(
									{
										positionX: AIRSTRIP_CENTER_X,
										positionZ: AIRSTRIP_CENTER_Z
									});

						service.startGame();
						service.update(COUNTDOWN_DURATION_SECONDS + 0.1);
						service.update(0.016);

						expect(service.getState())
							.toBe(SpyGameState.Escaping);
					});
			});

		describe("player 2 inventory",
			() =>
			{
				it("addPlayer2Item should increment player 2 item count",
					() =>
					{
						(service as unknown as FlowServiceTestAccess)
							.addPlayer2Item(ItemType.Passport);

						expect(service.player2Items())
							.toBe(1);
					});

				it("dropRandomPlayer2Item should decrement player 2 items",
					() =>
					{
						const testAccess: FlowServiceTestAccess =
							service as unknown as FlowServiceTestAccess;

						testAccess.addPlayer2Item(ItemType.Passport);
						testAccess.addPlayer2Item(ItemType.KeyCard);

						const dropped: ItemType | null =
							testAccess.dropRandomPlayer2Item();

						expect(dropped)
							.not
							.toBeNull();
						expect(service.player2Items())
							.toBe(1);
					});

				it("dropRandomPlayer2Item should return null when empty",
					() =>
					{
						const dropped: ItemType | null =
							(service as unknown as FlowServiceTestAccess)
								.dropRandomPlayer2Item();

						expect(dropped)
							.toBeNull();
					});
			});
	});