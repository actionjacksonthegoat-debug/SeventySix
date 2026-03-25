/**
 * Spy vs Spy Game Page component unit tests.
 * Tests game container rendering, canvas integration, HUD visibility,
 * and overlay states tied to SpyFlowService signals.
 */

import { provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BABYLON_ENGINE_OPTIONS } from "@games/shared/constants/engine.constants";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { SpyGameState, TurnPhase } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { AirplaneService } from "@games/spy-vs-spy/services/airplane.service";
import { CombatService } from "@games/spy-vs-spy/services/combat.service";
import { ExplosionService } from "@games/spy-vs-spy/services/explosion.service";
import { FurnitureService } from "@games/spy-vs-spy/services/furniture.service";
import { SpyFlowService } from "@games/spy-vs-spy/services/game-flow.service";
import { IslandDecorationService } from "@games/spy-vs-spy/services/island-decoration.service";
import { IslandEnvironmentService } from "@games/spy-vs-spy/services/island-environment.service";
import { IslandOutdoorService } from "@games/spy-vs-spy/services/island-outdoor.service";
import { IslandSceneService } from "@games/spy-vs-spy/services/island-scene.service";
import { ItemService } from "@games/spy-vs-spy/services/item.service";
import { MinimapService } from "@games/spy-vs-spy/services/minimap.service";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiCoordinatorService } from "@games/spy-vs-spy/services/spy-ai-coordinator.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { SpyBuilderService } from "@games/spy-vs-spy/services/spy-builder.service";
import { SpyCameraService } from "@games/spy-vs-spy/services/spy-camera.service";
import { SpyDamageHandlerService } from "@games/spy-vs-spy/services/spy-damage-handler.service";
import { SpyPathfindingService } from "@games/spy-vs-spy/services/spy-pathfinding.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";
import { TurnService } from "@games/spy-vs-spy/services/turn.service";
import { SpyVsSpyGameComponent } from "./spy-vs-spy-game";

describe("SpyVsSpyGameComponent",
	() =>
	{
		let fixture: ComponentFixture<SpyVsSpyGameComponent>;
		let mockGameStateSignal: WritableSignal<SpyGameState>;
		let mockElapsedSecondsSignal: WritableSignal<number>;
		let mockPlayerItemCountSignal: WritableSignal<number>;
		let mockPlayer1ItemsSignal: WritableSignal<number>;
		let mockPlayer2ItemsSignal: WritableSignal<number>;
		let mockCurrentTurnSignal: WritableSignal<TurnPhase>;
		let mockPlayer1TimerSignal: WritableSignal<number>;
		let mockPlayer2TimerSignal: WritableSignal<number>;
		let mockIsSearchingSignal: WritableSignal<boolean>;
		let mockIsInCombatSignal: WritableSignal<boolean>;
		let mockNotificationMessageSignal: WritableSignal<string>;
		let mockNotificationColorSignal: WritableSignal<string>;
		let mockPlayer1RemedyCountSignal: WritableSignal<number>;
		let mockCountdownValueSignal: WritableSignal<number>;
		let mockNearFurnitureSignal: WritableSignal<boolean>;
		let mockPlayer1LivesSignal: WritableSignal<number>;
		let mockPlayer2LivesSignal: WritableSignal<number>;
		let mockCombatTimerSignal: WritableSignal<number>;
		let mockWinReasonSignal: WritableSignal<string>;
		let mockCurrentRoomSignal: WritableSignal<string>;
		let mockPlayerStunRemainingSignal: WritableSignal<number>;
		let mockAllItemsCollectedSignal: WritableSignal<boolean>;

		beforeEach(
			async () =>
			{
				mockGameStateSignal =
					signal<SpyGameState>(SpyGameState.Idle);
				mockElapsedSecondsSignal =
					signal<number>(0);
				mockPlayerItemCountSignal =
					signal<number>(0);
				mockPlayer1ItemsSignal =
					signal<number>(0);
				mockPlayer2ItemsSignal =
					signal<number>(0);
				mockCurrentTurnSignal =
					signal<TurnPhase>(TurnPhase.Player1);
				mockPlayer1TimerSignal =
					signal<number>(300);
				mockPlayer2TimerSignal =
					signal<number>(300);
				mockIsSearchingSignal =
					signal<boolean>(false);
				mockIsInCombatSignal =
					signal<boolean>(false);
				mockNotificationMessageSignal =
					signal<string>("");
				mockNotificationColorSignal =
					signal<string>("#0f0");
				mockPlayer1RemedyCountSignal =
					signal<number>(0);
				mockCountdownValueSignal =
					signal<number>(3);
				mockNearFurnitureSignal =
					signal<boolean>(false);
				mockPlayer1LivesSignal =
					signal<number>(3);
				mockPlayer2LivesSignal =
					signal<number>(3);
				mockCombatTimerSignal =
					signal<number>(2);
				mockWinReasonSignal =
					signal<string>("");
				mockCurrentRoomSignal =
					signal<string>("");
				mockPlayerStunRemainingSignal =
					signal<number>(0);
				mockAllItemsCollectedSignal =
					signal<boolean>(false);

				const mockSpyFlowService: Partial<SpyFlowService> =
					{
						gameState: mockGameStateSignal.asReadonly(),
						elapsedSeconds: mockElapsedSecondsSignal.asReadonly(),
						playerItemCount: mockPlayerItemCountSignal.asReadonly(),
						player1Items: mockPlayer1ItemsSignal.asReadonly(),
						player2Items: mockPlayer2ItemsSignal.asReadonly(),
						currentTurn: mockCurrentTurnSignal.asReadonly(),
						player1Timer: mockPlayer1TimerSignal.asReadonly(),
						player2Timer: mockPlayer2TimerSignal.asReadonly(),
						isSearching: mockIsSearchingSignal.asReadonly(),
						isInCombat: mockIsInCombatSignal.asReadonly(),
						notificationMessage: mockNotificationMessageSignal.asReadonly(),
						notificationColor: mockNotificationColorSignal.asReadonly(),
						player1RemedyCount: mockPlayer1RemedyCountSignal.asReadonly(),
						countdownValue: mockCountdownValueSignal.asReadonly(),
						nearFurniture: mockNearFurnitureSignal.asReadonly(),
						player1Lives: mockPlayer1LivesSignal.asReadonly(),
						player2Lives: mockPlayer2LivesSignal.asReadonly(),
						combatTimer: mockCombatTimerSignal.asReadonly(),
						winReason: mockWinReasonSignal.asReadonly(),
						currentRoom: mockCurrentRoomSignal.asReadonly(),
						playerStunRemaining: mockPlayerStunRemainingSignal.asReadonly(),
						allItemsCollected: mockAllItemsCollectedSignal.asReadonly(),
						startGame: (): void =>
						{
							/* mock */
						},
						restartGame: (): void =>
						{
							/* mock */
						},
						triggerSearch: (): void =>
						{
							/* mock */
						},
						triggerCombat: (): void =>
						{
							/* mock */
						},
						triggerTrapPlacement: (): void =>
						{
							/* mock */
						},
						initializeVisuals: (): void =>
						{
							/* mock */
						},
						getState: (): SpyGameState =>
							mockGameStateSignal()
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [SpyVsSpyGameComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								AirplaneService,
								BabylonEngineService,
								CombatService,
								ExplosionService,
								FurnitureService,
								GameLoopService,
								InputService,
								IslandDecorationService,
								IslandEnvironmentService,
								IslandOutdoorService,
								IslandSceneService,
								ItemService,
								MinimapService,
								SearchService,
								SpyAiCoordinatorService,
								SpyAiService,
								SpyAudioService,
								SpyBuilderService,
								SpyCameraService,
								SpyDamageHandlerService,
								SpyPathfindingService,
								SpyPhysicsService,
								SpySearchHandlerService,
								TrapService,
								TurnService,
								{
									provide: SpyFlowService,
									useValue: mockSpyFlowService as unknown as SpyFlowService
								},
								{
									provide: BABYLON_ENGINE_OPTIONS,
									useValue: { useNullEngine: true }
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(SpyVsSpyGameComponent);
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render game container",
			() =>
			{
				const container: HTMLElement | null =
					fixture.nativeElement.querySelector(".game-container");

				expect(container)
					.toBeTruthy();
			});

		it("should render babylon canvas",
			() =>
			{
				const canvas: HTMLElement | null =
					fixture.nativeElement.querySelector("app-babylon-canvas");

				expect(canvas)
					.toBeTruthy();
			});

		it("should have spy-vs-spy-canvas data-testid",
			() =>
			{
				const canvasHost: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='spy-vs-spy-canvas']");

				expect(canvasHost)
					.toBeTruthy();
			});

		it("should show start overlay when Idle",
			() =>
			{
				const startOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='start-overlay']");

				expect(startOverlay)
					.toBeTruthy();
			});

		it("should have start-game button when Idle",
			() =>
			{
				const startButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='start-game']");

				expect(startButton)
					.toBeTruthy();
			});

		it("should have back-to-games link when Idle",
			() =>
			{
				const backLink: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='back-to-games']");

				expect(backLink)
					.toBeTruthy();
			});

		it("should show HUD when Playing",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				fixture.detectChanges();

				const hud: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='spy-hud']");

				expect(hud)
					.toBeTruthy();
			});

		it("should show countdown when Ready",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Ready);
				fixture.detectChanges();

				const countdown: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='countdown']");

				expect(countdown)
					.toBeTruthy();
			});

		it("should show won overlay when Won",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Won);
				fixture.detectChanges();

				const wonOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='won-overlay']");

				expect(wonOverlay)
					.toBeTruthy();
			});

		it("should show lost overlay when Lost",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Lost);
				fixture.detectChanges();

				const lostOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='lost-overlay']");

				expect(lostOverlay)
					.toBeTruthy();
			});

		it("should display correct player 1 item count",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				mockPlayer1ItemsSignal.set(2);
				fixture.detectChanges();

				const itemCount: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='p1-item-count']");

				expect(itemCount?.textContent?.trim())
					.toBe("Items: 2 / 4");
			});

		it("should display player 1 timer as M:SS",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				mockPlayer1TimerSignal.set(125);
				fixture.detectChanges();

				const timer: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='p1-timer']");

				expect(timer?.textContent?.trim())
					.toBe("2:05");
			});

		it("should show restart button in Won state",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Won);
				fixture.detectChanges();

				const restartButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='restart-game']");

				expect(restartButton)
					.toBeTruthy();
			});

		it("should show restart button in Lost state",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Lost);
				fixture.detectChanges();

				const restartButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='restart-game']");

				expect(restartButton)
					.toBeTruthy();
			});

		it("should have accessible labels on interactive elements",
			() =>
			{
				const startButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='start-game']");

				expect(startButton?.getAttribute("aria-label"))
					.toBe("Start game");
			});

		it("should display player 1 lives in HUD",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				mockPlayer1LivesSignal.set(2);
				fixture.detectChanges();

				const livesEl: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='p1-lives']");

				expect(livesEl?.textContent?.trim())
					.toBe("\u2665\u2665\u2661");
			});

		it("should display player 2 lives in HUD",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				mockPlayer2LivesSignal.set(1);
				fixture.detectChanges();

				const livesEl: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='p2-lives']");

				expect(livesEl?.textContent?.trim())
					.toBe("\u2665\u2661\u2661");
			});
	});