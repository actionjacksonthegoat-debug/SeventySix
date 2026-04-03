import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { BUMPER_WIDTH, MAX_SPEED_MPH, OCTOPUS_JUMP_VELOCITY } from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	DrivingState,
	JumpResult,
	RaceState,
	RoadBoundaryResult,
	RoadSegment
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
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { InputService } from "@games/shared/services/input.service";
import { Mock, vi } from "vitest";

type MockAudioService = {
	playOctopusRumble: Mock;
	playJump: Mock;
	stopEngine: Mock;
	stopMusic: Mock;
	playGameOver: Mock;
	playVictory: Mock;
	playBumper: Mock;
	startEngine: Mock;
	startMusic: Mock;
	updateEngine: Mock;
	playCountdownBing: Mock;
	playCoin: Mock;
	playBoost: Mock;
};

type MockDrivingPhysics = {
	applyJump: Mock;
	setMaxSpeed: Mock;
	clampToRoad: Mock;
	applyBounce: Mock;
	reduceSpeed: Mock;
	setHeading: Mock;
	update: Mock;
	setTemporaryMaxSpeed: Mock;
	clearTemporaryMaxSpeed: Mock;
};

type MockOctopusBoss = {
	checkApproachZone: Mock;
	updateEyeTracking: Mock;
	checkBodyCollision: Mock;
	startJumpAttack: Mock;
	checkGroundCollision: Mock;
	hasCleared: Mock;
	updateJumpAttack: Mock;
	updateAnimation: Mock;
};

type MockRaceState = {
	transitionTo: Mock;
	currentState: Mock;
	isCountdownActive: Mock;
	countdownValue: Mock;
	tickCountdown: Mock;
	updateSpeed: Mock;
	updateElapsedTime: Mock;
};

type MockRoadCollision = {
	checkRoadBoundary: Mock;
};

type MockInputService = {
	keys: Record<string, boolean>;
};

type MockKartBuilder = {
	updateWheels: Mock;
};

type MockCharacterBuilder = {
	updateCapeAnimation: Mock;
	showVictoryStanding: Mock;
};

type MockRaceCamera = {
	updateCamera: Mock;
};

type MockTrackBuilder = {
	getSegments: Mock;
};

type MockTrackFeatures = {
	isInsideTunnel: Mock;
	checkJumpTrigger: Mock;
};

type MockCoinService = {
	checkCollection: Mock;
	updateAnimation: Mock;
};

type MockBoostService = {
	checkBoostTrigger: Mock;
	updateBoost: Mock;
	isBoostActive: Mock;
	getEffectiveMaxSpeedMph: Mock;
	deactivateBoost: Mock;
};

/** Default road segment used in tests. */
const DEFAULT_SEGMENTS: RoadSegment[] =
	[
		{
			positionX: 0,
			positionZ: 0,
			length: 100,
			rotationY: 0,
			isFork: false,
			elevation: 0
		}
	];

/** Default rescue center position used in tests. */
const RESCUE_CENTER: Vector3 =
	new Vector3(10, 0, 300);

function createDrivingState(overrides: Partial<DrivingState> = {}): DrivingState
{
	return {
		speedMph: 45,
		positionX: 0,
		positionY: 0,
		positionZ: 0,
		rotationY: 0,
		isGrounded: true,
		isOnRoad: true,
		currentLap: 1,
		...overrides
	};
}

function createBoundary(overrides: Partial<RoadBoundaryResult> = {}): RoadBoundaryResult
{
	return {
		isOnRoad: true,
		isInBumperZone: false,
		bumperNormalAngle: 0,
		distanceToEdge: 0,
		segmentIndex: 0,
		groundElevation: 0,
		...overrides
	};
}

describe("GameFlowService",
	() =>
	{
		let service: GameFlowService;
		let mockAudioService: MockAudioService;
		let mockDrivingPhysics: MockDrivingPhysics;
		let mockInputService: MockInputService;
		let mockOctopusBoss: MockOctopusBoss;
		let mockRaceState: MockRaceState;
		let mockRoadCollision: MockRoadCollision;
		let mockKartBuilder: MockKartBuilder;
		let mockCharacterBuilder: MockCharacterBuilder;
		let mockRaceCamera: MockRaceCamera;
		let mockTrackBuilder: MockTrackBuilder;
		let mockTrackFeatures: MockTrackFeatures;
		let mockCoinService: MockCoinService;
		let mockBoostService: MockBoostService;
		let mockKartRoot: { position: Vector3; rotation: Vector3; };

		beforeEach(
			() =>
			{
				mockAudioService =
					{
						playOctopusRumble: vi.fn(),
						playJump: vi.fn(),
						stopEngine: vi.fn(),
						stopMusic: vi.fn(),
						playGameOver: vi.fn(),
						playVictory: vi.fn(),
						playBumper: vi.fn(),
						startEngine: vi.fn(),
						startMusic: vi.fn(),
						updateEngine: vi.fn(),
						playCountdownBing: vi.fn(),
						playCoin: vi.fn(),
						playBoost: vi.fn()
					};
				mockDrivingPhysics =
					{
						applyJump: vi.fn(),
						setMaxSpeed: vi.fn(),
						clampToRoad: vi.fn(),
						applyBounce: vi.fn(),
						reduceSpeed: vi.fn(),
						setHeading: vi.fn(),
						update: vi
							.fn()
							.mockReturnValue(createDrivingState()),
						setTemporaryMaxSpeed: vi.fn(),
						clearTemporaryMaxSpeed: vi.fn()
					};
				mockInputService =
					{
						keys: {}
					};
				mockOctopusBoss =
					{
						checkApproachZone: vi
							.fn()
							.mockReturnValue(false),
						updateEyeTracking: vi.fn(),
						checkBodyCollision: vi
							.fn()
							.mockReturnValue(false),
						startJumpAttack: vi.fn(),
						checkGroundCollision: vi
							.fn()
							.mockReturnValue(false),
						hasCleared: vi
							.fn()
							.mockReturnValue(false),
						updateJumpAttack: vi
							.fn()
							.mockReturnValue(
								{ landed: false, position: new Vector3(0, 0, 0) }),
						updateAnimation: vi.fn()
					};
				mockRaceState =
					{
						transitionTo: vi.fn(),
						currentState: vi
							.fn()
							.mockReturnValue(RaceState.Racing),
						isCountdownActive: vi
							.fn()
							.mockReturnValue(false),
						countdownValue: vi
							.fn()
							.mockReturnValue(-1),
						tickCountdown: vi
							.fn()
							.mockReturnValue(false),
						updateSpeed: vi.fn(),
						updateElapsedTime: vi.fn()
					};
				mockRoadCollision =
					{
						checkRoadBoundary: vi
							.fn()
							.mockReturnValue(createBoundary())
					};
				mockKartBuilder =
					{
						updateWheels: vi.fn()
					};
				mockCharacterBuilder =
					{
						updateCapeAnimation: vi.fn(),
						showVictoryStanding: vi.fn()
					};
				mockRaceCamera =
					{
						updateCamera: vi.fn()
					};
				mockTrackBuilder =
					{
						getSegments: vi
							.fn()
							.mockReturnValue(DEFAULT_SEGMENTS)
					};
				mockTrackFeatures =
					{
						isInsideTunnel: vi
							.fn()
							.mockReturnValue(false),
						checkJumpTrigger: vi
							.fn()
							.mockReturnValue(null)
					};
				mockCoinService =
					{
						checkCollection: vi
							.fn()
							.mockReturnValue(false),
						updateAnimation: vi.fn()
					};
				mockBoostService =
					{
						checkBoostTrigger: vi
							.fn()
							.mockReturnValue(false),
						updateBoost: vi.fn(),
						isBoostActive: vi
							.fn()
							.mockReturnValue(false),
						getEffectiveMaxSpeedMph: vi
							.fn()
							.mockReturnValue(MAX_SPEED_MPH),
						deactivateBoost: vi.fn()
					};
				mockKartRoot =
					{
						position: new Vector3(0, 0, 0),
						rotation: new Vector3(0, 0, 0)
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							GameFlowService,
							{ provide: CarALotAudioService, useValue: mockAudioService },
							{ provide: DrivingPhysicsService, useValue: mockDrivingPhysics },
							{ provide: InputService, useValue: mockInputService },
							{ provide: OctopusBossService, useValue: mockOctopusBoss },
							{ provide: RaceStateService, useValue: mockRaceState },
							{ provide: RoadCollisionService, useValue: mockRoadCollision },
							{ provide: KartBuilderService, useValue: mockKartBuilder },
							{ provide: CharacterBuilderService, useValue: mockCharacterBuilder },
							{ provide: RaceCameraService, useValue: mockRaceCamera },
							{ provide: TrackBuilderService, useValue: mockTrackBuilder },
							{ provide: TrackFeaturesService, useValue: mockTrackFeatures },
							{ provide: CoinService, useValue: mockCoinService },
							{ provide: BoostService, useValue: mockBoostService }
						]
					});

				service =
					TestBed.inject(GameFlowService);
				service.initialize(
					10,
					20,
					[
						{
							positionX: 10,
							positionZ: 20,
							length: 10,
							rotationY: 0,
							isFork: false,
							elevation: 0
						}
					]);
				service.setContext(
					{} as Scene,
					mockKartRoot as unknown as TransformNode,
					RESCUE_CENTER);
			});

		describe("state transitions",
			() =>
			{
				it("should transition from racing to octopus phase when approach zone is hit",
					() =>
					{
						mockOctopusBoss.checkApproachZone.mockReturnValue(true);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ positionZ: 150 }));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.OctopusPhase);
						expect(mockAudioService.playOctopusRumble)
							.toHaveBeenCalledOnce();
					});

				it("should jump on space edge during octopus phase when grounded",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusPhase);
						mockInputService.keys[" "] = true;
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: true }));

						service.update(0.016);

						expect(mockDrivingPhysics.applyJump)
							.toHaveBeenCalledWith(OCTOPUS_JUMP_VELOCITY);
						expect(mockAudioService.playJump)
							.toHaveBeenCalledOnce();
					});

				it("should trigger octopus attack transition on body collision while airborne",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusPhase);
						mockOctopusBoss.checkBodyCollision.mockReturnValue(true);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: false }));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.OctopusAttack);
						expect(mockOctopusBoss.startJumpAttack)
							.toHaveBeenCalledOnce();
						expect(mockDrivingPhysics.setMaxSpeed)
							.toHaveBeenCalledWith(0);
						expect(mockAudioService.stopEngine)
							.toHaveBeenCalledOnce();
					});

				it("should trigger game over on octopus ground collision",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusPhase);
						mockOctopusBoss.checkGroundCollision.mockReturnValue(true);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: true }));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.GameOver);
						expect(mockAudioService.playGameOver)
							.toHaveBeenCalled();
					});

				it("should transition to rescue when octopus has been cleared",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusPhase);
						mockOctopusBoss.hasCleared.mockReturnValue(true);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: true }));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.Rescue);
					});

				it("should trigger game over when grounded off-road outside landing road during octopus phase",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusPhase);
						mockRoadCollision.checkRoadBoundary.mockReturnValue(
							createBoundary(
								{ isOnRoad: false }));
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									isGrounded: true,
									positionX: -999,
									positionZ: -999
								}));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.GameOver);
					});

				it("should transition to game over after octopus attack lands",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.OctopusAttack);
						mockOctopusBoss.updateJumpAttack.mockReturnValue(
							{
								landed: true,
								position: new Vector3(0, 0, 0)
							});

						service.update(0.25);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.GameOver);
						expect(mockAudioService.stopMusic)
							.toHaveBeenCalled();
						expect(mockAudioService.playGameOver)
							.toHaveBeenCalled();
					});

				it("should trigger game over in rescue phase when not on landing road",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Rescue);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									isGrounded: true,
									positionX: -100,
									positionZ: -100
								}));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.GameOver);
					});

				it("should apply bumper response when in landing road bumper zone",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Rescue);
						const bumperBoundary: RoadBoundaryResult =
							createBoundary(
								{
									isInBumperZone: true,
									distanceToEdge: 1,
									bumperNormalAngle: 0
								});

						// Pre-check and post-check use main-track segments (no bumper).
						// Landing road check uses landing-road segments (bumper hit).
						mockRoadCollision
							.checkRoadBoundary
							.mockReturnValueOnce(createBoundary())
							.mockReturnValueOnce(createBoundary())
							.mockReturnValue(bumperBoundary);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									isGrounded: true,
									positionX: 10,
									positionZ: 25
								}));

						service.update(0.016);

						const expectedPushDistance: number =
							BUMPER_WIDTH - bumperBoundary.distanceToEdge + 0.5;

						expect(mockDrivingPhysics.clampToRoad)
							.toHaveBeenCalledWith(0, expectedPushDistance);
						expect(mockDrivingPhysics.applyBounce)
							.toHaveBeenCalledWith(0, 0);
						expect(mockAudioService.playBumper)
							.toHaveBeenCalledOnce();
					});

				it("should transition to victory near rescue center and play victory audio",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Rescue);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									isGrounded: true,
									positionX: RESCUE_CENTER.x,
									positionZ: RESCUE_CENTER.z
								}));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.Victory);
						expect(mockAudioService.stopEngine)
							.toHaveBeenCalled();
						expect(mockAudioService.stopMusic)
							.toHaveBeenCalled();
						expect(mockAudioService.playVictory)
							.toHaveBeenCalled();
					});

				it("should apply victory deceleration and heading steering",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									positionX: 0,
									positionZ: 0,
									rotationY: 0
								}));

						service.update(0.1);

						expect(mockDrivingPhysics.reduceSpeed)
							.toHaveBeenCalledOnce();
						expect(mockDrivingPhysics.setHeading)
							.toHaveBeenCalledOnce();
					});
			});

		describe("countdown orchestration",
			() =>
			{
				it("should skip physics and visuals during countdown",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Countdown);
						mockRaceState.isCountdownActive.mockReturnValue(true);

						service.update(0.016);

						expect(mockDrivingPhysics.update)
							.not
							.toHaveBeenCalled();
						expect(mockKartBuilder.updateWheels)
							.not
							.toHaveBeenCalled();
					});

				it("should transition to racing and start audio when countdown completes",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Countdown);
						mockRaceState.isCountdownActive.mockReturnValue(true);
						mockRaceState
							.countdownValue
							.mockReturnValue(1);
						mockRaceState.tickCountdown.mockReturnValue(true);

						service.update(0.25);

						expect(mockAudioService.playCountdownBing)
							.toHaveBeenCalledWith(true);
						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.Racing);
						expect(mockAudioService.startEngine)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.startMusic)
							.toHaveBeenCalledOnce();
					});

				it("should play bing and update camera during countdown tick",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Countdown);
						mockRaceState.isCountdownActive.mockReturnValue(true);
						mockRaceState
							.countdownValue
							.mockReturnValueOnce(3)
							.mockReturnValueOnce(2);
						mockRaceState.tickCountdown.mockReturnValue(false);

						service.update(0.25);

						expect(mockAudioService.playCountdownBing)
							.toHaveBeenCalledWith(false);
						expect(mockRaceCamera.updateCamera)
							.toHaveBeenCalledOnce();
					});
			});

		describe("physics orchestration",
			() =>
			{
				it("should pass live input keys when racing",
					() =>
					{
						mockInputService.keys =
							{ ArrowUp: true };

						service.update(0.016);

						expect(mockDrivingPhysics.update)
							.toHaveBeenCalledWith(
								{ ArrowUp: true },
								0.016,
								expect.any(Number));
					});

				it("should suppress input when not racing",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);
						mockInputService.keys =
							{ ArrowUp: true };

						service.update(0.016);

						expect(mockDrivingPhysics.update)
							.toHaveBeenCalledWith({}, 0.016, expect.any(Number));
					});

				it("should update kartRoot position from physics state",
					() =>
					{
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{
									positionX: 5,
									positionY: 1,
									positionZ: 12,
									rotationY: 0.75
								}));

						service.update(0.016);

						expect(mockKartRoot.position)
							.toEqual(new Vector3(5, 1, 12));
						expect(mockKartRoot.rotation.y)
							.toBe(0.75);
					});
			});

		describe("visual updates",
			() =>
			{
				it("should call wheel and cape animation each frame",
					() =>
					{
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ speedMph: 60 }));

						service.update(0.016);

						expect(mockKartBuilder.updateWheels)
							.toHaveBeenCalledWith(60, 0.016);
						expect(mockCharacterBuilder.updateCapeAnimation)
							.toHaveBeenCalledWith(60, 0.016);
					});

				it("should track elapsed time during active race phases",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Racing);

						service.update(0.2);

						expect(mockRaceState.updateElapsedTime)
							.toHaveBeenCalledWith(0.2);
					});

				it("should skip elapsed time during non-active phases",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);

						service.update(0.2);

						expect(mockRaceState.updateElapsedTime)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("collision handling",
			() =>
			{
				it("should apply bumper pushback and deactivate boost on wall hit",
					() =>
					{
						mockRoadCollision.checkRoadBoundary.mockReturnValue(
							createBoundary(
								{
									isInBumperZone: true,
									distanceToEdge: 1,
									bumperNormalAngle: Math.PI / 2
								}));
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: true }));

						service.update(0.016);

						expect(mockDrivingPhysics.clampToRoad)
							.toHaveBeenCalledOnce();
						expect(mockDrivingPhysics.applyBounce)
							.toHaveBeenCalledWith(Math.PI / 2, 0);
						expect(mockBoostService.deactivateBoost)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.playBumper)
							.toHaveBeenCalledOnce();
					});

				it("should trigger game over when leaving the road during racing",
					() =>
					{
						mockRoadCollision.checkRoadBoundary.mockReturnValue(
							createBoundary(
								{ isOnRoad: false, isInBumperZone: false }));
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ isGrounded: true }));

						service.update(0.016);

						expect(mockRaceState.transitionTo)
							.toHaveBeenCalledWith(RaceState.GameOver);
						expect(mockDrivingPhysics.setMaxSpeed)
							.toHaveBeenCalledWith(0);
						expect(mockAudioService.stopEngine)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.stopMusic)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.playGameOver)
							.toHaveBeenCalledOnce();
					});
			});

		describe("item processing",
			() =>
			{
				it("should skip jump checks inside tunnels",
					() =>
					{
						mockTrackFeatures.isInsideTunnel.mockReturnValue(true);

						service.update(0.016);

						expect(mockTrackFeatures.checkJumpTrigger)
							.not
							.toHaveBeenCalled();
					});

				it("should apply jump, coin, and boost effects when triggers occur",
					() =>
					{
						const jumpResult: JumpResult =
							{ jumpVelocity: 12, rampIndex: 1 };
						mockTrackFeatures.checkJumpTrigger.mockReturnValue(jumpResult);
						mockCoinService.checkCollection.mockReturnValue(true);
						mockBoostService.checkBoostTrigger.mockReturnValue(true);
						mockBoostService.isBoostActive.mockReturnValue(true);
						mockBoostService.getEffectiveMaxSpeedMph.mockReturnValue(88);

						service.update(0.016);

						expect(mockDrivingPhysics.applyJump)
							.toHaveBeenCalledWith(12);
						expect(mockAudioService.playJump)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.playCoin)
							.toHaveBeenCalledOnce();
						expect(mockAudioService.playBoost)
							.toHaveBeenCalledOnce();
						expect(mockDrivingPhysics.setTemporaryMaxSpeed)
							.toHaveBeenCalledWith(88);
					});

				it("should clear temporary max speed when boost is inactive",
					() =>
					{
						mockBoostService.isBoostActive.mockReturnValue(false);

						service.update(0.016);

						expect(mockDrivingPhysics.clearTemporaryMaxSpeed)
							.toHaveBeenCalledOnce();
					});
			});

		describe("victory character",
			() =>
			{
				it("should show victory character on first victory frame",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);
						mockDrivingPhysics.update.mockReturnValue(
							createDrivingState(
								{ positionX: 5, positionZ: 10 }));

						service.update(0.016);

						expect(mockCharacterBuilder.showVictoryStanding)
							.toHaveBeenCalledOnce();
					});

				it("should show victory character only once per race",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);

						service.update(0.016);
						service.update(0.016);

						expect(mockCharacterBuilder.showVictoryStanding)
							.toHaveBeenCalledOnce();
					});
			});

		describe("resetForNewRace",
			() =>
			{
				it("should allow victory character to show again after reset",
					() =>
					{
						mockRaceState.currentState.mockReturnValue(RaceState.Victory);
						service.update(0.016);

						expect(mockCharacterBuilder.showVictoryStanding)
							.toHaveBeenCalledOnce();

						service.resetForNewRace();
						service.update(0.016);

						expect(mockCharacterBuilder.showVictoryStanding)
							.toHaveBeenCalledTimes(2);
					});
			});
	});