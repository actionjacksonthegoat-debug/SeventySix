/**
 * Spy vs Spy Game Page component unit tests.
 * Tests game container rendering, canvas integration, HUD visibility,
 * and overlay states tied to SpyFlowService signals.
 */

import { ElementRef, provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BABYLON_ENGINE_OPTIONS } from "@games/shared/constants/engine.constants";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { SpyGameState, TrapType } from "@games/spy-vs-spy/models/spy-vs-spy.models";
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
import { SpyVsSpyGameComponent } from "./spy-vs-spy-game";

describe("SpyVsSpyGameComponent",
	() =>
	{
		let fixture: ComponentFixture<SpyVsSpyGameComponent>;
		let component: SpyVsSpyGameComponent;
		let mockGameStateSignal: WritableSignal<SpyGameState>;
		let mockElapsedSecondsSignal: WritableSignal<number>;
		let mockPlayerItemCountSignal: WritableSignal<number>;
		let mockPlayer1ItemsSignal: WritableSignal<number>;
		let mockPlayer2ItemsSignal: WritableSignal<number>;
		let mockIslandTimerSignal: WritableSignal<number>;
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
				mockIslandTimerSignal =
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
						islandTimer: mockIslandTimerSignal.asReadonly(),
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
				component =
					fixture.componentInstance;
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

		it("should display island timer as M:SS",
			() =>
			{
				mockGameStateSignal.set(SpyGameState.Playing);
				mockIslandTimerSignal.set(125);
				fixture.detectChanges();

				const timer: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='island-timer']");

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

		describe("interaction handlers",
			() =>
			{
				it("should start game and play soundtrack",
					() =>
					{
						const startGameSpy =
							vi.spyOn(component["spyFlowService"], "startGame");
						const playSoundtrackSpy =
							vi.spyOn(component["audioService"], "playSoundtrack");

						component.onStartGame();

						expect(startGameSpy)
							.toHaveBeenCalledOnce();
						expect(playSoundtrackSpy)
							.toHaveBeenCalledOnce();
					});

				it("should restart game",
					() =>
					{
						const restartSpy =
							vi.spyOn(component["spyFlowService"], "restartGame");

						component.onRestartGame();

						expect(restartSpy)
							.toHaveBeenCalledOnce();
					});

				it("should trigger search, trap placement, trap cycling, and combat",
					() =>
					{
						const triggerSearchSpy =
							vi.spyOn(component["spyFlowService"], "triggerSearch");
						const triggerTrapPlacementSpy =
							vi.spyOn(component["spyFlowService"], "triggerTrapPlacement");
						const triggerCombatSpy =
							vi.spyOn(component["spyFlowService"], "triggerCombat");
						const preventDefaultSpy = vi.fn();

						component["onSearch"]();
						component["onCycleTrapType"]();
						component["onPlaceTrap"]();
						component["onCycleTrapType"]();
						component["onCombat"]({ preventDefault: preventDefaultSpy } as unknown as Event);

						expect(triggerSearchSpy)
							.toHaveBeenCalledOnce();
						expect(triggerTrapPlacementSpy)
							.toHaveBeenCalledWith(TrapType.SpringTrap);
						expect(component["selectedTrapType"])
							.toBe(TrapType.Bomb);
						expect(triggerCombatSpy)
							.toHaveBeenCalledOnce();
						expect(preventDefaultSpy)
							.toHaveBeenCalledOnce();
					});
			});

		describe("mobile movement",
			() =>
			{
				it("should ignore mobile taps when the game is not playing",
					() =>
					{
						const pickWorldPointSpy =
							vi.spyOn(component as unknown as { pickWorldPointFromTap(clientX: number, clientY: number): { x: number; z: number; } | null; }, "pickWorldPointFromTap");

						component["onMobileTap"]({ clientX: 10, clientY: 20 });

						expect(pickWorldPointSpy)
							.not.toHaveBeenCalled();
					});

				it("should trigger furniture search on mobile tap when near furniture",
					() =>
					{
						mockGameStateSignal.set(SpyGameState.Playing);
						mockNearFurnitureSignal.set(true);
						const triggerSearchSpy =
							vi.spyOn(component["spyFlowService"], "triggerSearch");
						const setMoveTargetSpy =
							vi.spyOn(component["spyPhysics"], "setMoveTarget");

						component["onMobileTap"]({ clientX: 15, clientY: 25 });

						expect(triggerSearchSpy)
							.toHaveBeenCalledOnce();
						expect(setMoveTargetSpy)
							.not.toHaveBeenCalled();
					});

				it("should ignore mobile taps when no world point can be picked",
					() =>
					{
						mockGameStateSignal.set(SpyGameState.Playing);
						const pickWorldPointSpy =
							vi.spyOn(component as unknown as { pickWorldPointFromTap(clientX: number, clientY: number): { x: number; z: number; } | null; }, "pickWorldPointFromTap")
								.mockReturnValue(null);
						const setMoveTargetSpy =
							vi.spyOn(component["spyPhysics"], "setMoveTarget");

						component["onMobileTap"]({ clientX: 30, clientY: 40 });

						expect(pickWorldPointSpy)
							.toHaveBeenCalledOnce();
						expect(setMoveTargetSpy)
							.not.toHaveBeenCalled();
					});

				it("should set a move target from a valid mobile tap",
					() =>
					{
						mockGameStateSignal.set(SpyGameState.Playing);
						const pickWorldPointSpy =
							vi.spyOn(component as unknown as { pickWorldPointFromTap(clientX: number, clientY: number): { x: number; z: number; } | null; }, "pickWorldPointFromTap")
								.mockReturnValue({ x: 120, z: 220 });
						const setMoveTargetSpy =
							vi.spyOn(component["spyPhysics"], "setMoveTarget");
						const resetPositionSpy =
							vi.spyOn(component["spyPhysics"], "resetPosition");

						component["onMobileTap"]({ clientX: 50, clientY: 60 });

						expect(pickWorldPointSpy)
							.toHaveBeenCalledOnce();
						expect(setMoveTargetSpy)
							.toHaveBeenCalledWith(120, 220);
						expect(resetPositionSpy)
							.not.toHaveBeenCalled();
					});

				it("should reset position when a collected-items tap lands on the runway",
					() =>
					{
						mockGameStateSignal.set(SpyGameState.Playing);
						mockAllItemsCollectedSignal.set(true);
						const pickWorldPointSpy =
							vi.spyOn(component as unknown as { pickWorldPointFromTap(clientX: number, clientY: number): { x: number; z: number; } | null; }, "pickWorldPointFromTap")
								.mockReturnValue({ x: 0, z: 0 });
						const runwaySpy =
							vi.spyOn(component as unknown as { isWithinAirstripRunway(positionX: number, positionZ: number): boolean; }, "isWithinAirstripRunway")
								.mockReturnValue(true);
						const resetPositionSpy =
							vi.spyOn(component["spyPhysics"], "resetPosition");

						component["onMobileTap"]({ clientX: 75, clientY: 85 });

						expect(pickWorldPointSpy)
							.toHaveBeenCalledOnce();
						expect(runwaySpy)
							.toHaveBeenCalledWith(0, 0);
						expect(resetPositionSpy)
							.toHaveBeenCalledWith(0, 0);
					});
			});

		describe("private helpers",
			() =>
			{
				it("should classify timer warning states",
					() =>
					{
						expect(component["getTimerWarningClass"](20))
							.toBe("timer-danger");
						expect(component["getTimerWarningClass"](45))
							.toBe("timer-warning");
						expect(component["getTimerWarningClass"](120))
							.toBe("timer-ok");
					});

				it("should pick world points only for valid scene hits",
					() =>
					{
						component["scene"] = null;

						expect(component["pickWorldPointFromTap"](1, 2))
							.toBeNull();

						component["scene"] =
							{
								pick: vi.fn().mockReturnValue({ hit: false, pickedPoint: null })
							} as unknown as typeof component["scene"];

						expect(component["pickWorldPointFromTap"](3, 4))
							.toBeNull();

						component["scene"] =
							{
								pick: vi.fn().mockReturnValue({ hit: true, pickedPoint: { x: 12, z: 34 } })
							} as unknown as typeof component["scene"];

						expect(component["pickWorldPointFromTap"](5, 6))
							.toEqual({ x: 12, z: 34 });
					});

				it("should initialize the minimap only once",
					() =>
					{
						const canvasElement: HTMLCanvasElement =
							document.createElement("canvas");
						const canvasRef: ElementRef<HTMLCanvasElement> =
							{ nativeElement: canvasElement } as ElementRef<HTMLCanvasElement>;
						const initializeSpy =
							vi.spyOn(component["minimapService"], "initialize");
						component["minimapCanvas"] =
							vi.fn().mockReturnValue(canvasRef);

						component["initializeMinimapIfNeeded"]();
						component["initializeMinimapIfNeeded"]();

						expect(initializeSpy)
							.toHaveBeenCalledOnce();
					});

				it("should dispose all owned services during cleanup",
					() =>
					{
						const restartSpy =
							vi.spyOn(component["spyFlowService"], "restartGame");
						const gameLoopDisposeSpy =
							vi.spyOn(component["gameLoop"], "dispose");
						const inputDisposeSpy =
							vi.spyOn(component["inputService"], "dispose");
						const aiDisposeSpy =
							vi.spyOn(component["spyAi"], "dispose");
						const physicsDisposeSpy =
							vi.spyOn(component["spyPhysics"], "dispose");
						const itemDisposeSpy =
							vi.spyOn(component["itemService"], "dispose");
						const trapDisposeSpy =
							vi.spyOn(component["trapService"], "dispose");
						const audioDisposeSpy =
							vi.spyOn(component["audioService"], "dispose");
						const builderDisposeSpy =
							vi.spyOn(component["spyBuilder"], "dispose");
						const cameraDisposeSpy =
							vi.spyOn(component["spyCamera"], "dispose");
						const furnitureDisposeSpy =
							vi.spyOn(component["furnitureService"], "dispose");
						const islandDisposeSpy =
							vi.spyOn(component["islandScene"], "dispose");
						const minimapDisposeSpy =
							vi.spyOn(component["minimapService"], "dispose");

						component["cleanup"]();

						expect(restartSpy)
							.toHaveBeenCalledOnce();
						expect(gameLoopDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(inputDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(aiDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(physicsDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(itemDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(trapDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(audioDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(builderDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(cameraDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(furnitureDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(islandDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(minimapDisposeSpy)
							.toHaveBeenCalledOnce();
					});
			});
	});