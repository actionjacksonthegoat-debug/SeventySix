/**
 * Game Flow Service.
 * Orchestrates the per-frame game loop for the Car-a-Lot race:
 * countdown, physics, visuals, collisions, items, and state transitions.
 */

import { inject, Injectable } from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
	BUMPER_WIDTH,
	LANDING_ROAD_LENGTH,
	LANDING_ROAD_WIDTH,
	MAX_SPEED_MPH,
	OCTOPUS_JUMP_VELOCITY,
	RESCUE_ZONE_RADIUS,
	VICTORY_DECEL_RATE,
	VICTORY_TURN_RATE
} from "@games/car-a-lot/constants/car-a-lot.constants";
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
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { InputService } from "@games/shared/services/input.service";

import { isPresent } from "@shared/utilities/null-check.utility";

/**
 * Orchestrates the per-frame game loop for the Car-a-Lot race.
 * Manages countdown, physics, visuals, collisions, items, and state transitions.
 * Route-scoped — register in route providers[], not providedIn root.
 */
@Injectable()
export class GameFlowService
{
	/** Audio triggers for game events. */
	private readonly audioService: CarALotAudioService =
		inject(CarALotAudioService);

	/** Boost pad service for speed boost zones. */
	private readonly boostService: BoostService =
		inject(BoostService);

	/** Character builder for cape animation and victory character. */
	private readonly characterBuilder: CharacterBuilderService =
		inject(CharacterBuilderService);

	/** Coin pickup service for collectible coins. */
	private readonly coinService: CoinService =
		inject(CoinService);

	/** Driving physics control for speed and heading adjustments. */
	private readonly drivingPhysics: DrivingPhysicsService =
		inject(DrivingPhysicsService);

	/** Input service for space-bar edge detection during octopus phase. */
	private readonly inputService: InputService =
		inject(InputService);

	/** Kart builder for wheel animation. */
	private readonly kartBuilder: KartBuilderService =
		inject(KartBuilderService);

	/** Octopus boss behavior and collision checks. */
	private readonly octopusBoss: OctopusBossService =
		inject(OctopusBossService);

	/** Chase camera that follows the kart. */
	private readonly raceCamera: RaceCameraService =
		inject(RaceCameraService);

	/** Race state machine — reads current state and drives transitions. */
	private readonly raceState: RaceStateService =
		inject(RaceStateService);

	/** Road collision service — used for bumper checks. */
	private readonly roadCollision: RoadCollisionService =
		inject(RoadCollisionService);

	/** Track builder for road segment access. */
	private readonly trackBuilder: TrackBuilderService =
		inject(TrackBuilderService);

	/** Track features for tunnel and jump detection. */
	private readonly trackFeatures: TrackFeaturesService =
		inject(TrackFeaturesService);

	/** Reference to the kart root node for position updates. */
	private kartRoot: TransformNode | null = null;

	/** Rescue platform center position. */
	private rescueCenter: Vector3 =
		Vector3.Zero();

	/** Reference to the scene for victory character creation. */
	private scene: Scene | null = null;

	/** Octopus body center X — start of landing road along X axis. */
	private landingRoadCenterX: number = 0;

	/** Octopus body center Z — start of landing road along Z axis. */
	private landingRoadStartZ: number = 0;

	/** Synthetic segments for landing road bumper detection, split around the victory circle. */
	private landingRoadSegments: RoadSegment[] = [];

	/** Whether space was pressed last frame — enables edge-triggered jump detection. */
	private spaceWasDown: boolean = false;

	/** Last countdown value for bing sound detection. */
	private lastCountdownValue: number = -1;

	/** Whether the victory standing character has been shown for the current race. */
	private victoryCharacterShown: boolean = false;

	/** Pre-allocated Vector3 for kart position (avoids per-frame allocation). */
	private readonly _kartPosition: Vector3 =
		Vector3.Zero();

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
	 * Set the scene context required for per-frame orchestration.
	 * Called once after scene initialisation, before the game loop starts.
	 * @param scene
	 * The Babylon.js scene instance.
	 * @param kartRoot
	 * The kart root transform node.
	 * @param rescueCenter
	 * Centre of the rescue / victory platform.
	 */
	setContext(
		scene: Scene,
		kartRoot: TransformNode,
		rescueCenter: Vector3): void
	{
		this.scene = scene;
		this.kartRoot = kartRoot;
		this.rescueCenter = rescueCenter;
	}

	/**
	 * Reset per-race flow state for a new game.
	 * Called from the component when the player starts or restarts.
	 */
	resetForNewRace(): void
	{
		this.lastCountdownValue = 3;
		this.victoryCharacterShown = false;
	}

	/**
	 * Per-frame update — orchestrates physics, visuals, collisions, items, and state transitions.
	 * Called once per frame from the game loop.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	update(deltaTime: number): void
	{
		const currentState: RaceState =
			this.raceState.currentState();

		if (this.handleCountdown(deltaTime, currentState))
		{
			return;
		}

		this.showVictoryCharacterOnFirstFrame(currentState);

		const state: DrivingState =
			this.updatePhysics(deltaTime, currentState);

		this.updateVisuals(state, deltaTime, currentState);

		const segments: readonly RoadSegment[] =
			this.trackBuilder.getSegments();
		const boundary: RoadBoundaryResult =
			this.roadCollision.checkRoadBoundary(
				state.positionX,
				state.positionZ,
				segments);

		this.handleCollisions(state, currentState, boundary);
		this.updateItems(state, deltaTime);
		this.octopusBoss.updateAnimation(deltaTime);
		this.evaluateStateTransitions(state, currentState, boundary, deltaTime);
	}

	/**
	 * Evaluate game-state transitions for the current frame.
	 * @param state
	 * Current driving state snapshot.
	 * @param currentState
	 * Active race lifecycle state.
	 * @param boundary
	 * Road boundary check result for the kart's current position.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private evaluateStateTransitions(
		state: DrivingState,
		currentState: RaceState,
		boundary: RoadBoundaryResult,
		deltaTime: number): void
	{
		this._kartPosition.copyFromFloats(state.positionX, state.positionY, state.positionZ);

		if (currentState === RaceState.Racing)
		{
			this.handleRacingPhase(this._kartPosition);
		}

		if (currentState === RaceState.OctopusPhase)
		{
			this.handleOctopusPhase(
				state,
				this._kartPosition,
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
				this._kartPosition);
		}

		if (currentState === RaceState.Victory)
		{
			this.handleVictoryPhase(
				state,
				this._kartPosition,
				deltaTime);
		}
	}

	/**
	 * Tick countdown and play audio cues.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @param currentState
	 * Current race lifecycle state.
	 * @returns
	 * True if countdown is active and frame processing should stop.
	 */
	private handleCountdown(
		deltaTime: number,
		currentState: RaceState): boolean
	{
		if (
			currentState !== RaceState.Countdown
				|| !this.raceState.isCountdownActive())
		{
			return false;
		}

		const countdownBefore: number =
			this.raceState.countdownValue();

		if (this.raceState.tickCountdown(deltaTime))
		{
			this.audioService.playCountdownBing(true);
			this.raceState.transitionTo(RaceState.Racing);
			this.audioService.startEngine();
			this.audioService.startMusic();
			this.lastCountdownValue = -1;
		}
		else
		{
			const countdownAfter: number =
				this.raceState.countdownValue();

			if (
				countdownAfter !== countdownBefore
					&& countdownAfter !== this.lastCountdownValue)
			{
				this.audioService.playCountdownBing(false);
				this.lastCountdownValue = countdownAfter;
			}
		}

		if (this.kartRoot !== null)
		{
			this.raceCamera.updateCamera(
				this.kartRoot.position,
				this.kartRoot.rotation.y,
				deltaTime,
				false);
		}

		return true;
	}

	/**
	 * On the first frame of victory, replace the seated kart character with
	 * a standing version at the kart's current position.
	 * @param currentState
	 * Current race lifecycle state.
	 */
	private showVictoryCharacterOnFirstFrame(
		currentState: RaceState): void
	{
		if (
			currentState !== RaceState.Victory
				|| this.victoryCharacterShown
				|| this.kartRoot === null
				|| this.scene === null)
		{
			return;
		}

		this.victoryCharacterShown = true;
		this.characterBuilder.showVictoryStanding(
			this.scene,
			this.kartRoot.position.clone());
	}

	/**
	 * Run physics update and apply kart position/rotation to the mesh.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @param currentState
	 * Current race lifecycle state.
	 * @returns
	 * The driving state snapshot from the physics engine.
	 */
	private updatePhysics(
		deltaTime: number,
		currentState: RaceState): DrivingState
	{
		const isRacing: boolean =
			currentState !== RaceState.Countdown
				&& currentState !== RaceState.Victory
				&& currentState !== RaceState.GameOver;

		const activeKeys: Record<string, boolean> =
			isRacing
				? { ...this.inputService.keys }
				: {};

		const kartPos: Vector3 =
			this.kartRoot?.position ?? Vector3.Zero();

		const preCheckBoundary: RoadBoundaryResult =
			this.roadCollision.checkRoadBoundary(
				kartPos.x,
				kartPos.z,
				this.trackBuilder.getSegments());

		const state: DrivingState =
			this.drivingPhysics.update(
				activeKeys,
				deltaTime,
				preCheckBoundary.groundElevation);

		if (this.kartRoot !== null)
		{
			this.kartRoot.position.copyFromFloats(
				state.positionX,
				state.positionY,
				state.positionZ);
			this.kartRoot.rotation.y =
				state.rotationY;
		}

		return state;
	}

	/**
	 * Update visual systems — wheels, cape, camera, speed display, and engine audio.
	 * @param state
	 * Current driving state snapshot.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @param currentState
	 * Current race lifecycle state.
	 */
	private updateVisuals(
		state: DrivingState,
		deltaTime: number,
		currentState: RaceState): void
	{
		this.kartBuilder.updateWheels(
			state.speedMph,
			deltaTime);

		this.characterBuilder.updateCapeAnimation(
			state.speedMph,
			deltaTime);

		const isInTunnel: boolean =
			this.trackFeatures.isInsideTunnel(
				state.positionX,
				state.positionZ);

		this.raceCamera.updateCamera(
			this.kartRoot?.position ?? Vector3.Zero(),
			state.rotationY,
			deltaTime,
			isInTunnel);

		this.raceState.updateSpeed(state.speedMph);

		this.audioService.updateEngine(
			state.speedMph / MAX_SPEED_MPH);

		if (
			currentState === RaceState.Racing
				|| currentState === RaceState.OctopusPhase
				|| currentState === RaceState.Rescue)
		{
			this.raceState.updateElapsedTime(deltaTime);
		}
	}

	/**
	 * Check road boundary collisions and handle bumper pushback or off-road game over.
	 * @param state
	 * Current driving state snapshot.
	 * @param currentState
	 * Current race lifecycle state.
	 * @param boundary
	 * Road boundary check result.
	 */
	private handleCollisions(
		state: DrivingState,
		currentState: RaceState,
		boundary: RoadBoundaryResult): void
	{
		if (boundary.isInBumperZone && state.isGrounded)
		{
			const pushDistance: number =
				BUMPER_WIDTH - boundary.distanceToEdge + 0.5;
			const normalX: number =
				Math.sin(boundary.bumperNormalAngle);
			const normalZ: number =
				Math.cos(boundary.bumperNormalAngle);

			this.drivingPhysics.clampToRoad(
				normalX * pushDistance,
				normalZ * pushDistance);
			this.drivingPhysics.applyBounce(
				boundary.bumperNormalAngle,
				0);
			this.boostService.deactivateBoost();
			this.audioService.playBumper();
		}
		else if (
			!boundary.isOnRoad
				&& currentState === RaceState.Racing
				&& state.isGrounded)
		{
			this.raceState.transitionTo(RaceState.GameOver);
			this.drivingPhysics.setMaxSpeed(0);
			this.audioService.stopEngine();
			this.audioService.stopMusic();
			this.audioService.playGameOver();
		}
	}

	/**
	 * Check jump triggers, coin collection, and boost pad activation.
	 * @param state
	 * Current driving state snapshot.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private updateItems(
		state: DrivingState,
		deltaTime: number): void
	{
		const isInTunnel: boolean =
			this.trackFeatures.isInsideTunnel(
				state.positionX,
				state.positionZ);

		const jumpResult: JumpResult | null =
			isInTunnel
				? null
				: this.trackFeatures.checkJumpTrigger(
					state.positionX,
					state.positionZ,
					state.speedMph);

		if (isPresent(jumpResult))
		{
			this.drivingPhysics.applyJump(
				jumpResult.jumpVelocity);
			this.audioService.playJump();
		}

		const coinCollected: boolean =
			this.coinService.checkCollection(
				state.positionX,
				state.positionZ);

		if (coinCollected)
		{
			this.audioService.playCoin();
		}

		this.coinService.updateAnimation(deltaTime);

		const boostTriggered: boolean =
			this.boostService.checkBoostTrigger(
				state.positionX,
				state.positionZ);

		if (boostTriggered)
		{
			this.audioService.playBoost();
		}

		this.boostService.updateBoost(deltaTime);

		if (this.boostService.isBoostActive())
		{
			this.drivingPhysics.setTemporaryMaxSpeed(
				this.boostService.getEffectiveMaxSpeedMph());
		}
		else
		{
			this.drivingPhysics.clearTemporaryMaxSpeed();
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
	 */
	private handleRescuePhase(
		state: DrivingState,
		kartPosition: Vector3): void
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
			Vector3.Distance(kartPosition, this.rescueCenter);

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
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private handleVictoryPhase(
		state: DrivingState,
		kartPosition: Vector3,
		deltaTime: number): void
	{
		const damping: number =
			Math.max(0, 1 - VICTORY_DECEL_RATE * deltaTime);
		this.drivingPhysics.reduceSpeed(damping);

		const dirX: number =
			this.rescueCenter.x - kartPosition.x;
		const dirZ: number =
			this.rescueCenter.z - kartPosition.z;
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