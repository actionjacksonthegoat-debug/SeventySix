/**
 * Game Flow Service.
 * Manages state transitions for the Car-a-Lot race lifecycle:
 * octopus approach, tentacle phase, rescue, landing road, and victory.
 */

import { inject, Injectable } from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
	BUMPER_WIDTH,
	LANDING_ROAD_LENGTH,
	LANDING_ROAD_WIDTH,
	OCTOPUS_JUMP_VELOCITY,
	RESCUE_ZONE_RADIUS,
	VICTORY_DECEL_RATE,
	VICTORY_TURN_RATE
} from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	DrivingState,
	RaceState,
	RoadBoundaryResult,
	RoadSegment
} from "@games/car-a-lot/models/car-a-lot.models";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { InputService } from "@games/shared/services/input.service";

/**
 * Handles per-frame state transitions and landing road checks for the Car-a-Lot race.
 * Route-scoped — register in route providers[], not providedIn root.
 */
@Injectable()
export class GameFlowService
{
	/** Audio triggers for game events. */
	private readonly audioService: CarALotAudioService =
		inject(CarALotAudioService);

	/** Driving physics control for speed and heading adjustments. */
	private readonly drivingPhysics: DrivingPhysicsService =
		inject(DrivingPhysicsService);

	/** Input service for space-bar edge detection during octopus phase. */
	private readonly inputService: InputService =
		inject(InputService);

	/** Octopus boss behavior and collision checks. */
	private readonly octopusBoss: OctopusBossService =
		inject(OctopusBossService);

	/** Race state machine — reads current state and drives transitions. */
	private readonly raceState: RaceStateService =
		inject(RaceStateService);

	/** Road collision service — used for landing road bumper checks. */
	private readonly roadCollision: RoadCollisionService =
		inject(RoadCollisionService);

	/** Octopus body center X — start of landing road along X axis. */
	private landingRoadCenterX: number = 0;

	/** Octopus body center Z — start of landing road along Z axis. */
	private landingRoadStartZ: number = 0;

	/** Synthetic segments for landing road bumper detection, split around the victory circle. */
	private landingRoadSegments: RoadSegment[] = [];

	/** Whether space was pressed last frame — enables edge-triggered jump detection. */
	private spaceWasDown: boolean = false;

	/**
	 * Store landing road geometry, called once after scene initialisation.
	 * @param landingRoadCenterX
	 * World X at the centre of the landing road.
	 * @param landingRoadStartZ
	 * World Z at the start of the landing road (octopus body centre).
	 * @param landingRoadSegments
	 * Synthetic road segments used for bumper collision on the landing road.
	 */
	initialize(
		landingRoadCenterX: number,
		landingRoadStartZ: number,
		landingRoadSegments: RoadSegment[]): void
	{
		this.landingRoadCenterX = landingRoadCenterX;
		this.landingRoadStartZ = landingRoadStartZ;
		this.landingRoadSegments = landingRoadSegments;
	}

	/**
	 * Evaluate game-state transitions for the current frame.
	 * Called once per frame from the game loop with current driving and race context.
	 * @param state
	 * Current driving state snapshot from DrivingPhysicsService.
	 * @param currentState
	 * Active race lifecycle state from RaceStateService.
	 * @param boundary
	 * Road boundary check result for the kart's current position.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @param rescueCenter
	 * Centre of the rescue / victory platform.
	 */
	update(
		state: DrivingState,
		currentState: RaceState,
		boundary: RoadBoundaryResult,
		deltaTime: number,
		rescueCenter: Vector3): void
	{
		const kartPosition: Vector3 =
			new Vector3(state.positionX, state.positionY, state.positionZ);

		if (currentState === RaceState.Racing)
		{
			this.handleRacingPhase(kartPosition);
		}

		if (currentState === RaceState.OctopusPhase)
		{
			this.handleOctopusPhase(
				state,
				kartPosition,
				boundary);
		}

		if (currentState === RaceState.OctopusAttack)
		{
			this.handleOctopusAttack(deltaTime);
		}

		if (currentState === RaceState.Rescue)
		{
			this.handleRescuePhase(
				state,
				kartPosition,
				rescueCenter);
		}

		if (currentState === RaceState.Victory)
		{
			this.handleVictoryPhase(
				state,
				kartPosition,
				rescueCenter,
				deltaTime);
		}
	}

	/**
	 * Handle the racing phase — detect octopus approach zone.
	 * @param kartPosition
	 * Current kart world position.
	 */
	private handleRacingPhase(kartPosition: Vector3): void
	{
		if (this.octopusBoss.checkApproachZone(kartPosition))
		{
			this.raceState.transitionTo(RaceState.OctopusPhase);
			this.audioService.playOctopusRumble();
		}
	}

	/**
	 * Handle octopus phase — space-bar jumping, body/ground collision, and clearing.
	 * @param state
	 * Current driving state snapshot.
	 * @param kartPosition
	 * Current kart world position.
	 * @param boundary
	 * Road boundary result for off-road detection.
	 */
	private handleOctopusPhase(
		state: DrivingState,
		kartPosition: Vector3,
		boundary: RoadBoundaryResult): void
	{
		this.octopusBoss.updateEyeTracking(kartPosition);

		const spaceDown: boolean =
			this.inputService.keys[" "] === true;

		if (spaceDown && !this.spaceWasDown && state.isGrounded)
		{
			this.drivingPhysics.applyJump(
				OCTOPUS_JUMP_VELOCITY);
			this.audioService.playJump();
		}

		this.spaceWasDown = spaceDown;

		if (!state.isGrounded && this.octopusBoss.checkBodyCollision(kartPosition))
		{
			this.raceState.transitionTo(RaceState.OctopusAttack);
			this.octopusBoss.startJumpAttack();
			this.drivingPhysics.setMaxSpeed(0);
			this.audioService.stopEngine();
		}

		if (state.isGrounded && this.octopusBoss.checkGroundCollision(kartPosition))
		{
			this.triggerGameOver();
		}

		if (this.octopusBoss.hasCleared(kartPosition))
		{
			this.raceState.transitionTo(RaceState.Rescue);
		}
		else if (
			state.isGrounded
				&& !boundary.isOnRoad
				&& !this.isOnLandingRoad(state.positionX, state.positionZ))
		{
			this.triggerGameOver();
		}
	}

	/**
	 * Handle octopus attack phase — tentacle jump attack animation.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private handleOctopusAttack(deltaTime: number): void
	{
		const jumpResult: { landed: boolean; position: Vector3; } =
			this.octopusBoss.updateJumpAttack(
				deltaTime);

		if (jumpResult.landed)
		{
			this.raceState.transitionTo(RaceState.GameOver);
			this.audioService.stopMusic();
			this.audioService.playGameOver();
		}
	}

	/**
	 * Handle rescue phase — landing road bumpers and victory zone detection.
	 * @param state
	 * Current driving state snapshot.
	 * @param kartPosition
	 * Current kart world position.
	 * @param rescueCenter
	 * Centre of the rescue / victory platform.
	 */
	private handleRescuePhase(
		state: DrivingState,
		kartPosition: Vector3,
		rescueCenter: Vector3): void
	{
		if (state.isGrounded)
		{
			const isOnLanding: boolean =
				this.isOnLandingRoad(
					state.positionX,
					state.positionZ);

			if (!isOnLanding)
			{
				this.triggerGameOver();

				return;
			}
		}

		if (
			this.landingRoadSegments.length > 0
				&& state.isGrounded)
		{
			this.checkLandingRoadBumpers(state);
		}

		const distToCenter: number =
			Vector3.Distance(kartPosition, rescueCenter);

		if (distToCenter < RESCUE_ZONE_RADIUS)
		{
			this.raceState.transitionTo(RaceState.Victory);
			this.audioService.stopEngine();
			this.audioService.stopMusic();
			this.audioService.playVictory();
		}
	}

	/**
	 * Check and apply landing road bumper collisions.
	 * @param state
	 * Current driving state for position data.
	 */
	private checkLandingRoadBumpers(state: DrivingState): void
	{
		const landingBoundary: RoadBoundaryResult =
			this.roadCollision.checkRoadBoundary(
				state.positionX,
				state.positionZ,
				this.landingRoadSegments);

		if (landingBoundary.isInBumperZone)
		{
			const pushDistance: number =
				BUMPER_WIDTH - landingBoundary.distanceToEdge + 0.5;
			const normalX: number =
				Math.sin(landingBoundary.bumperNormalAngle);
			const normalZ: number =
				Math.cos(landingBoundary.bumperNormalAngle);

			this.drivingPhysics.clampToRoad(
				normalX * pushDistance,
				normalZ * pushDistance);
			this.drivingPhysics.applyBounce(
				landingBoundary.bumperNormalAngle,
				0);
			this.audioService.playBumper();
		}
	}

	/**
	 * Handle victory phase — decelerate and turn kart toward rescue center.
	 * @param state
	 * Current driving state snapshot.
	 * @param kartPosition
	 * Current kart world position.
	 * @param rescueCenter
	 * Centre of the rescue / victory platform.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private handleVictoryPhase(
		state: DrivingState,
		kartPosition: Vector3,
		rescueCenter: Vector3,
		deltaTime: number): void
	{
		const damping: number =
			Math.max(0, 1 - VICTORY_DECEL_RATE * deltaTime);
		this.drivingPhysics.reduceSpeed(damping);

		const dirX: number =
			rescueCenter.x - kartPosition.x;
		const dirZ: number =
			rescueCenter.z - kartPosition.z;
		const targetHeading: number =
			Math.atan2(dirX, dirZ);
		const currentHeading: number =
			state.rotationY;
		const headingDiff: number =
			Math.atan2(
				Math.sin(targetHeading - currentHeading),
				Math.cos(targetHeading - currentHeading));
		const maxTurn: number =
			VICTORY_TURN_RATE * deltaTime;
		const turnAmount: number =
			Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurn);

		this.drivingPhysics.setHeading(
			currentHeading + turnAmount);
	}

	/**
	 * Trigger game over — stops engine, music, and plays defeat sound.
	 */
	private triggerGameOver(): void
	{
		this.raceState.transitionTo(RaceState.GameOver);
		this.drivingPhysics.setMaxSpeed(0);
		this.audioService.stopEngine();
		this.audioService.stopMusic();
		this.audioService.playGameOver();
	}

	/**
	 * Check whether a world XZ position is within the landing road bounds.
	 * @param posX
	 * World X position to test.
	 * @param posZ
	 * World Z position to test.
	 * @returns
	 * True if the position is inside the landing road rectangle.
	 */
	private isOnLandingRoad(
		posX: number,
		posZ: number): boolean
	{
		const halfWidth: number =
			LANDING_ROAD_WIDTH / 2;
		const isInX: boolean =
			posX >= this.landingRoadCenterX - halfWidth
				&& posX <= this.landingRoadCenterX + halfWidth;
		const isInZ: boolean =
			posZ >= this.landingRoadStartZ
				&& posZ <= this.landingRoadStartZ + LANDING_ROAD_LENGTH;

		return isInX && isInZ;
	}
}