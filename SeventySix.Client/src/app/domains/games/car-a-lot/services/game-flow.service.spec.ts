import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BUMPER_WIDTH, OCTOPUS_JUMP_VELOCITY } from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	DrivingState,
	RaceState,
	RoadBoundaryResult
} from "@games/car-a-lot/models/car-a-lot.models";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
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
};

type MockDrivingPhysics = {
	applyJump: Mock;
	setMaxSpeed: Mock;
	clampToRoad: Mock;
	applyBounce: Mock;
	reduceSpeed: Mock;
	setHeading: Mock;
};

type MockOctopusBoss = {
	checkApproachZone: Mock;
	updateEyeTracking: Mock;
	checkBodyCollision: Mock;
	startJumpAttack: Mock;
	checkGroundCollision: Mock;
	hasCleared: Mock;
	updateJumpAttack: Mock;
};

type MockRaceState = {
	transitionTo: Mock;
};

type MockRoadCollision = {
	checkRoadBoundary: Mock;
};

type MockInputService = {
	keys: Record<string, boolean>;
};

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
						playBumper: vi.fn()
					};
				mockDrivingPhysics =
					{
						applyJump: vi.fn(),
						setMaxSpeed: vi.fn(),
						clampToRoad: vi.fn(),
						applyBounce: vi.fn(),
						reduceSpeed: vi.fn(),
						setHeading: vi.fn()
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
								{ landed: false, position: new Vector3(0, 0, 0) })
					};
				mockRaceState =
					{
						transitionTo: vi.fn()
					};
				mockRoadCollision =
					{
						checkRoadBoundary: vi
							.fn()
							.mockReturnValue(createBoundary())
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
							{ provide: RoadCollisionService, useValue: mockRoadCollision }
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
			});

		it("should transition from racing to octopus phase when approach zone is hit",
			() =>
			{
				mockOctopusBoss.checkApproachZone.mockReturnValue(true);
				const state: DrivingState =
					createDrivingState(
						{ positionZ: 150 });

				service.update(
					state,
					RaceState.Racing,
					createBoundary(),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockRaceState.transitionTo)
					.toHaveBeenCalledWith(RaceState.OctopusPhase);
				expect(mockAudioService.playOctopusRumble)
					.toHaveBeenCalledOnce();
			});

		it("should jump on space edge during octopus phase when grounded",
			() =>
			{
				mockInputService.keys[" "] = true;
				const state: DrivingState =
					createDrivingState(
						{ isGrounded: true });

				service.update(
					state,
					RaceState.OctopusPhase,
					createBoundary(),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockDrivingPhysics.applyJump)
					.toHaveBeenCalledWith(OCTOPUS_JUMP_VELOCITY);
				expect(mockAudioService.playJump)
					.toHaveBeenCalledOnce();
			});

		it("should trigger octopus attack transition on body collision while airborne",
			() =>
			{
				mockOctopusBoss.checkBodyCollision.mockReturnValue(true);
				const state: DrivingState =
					createDrivingState(
						{ isGrounded: false });

				service.update(
					state,
					RaceState.OctopusPhase,
					createBoundary(),
					0.016,
					new Vector3(0, 0, 300));

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
				mockOctopusBoss.checkGroundCollision.mockReturnValue(true);
				const state: DrivingState =
					createDrivingState(
						{ isGrounded: true });

				service.update(
					state,
					RaceState.OctopusPhase,
					createBoundary(
						{ isOnRoad: true }),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockRaceState.transitionTo)
					.toHaveBeenCalledWith(RaceState.GameOver);
				expect(mockAudioService.playGameOver)
					.toHaveBeenCalled();
			});

		it("should transition to rescue when octopus has been cleared",
			() =>
			{
				mockOctopusBoss.hasCleared.mockReturnValue(true);
				const state: DrivingState =
					createDrivingState(
						{ isGrounded: true });

				service.update(
					state,
					RaceState.OctopusPhase,
					createBoundary(),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockRaceState.transitionTo)
					.toHaveBeenCalledWith(RaceState.Rescue);
			});

		it("should trigger game over when grounded off-road outside landing road during octopus phase",
			() =>
			{
				const state: DrivingState =
					createDrivingState(
						{
							isGrounded: true,
							positionX: -999,
							positionZ: -999
						});

				service.update(
					state,
					RaceState.OctopusPhase,
					createBoundary(
						{ isOnRoad: false }),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockRaceState.transitionTo)
					.toHaveBeenCalledWith(RaceState.GameOver);
			});

		it("should transition to game over after octopus attack lands",
			() =>
			{
				mockOctopusBoss.updateJumpAttack.mockReturnValue(
					{
						landed: true,
						position: new Vector3(0, 0, 0)
					});

				service.update(
					createDrivingState(),
					RaceState.OctopusAttack,
					createBoundary(),
					0.25,
					new Vector3(0, 0, 300));

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
				const state: DrivingState =
					createDrivingState(
						{
							isGrounded: true,
							positionX: -100,
							positionZ: -100
						});

				service.update(
					state,
					RaceState.Rescue,
					createBoundary(),
					0.016,
					new Vector3(0, 0, 300));

				expect(mockRaceState.transitionTo)
					.toHaveBeenCalledWith(RaceState.GameOver);
			});

		it("should apply bumper response when in landing road bumper zone",
			() =>
			{
				const state: DrivingState =
					createDrivingState(
						{
							isGrounded: true,
							positionX: 10,
							positionZ: 25
						});
				const bumperBoundary: RoadBoundaryResult =
					createBoundary(
						{
							isInBumperZone: true,
							distanceToEdge: 1,
							bumperNormalAngle: 0
						});
				mockRoadCollision.checkRoadBoundary.mockReturnValue(bumperBoundary);

				service.update(
					state,
					RaceState.Rescue,
					createBoundary(),
					0.016,
					new Vector3(999, 0, 999));

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
				const state: DrivingState =
					createDrivingState(
						{
							isGrounded: true,
							positionX: 10,
							positionZ: 25
						});

				service.update(
					state,
					RaceState.Rescue,
					createBoundary(),
					0.016,
					new Vector3(10, 0, 25));

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
				const state: DrivingState =
					createDrivingState(
						{
							positionX: 0,
							positionZ: 0,
							rotationY: 0
						});

				service.update(
					state,
					RaceState.Victory,
					createBoundary(),
					0.1,
					new Vector3(10, 0, 10));

				expect(mockDrivingPhysics.reduceSpeed)
					.toHaveBeenCalledOnce();
				expect(mockDrivingPhysics.setHeading)
					.toHaveBeenCalledOnce();
			});
	});