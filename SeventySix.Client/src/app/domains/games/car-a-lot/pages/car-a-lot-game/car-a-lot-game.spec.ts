/**
 * Car-a-Lot Game Page component unit tests.
 * Tests game container rendering and child component integration.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { KART_GROUND_OFFSET } from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	CharacterType,
	DrivingState,
	JumpResult,
	KartColor,
	RaceState,
	RoadBoundaryResult
} from "@games/car-a-lot/models/car-a-lot.models";
import { BoostService } from "@games/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { CharacterBuilderService } from "@games/car-a-lot/services/character-builder.service";
import { CoinService } from "@games/car-a-lot/services/coin.service";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { BABYLON_ENGINE_OPTIONS } from "@games/shared/constants/engine.constants";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { Mock, vi } from "vitest";
import { CarALotGameComponent } from "./car-a-lot-game";

describe("CarALotGameComponent",
	() =>
	{
		let fixture: ComponentFixture<CarALotGameComponent>;
		let component: CarALotGameComponent;

		function createDrivingState(overrides: Partial<DrivingState> = {}): DrivingState
		{
			return {
				speedMph: 45,
				positionX: 10,
				positionY: 2,
				positionZ: 20,
				rotationY: 0.5,
				isGrounded: true,
				isOnRoad: true,
				currentLap: 1,
				...overrides
			};
		}

		function createBoundaryResult(overrides: Partial<RoadBoundaryResult> = {}): RoadBoundaryResult
		{
			return {
				isOnRoad: true,
				isInBumperZone: false,
				bumperNormalAngle: 0,
				distanceToEdge: 3,
				segmentIndex: 0,
				groundElevation: 1,
				...overrides
			};
		}

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [CarALotGameComponent],
							providers: [
								provideZonelessChangeDetection(),
								BabylonEngineService,
								CharacterBuilderService,
								DrivingPhysicsService,
								InputService,
								KartBuilderService,
								OctopusBossService,
								RaceCameraService,
								RaceSceneService,
								RaceStateService,
								RoadCollisionService,
								TrackBuilderService,
								TrackFeaturesService,
								CoinService,
								BoostService,
								CarALotAudioService,
								GameFlowService,
								GameLoopService,
								{
									provide: BABYLON_ENGINE_OPTIONS,
									useValue: { useNullEngine: true }
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(CarALotGameComponent);
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

		it("should render driving hud",
			() =>
			{
				const hud: HTMLElement | null =
					fixture.nativeElement.querySelector("app-driving-hud");

				expect(hud)
					.toBeTruthy();
			});

		it("should render color selector",
			() =>
			{
				const selector: HTMLElement | null =
					fixture.nativeElement.querySelector("app-color-selector");

				expect(selector)
					.toBeTruthy();
			});

		describe("public handlers",
			() =>
			{
				it("should forward kart color changes to the kart builder",
					() =>
					{
						const setKartColorSpy: Mock =
							vi.spyOn(component["kartBuilder"], "setKartColor");

						component.onKartColorChange(KartColor.Red);

						expect(setKartColorSpy)
							.toHaveBeenCalledWith(KartColor.Red);
					});

				it("should update the selected character without rebuilding rescue assets when scene data is unavailable",
					() =>
					{
						const createRescueSpy: Mock =
							vi.spyOn(component["characterBuilder"], "createRescueCharacter");
						component["scene"] = null;
						component["rescueCharRoot"] = null;

						component.onCharacterChange(CharacterType.Prince);

						expect(createRescueSpy.mock.calls.length)
							.toBe(0);
					});

				it("should rebuild the rescue character when the scene is available",
					() =>
					{
						const oldRescueDisposeSpy: Mock =
							vi.fn();
						const newRescueRoot: { position: Vector3; } =
							{ position: Vector3.Zero() };
						const createRescueSpy: Mock =
							vi
								.spyOn(component["characterBuilder"], "createRescueCharacter")
								.mockReturnValue(newRescueRoot as never);

						component["scene"] =
							{} as typeof component["scene"];
						component["rescueCenter"] =
							new Vector3(5, 0, 10);
						component["rescueCharRoot"] =
							{
								dispose: oldRescueDisposeSpy
							} as unknown as typeof component["rescueCharRoot"];

						component.onCharacterChange(CharacterType.Princess);

						expect(oldRescueDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(createRescueSpy)
							.toHaveBeenCalledOnce();
						expect(component["rescueCharRoot"])
							.toBe(newRescueRoot);
					});

				it("should reset race state and rebuild start assets when starting a game",
					() =>
					{
						const resetRaceSpy: Mock =
							vi.spyOn(component["raceState"], "reset");
						const resetPhysicsSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "reset");
						const resetBoostSpy: Mock =
							vi.spyOn(component["boostService"], "reset");
						const resetCoinsSpy: Mock =
							vi.spyOn(component["coinService"], "reset");
						const setCharacterTypeSpy: Mock =
							vi.spyOn(component["characterBuilder"], "setCharacterType");
						const startCountdownSpy: Mock =
							vi.spyOn(component["raceState"], "startCountdown");
						const playCountdownSpy: Mock =
							vi.spyOn(component["audioService"], "playCountdownBing");
						const createRescueSpy: Mock =
							vi
								.spyOn(component["characterBuilder"], "createRescueCharacter")
								.mockReturnValue({ position: Vector3.Zero() } as never);
						vi
							.spyOn(component["raceState"], "characterType")
							.mockReturnValue(CharacterType.Prince);

						component["scene"] =
							{} as typeof component["scene"];
						component["rescueCenter"] =
							new Vector3(2, 0, 3);
						component["rescueCharRoot"] =
							{ dispose: vi.fn() } as unknown as typeof component["rescueCharRoot"];
						component["kartRoot"] =
							{
								position: new Vector3(99, 99, 99),
								rotation: { y: 5 }
							} as unknown as typeof component["kartRoot"];

						component.onStartGame();

						expect(resetRaceSpy)
							.toHaveBeenCalledOnce();
						expect(resetPhysicsSpy)
							.toHaveBeenCalledOnce();
						expect(resetBoostSpy)
							.toHaveBeenCalledOnce();
						expect(resetCoinsSpy)
							.toHaveBeenCalledOnce();
						expect(component["kartRoot"]?.position)
							.toEqual(new Vector3(0, KART_GROUND_OFFSET, 0));
						expect(component["kartRoot"]?.rotation.y)
							.toBe(0);
						expect(setCharacterTypeSpy)
							.toHaveBeenCalledWith(CharacterType.Prince);
						expect(createRescueSpy)
							.toHaveBeenCalledOnce();
						expect(startCountdownSpy)
							.toHaveBeenCalledOnce();
						expect(component["lastCountdownValue"])
							.toBe(3);
						expect(playCountdownSpy)
							.toHaveBeenCalledWith(false);
					});
			});

		describe("branch-heavy private methods",
			() =>
			{
				it("should return false when countdown handling is inactive",
					() =>
					{
						vi
							.spyOn(component["raceState"], "isCountdownActive")
							.mockReturnValue(false);

						expect(component["handleCountdown"](0.5, RaceState.Racing))
							.toBe(false);
					});

				it("should transition from countdown to racing when the countdown completes",
					() =>
					{
						const playCountdownSpy: Mock =
							vi.spyOn(component["audioService"], "playCountdownBing");
						const transitionSpy: Mock =
							vi.spyOn(component["raceState"], "transitionTo");
						const startEngineSpy: Mock =
							vi.spyOn(component["audioService"], "startEngine");
						const startMusicSpy: Mock =
							vi.spyOn(component["audioService"], "startMusic");
						const updateCameraSpy: Mock =
							vi.spyOn(component["raceCamera"], "updateCamera");
						vi
							.spyOn(component["raceState"], "isCountdownActive")
							.mockReturnValue(true);
						vi
							.spyOn(component["raceState"], "countdownValue")
							.mockReturnValue(1);
						vi
							.spyOn(component["raceState"], "tickCountdown")
							.mockReturnValue(true);
						component["kartRoot"] =
							{
								position: new Vector3(1, 2, 3),
								rotation: { y: 0.75 }
							} as unknown as typeof component["kartRoot"];

						expect(component["handleCountdown"](0.25, RaceState.Countdown))
							.toBe(true);
						expect(playCountdownSpy)
							.toHaveBeenCalledWith(true);
						expect(transitionSpy)
							.toHaveBeenCalledWith(RaceState.Racing);
						expect(startEngineSpy)
							.toHaveBeenCalledOnce();
						expect(startMusicSpy)
							.toHaveBeenCalledOnce();
						expect(updateCameraSpy)
							.toHaveBeenCalledOnce();
					});

				it("should play countdown ticks when the countdown value changes",
					() =>
					{
						const playCountdownSpy: Mock =
							vi.spyOn(component["audioService"], "playCountdownBing");
						vi
							.spyOn(component["raceState"], "isCountdownActive")
							.mockReturnValue(true);
						vi
							.spyOn(component["raceState"], "countdownValue")
							.mockReturnValueOnce(3)
							.mockReturnValueOnce(2);
						vi
							.spyOn(component["raceState"], "tickCountdown")
							.mockReturnValue(false);

						expect(component["handleCountdown"](0.25, RaceState.Countdown))
							.toBe(true);
						expect(playCountdownSpy)
							.toHaveBeenCalledWith(false);
						expect(component["lastCountdownValue"])
							.toBe(2);
					});

				it("should show the victory character only once on the first victory frame",
					() =>
					{
						const showVictorySpy: Mock =
							vi
								.spyOn(component["characterBuilder"], "showVictoryStanding")
								.mockImplementation((): void => undefined);
						component["scene"] =
							{} as typeof component["scene"];
						component["kartRoot"] =
							{
								position: new Vector3(9, 8, 7)
							} as unknown as typeof component["kartRoot"];

						component["showVictoryCharacterOnFirstFrame"](RaceState.Victory);
						component["showVictoryCharacterOnFirstFrame"](RaceState.Victory);

						expect(showVictorySpy)
							.toHaveBeenCalledOnce();
					});

				it("should update physics with live input while racing and apply mesh state",
					() =>
					{
						const boundary: RoadBoundaryResult =
							createBoundaryResult(
								{ groundElevation: 4 });
						const state: DrivingState =
							createDrivingState();
						const updateSpy: Mock =
							vi
								.spyOn(component["drivingPhysics"], "update")
								.mockReturnValue(state);
						vi
							.spyOn(component["roadCollision"], "checkRoadBoundary")
							.mockReturnValue(boundary);
						component["inputService"].keys =
							{ ArrowUp: true };
						component["kartRoot"] =
							{
								position: new Vector3(0, 0, 0),
								rotation: { y: 0 }
							} as unknown as typeof component["kartRoot"];

						const returnedState: DrivingState =
							component["updatePhysics"](0.16, RaceState.Racing);

						expect(updateSpy)
							.toHaveBeenCalledWith(
								{ ArrowUp: true },
								0.16,
								4);
						expect(returnedState)
							.toBe(state);
						expect(component["kartRoot"]?.position)
							.toEqual(new Vector3(state.positionX, state.positionY, state.positionZ));
						expect(component["kartRoot"]?.rotation.y)
							.toBe(state.rotationY);
					});

				it("should suppress live input while not racing",
					() =>
					{
						const updateSpy: Mock =
							vi
								.spyOn(component["drivingPhysics"], "update")
								.mockReturnValue(createDrivingState());
						vi
							.spyOn(component["roadCollision"], "checkRoadBoundary")
							.mockReturnValue(createBoundaryResult());
						component["inputService"].keys =
							{ ArrowUp: true };

						component["updatePhysics"](0.1, RaceState.Countdown);

						expect(updateSpy)
							.toHaveBeenCalledWith({}, 0.1, 1);
					});

				it("should update visuals and elapsed time during active race phases",
					() =>
					{
						const state: DrivingState =
							createDrivingState();
						const updateElapsedTimeSpy: Mock =
							vi.spyOn(component["raceState"], "updateElapsedTime");
						vi
							.spyOn(component["trackFeatures"], "isInsideTunnel")
							.mockReturnValue(false);
						vi
							.spyOn(component["raceState"], "currentState")
							.mockReturnValue(RaceState.Rescue);

						component["updateVisuals"](state, 0.2);

						expect(updateElapsedTimeSpy)
							.toHaveBeenCalledWith(0.2);
					});

				it("should avoid elapsed time updates outside active race phases",
					() =>
					{
						const state: DrivingState =
							createDrivingState();
						const updateElapsedTimeSpy: Mock =
							vi.spyOn(component["raceState"], "updateElapsedTime");
						vi
							.spyOn(component["trackFeatures"], "isInsideTunnel")
							.mockReturnValue(true);
						vi
							.spyOn(component["raceState"], "currentState")
							.mockReturnValue(RaceState.Victory);

						component["updateVisuals"](state, 0.2);

						expect(updateElapsedTimeSpy)
							.not
							.toHaveBeenCalled();
					});

				it("should apply bumper collisions when inside a bumper zone",
					() =>
					{
						const state: DrivingState =
							createDrivingState(
								{ isGrounded: true });
						const boundary: RoadBoundaryResult =
							createBoundaryResult(
								{ isInBumperZone: true, distanceToEdge: 1, bumperNormalAngle: Math.PI / 2 });
						const clampToRoadSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "clampToRoad");
						const applyBounceSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "applyBounce");
						const deactivateBoostSpy: Mock =
							vi.spyOn(component["boostService"], "deactivateBoost");
						const playBumperSpy: Mock =
							vi.spyOn(component["audioService"], "playBumper");

						component["handleCollisions"](state, RaceState.Racing, boundary);

						expect(clampToRoadSpy)
							.toHaveBeenCalledOnce();
						expect(applyBounceSpy)
							.toHaveBeenCalledWith(boundary.bumperNormalAngle, 0);
						expect(deactivateBoostSpy)
							.toHaveBeenCalledOnce();
						expect(playBumperSpy)
							.toHaveBeenCalledOnce();
					});

				it("should trigger game over when leaving the road during racing",
					() =>
					{
						const state: DrivingState =
							createDrivingState(
								{ isGrounded: true });
						const boundary: RoadBoundaryResult =
							createBoundaryResult(
								{ isOnRoad: false, isInBumperZone: false });
						const transitionSpy: Mock =
							vi.spyOn(component["raceState"], "transitionTo");
						const setMaxSpeedSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "setMaxSpeed");
						const stopEngineSpy: Mock =
							vi.spyOn(component["audioService"], "stopEngine");
						const stopMusicSpy: Mock =
							vi.spyOn(component["audioService"], "stopMusic");
						const playGameOverSpy: Mock =
							vi.spyOn(component["audioService"], "playGameOver");

						component["handleCollisions"](state, RaceState.Racing, boundary);

						expect(transitionSpy)
							.toHaveBeenCalledWith(RaceState.GameOver);
						expect(setMaxSpeedSpy)
							.toHaveBeenCalledWith(0);
						expect(stopEngineSpy)
							.toHaveBeenCalledOnce();
						expect(stopMusicSpy)
							.toHaveBeenCalledOnce();
						expect(playGameOverSpy)
							.toHaveBeenCalledOnce();
					});

				it("should skip jump checks inside tunnels and clear temporary speed when no boost is active",
					() =>
					{
						const state: DrivingState =
							createDrivingState();
						const jumpTriggerSpy: Mock =
							vi.spyOn(component["trackFeatures"], "checkJumpTrigger");
						const clearTemporaryMaxSpeedSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "clearTemporaryMaxSpeed");
						vi
							.spyOn(component["trackFeatures"], "isInsideTunnel")
							.mockReturnValue(true);
						vi
							.spyOn(component["coinService"], "checkCollection")
							.mockReturnValue(false);
						vi
							.spyOn(component["boostService"], "checkBoostTrigger")
							.mockReturnValue(false);
						vi
							.spyOn(component["boostService"], "isBoostActive")
							.mockReturnValue(false);

						component["updateItems"](state, 0.3);

						expect(jumpTriggerSpy)
							.not
							.toHaveBeenCalled();
						expect(clearTemporaryMaxSpeedSpy)
							.toHaveBeenCalledOnce();
					});

				it("should apply jump, coin, and boost effects when item triggers occur",
					() =>
					{
						const state: DrivingState =
							createDrivingState();
						const jumpResult: JumpResult =
							{ jumpVelocity: 12, rampIndex: 1 };
						const applyJumpSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "applyJump");
						const playJumpSpy: Mock =
							vi.spyOn(component["audioService"], "playJump");
						const playCoinSpy: Mock =
							vi.spyOn(component["audioService"], "playCoin");
						const playBoostSpy: Mock =
							vi.spyOn(component["audioService"], "playBoost");
						const setTemporaryMaxSpeedSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "setTemporaryMaxSpeed");
						vi
							.spyOn(component["trackFeatures"], "isInsideTunnel")
							.mockReturnValue(false);
						vi
							.spyOn(component["trackFeatures"], "checkJumpTrigger")
							.mockReturnValue(jumpResult);
						vi
							.spyOn(component["coinService"], "checkCollection")
							.mockReturnValue(true);
						vi
							.spyOn(component["boostService"], "checkBoostTrigger")
							.mockReturnValue(true);
						vi
							.spyOn(component["boostService"], "isBoostActive")
							.mockReturnValue(true);
						vi
							.spyOn(component["boostService"], "getEffectiveMaxSpeedMph")
							.mockReturnValue(88);

						component["updateItems"](state, 0.3);

						expect(applyJumpSpy)
							.toHaveBeenCalledWith(12);
						expect(playJumpSpy)
							.toHaveBeenCalledOnce();
						expect(playCoinSpy)
							.toHaveBeenCalledOnce();
						expect(playBoostSpy)
							.toHaveBeenCalledOnce();
						expect(setTemporaryMaxSpeedSpy)
							.toHaveBeenCalledWith(88);
					});

				it("should dispose owned services during cleanup",
					() =>
					{
						const gameLoopDisposeSpy: Mock =
							vi.spyOn(component["gameLoop"], "dispose");
						const coinDisposeSpy: Mock =
							vi.spyOn(component["coinService"], "dispose");
						const boostDisposeSpy: Mock =
							vi.spyOn(component["boostService"], "dispose");
						const octopusDisposeSpy: Mock =
							vi.spyOn(component["octopusBoss"], "dispose");
						const roadDisposeSpy: Mock =
							vi.spyOn(component["roadCollision"], "dispose");
						const trackFeaturesDisposeSpy: Mock =
							vi.spyOn(component["trackFeatures"], "dispose");
						const raceCameraDisposeSpy: Mock =
							vi.spyOn(component["raceCamera"], "dispose");
						const characterDisposeSpy: Mock =
							vi.spyOn(component["characterBuilder"], "dispose");
						const kartDisposeSpy: Mock =
							vi.spyOn(component["kartBuilder"], "dispose");
						const trackBuilderDisposeSpy: Mock =
							vi.spyOn(component["trackBuilder"], "dispose");
						const raceSceneDisposeSpy: Mock =
							vi.spyOn(component["raceScene"], "dispose");
						const resetPhysicsSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "reset");
						const inputDisposeSpy: Mock =
							vi.spyOn(component["inputService"], "dispose");
						const audioDisposeSpy: Mock =
							vi.spyOn(component["audioService"], "dispose");

						component["cleanup"]();

						expect(gameLoopDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(coinDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(boostDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(octopusDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(roadDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(trackFeaturesDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(raceCameraDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(characterDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(kartDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(trackBuilderDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(raceSceneDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(resetPhysicsSpy)
							.toHaveBeenCalledOnce();
						expect(inputDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(audioDisposeSpy)
							.toHaveBeenCalledOnce();
					});
			});
	});