/**
 * Car-a-Lot Game Page Component.
 * Smart container that hosts the Babylon.js canvas, driving HUD, and color selector.
 * Orchestrates scene initialization and game loop.
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";
import { ColorSelectorComponent } from "@games/car-a-lot/components/color-selector/color-selector";
import { DrivingHudComponent } from "@games/car-a-lot/components/driving-hud/driving-hud";
import { MobileControlsComponent } from "@games/car-a-lot/components/mobile-controls/mobile-controls";
import {
	BUMPER_WIDTH,
	LANDING_ROAD_LENGTH,
	LANDING_ROAD_WIDTH,
	MAX_SPEED_MPH,
	OCTOPUS_JUMP_VELOCITY,
	OCTOPUS_SPAWN_OFFSET_Z,
	RESCUE_PLATFORM_HEIGHT,
	RESCUE_PLATFORM_OFFSET_Z,
	RESCUE_ZONE_RADIUS,
	VICTORY_DECEL_RATE,
	VICTORY_TURN_RATE
} from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	CharacterType,
	DrivingState,
	JumpResult,
	KartColor,
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
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { BabylonCanvasComponent } from "@games/shared/components/babylon-canvas/babylon-canvas";
import { InputService } from "@games/shared/services/input.service";

import { isPresent } from "@shared/utilities/null-check.utility";

/** Car-a-Lot driving game page — orchestrates scene, HUD, and selectors. */
@Component(
	{
		selector: "app-car-a-lot-game",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [BabylonCanvasComponent, DrivingHudComponent, ColorSelectorComponent, MobileControlsComponent],
		templateUrl: "./car-a-lot-game.html",
		styleUrl: "./car-a-lot-game.scss"
	})
export class CarALotGameComponent
{
	/** Destroy ref for cleanup registration. */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/** Input service for tracking pressed keys. */
	private readonly inputService: InputService =
		inject(InputService);

	/** Race state service for lifecycle management. */
	private readonly raceState: RaceStateService =
		inject(RaceStateService);

	/** Kart builder service for mesh creation and color switching. */
	private readonly kartBuilder: KartBuilderService =
		inject(KartBuilderService);

	/** Character builder for LEGO character creation and switching. */
	private readonly characterBuilder: CharacterBuilderService =
		inject(CharacterBuilderService);

	/** Driving physics engine for acceleration, steering, and gravity. */
	private readonly drivingPhysics: DrivingPhysicsService =
		inject(DrivingPhysicsService);

	/** Chase camera that follows the kart. */
	private readonly raceCamera: RaceCameraService =
		inject(RaceCameraService);

	/** Scene environment service for sky, lighting, and ground. */
	private readonly raceScene: RaceSceneService =
		inject(RaceSceneService);

	/** Track builder for road segments, trees, and decorations. */
	private readonly trackBuilder: TrackBuilderService =
		inject(TrackBuilderService);

	/** Road collision detection and bumper management. */
	private readonly roadCollision: RoadCollisionService =
		inject(RoadCollisionService);

	/** Track features (jumps, tunnel, forks). */
	private readonly trackFeatures: TrackFeaturesService =
		inject(TrackFeaturesService);

	/** Octopus boss obstacle with driveable tentacles. */
	private readonly octopusBoss: OctopusBossService =
		inject(OctopusBossService);

	/** Coin pickup service for collectible coins on the track. */
	private readonly coinService: CoinService =
		inject(CoinService);

	/** Boost pad service for speed boost zones on the track. */
	private readonly boostService: BoostService =
		inject(BoostService);

	/** Audio service for procedural game sounds. */
	private readonly audioService: CarALotAudioService =
		inject(CarALotAudioService);

	/** Reference to the kart root node for game loop position updates. */
	private kartRoot: TransformNode | null = null;

	/** Reference to the game loop observer for cleanup. */
	private gameLoopObserver: Observer<Scene> | null = null;

	/** Rescue platform center position for auto-stop. */
	private rescueCenter: Vector3 =
		Vector3.Zero();

	/** Reference to the scene for restart. */
	private scene: Scene | null = null;

	/** Octopus body center X for landing road check. */
	private landingRoadCenterX: number = 0;

	/** Octopus body center Z for landing road start. */
	private landingRoadStartZ: number = 0;

	/** Last countdown value for bing sound detection. */
	private lastCountdownValue: number = -1;

	/** Reference to the rescue character root node for rebuild on character change. */
	private rescueCharRoot: TransformNode | null = null;

	/** Tracks whether the space key was held last frame to enable edge detection. */
	private spaceWasDown: boolean = false;

	/**
	 * Handle Babylon.js scene initialization.
	 * Called when the canvas component emits the ready scene.
	 * @param scene
	 * The initialized Babylon.js Scene instance.
	 */
	onSceneReady(scene: Scene): void
	{
		this.scene = scene;
		this.inputService.initialize();
		this.audioService.initialize();
		this.raceScene.initialize(scene);
		this.trackBuilder.buildTrack(scene);
		this.roadCollision.createBumpers(
			scene,
			this.trackBuilder.getSegments());

		const segments: readonly RoadSegment[] =
			this.trackBuilder.getSegments();
		this.raceScene.createRoadHills(segments);

		const longestStraight: { startIndex: number; count: number; totalLength: number; } =
			this
				.trackFeatures
				.findLongestStraight(segments);
		const tunnelSegment: RoadSegment =
			segments[longestStraight.startIndex];

		this.trackFeatures.createTunnel(
			scene,
			tunnelSegment.positionX,
			tunnelSegment.positionZ,
			tunnelSegment.rotationY,
			longestStraight.totalLength);

		this.trackFeatures.createJumps(
			scene,
			segments);

		const lastSegment: RoadSegment =
			segments[segments.length - 1];
		const octopusPosition: Vector3 =
			new Vector3(
				lastSegment.positionX,
				0,
				lastSegment.positionZ + OCTOPUS_SPAWN_OFFSET_Z);

		this.raceScene.createApproachRoad(
			scene,
			octopusPosition);

		this.octopusBoss.createOctopus(
			scene,
			octopusPosition);

		this.landingRoadCenterX =
			octopusPosition.x;
		this.landingRoadStartZ =
			octopusPosition.z;

		this.raceScene.createLandingRoad(
			scene,
			octopusPosition);

		this.rescueCenter =
			new Vector3(
				octopusPosition.x,
				0,
				octopusPosition.z + RESCUE_PLATFORM_OFFSET_Z);

		this.raceScene.createRescuePlatform(
			scene,
			this.rescueCenter);

		this.raceScene.createCastle(
			scene,
			this.rescueCenter);

		this.coinService.placeCoins(
			scene,
			segments);

		this.boostService.placeBoostPads(
			scene,
			segments);

		const rescueCharRoot: TransformNode =
			this.characterBuilder.createRescueCharacter(scene);

		const rescueCharPosition: Vector3 =
			this.rescueCenter.clone();
		rescueCharPosition.y =
			RESCUE_PLATFORM_HEIGHT;
		rescueCharRoot.position = rescueCharPosition;
		this.rescueCharRoot = rescueCharRoot;

		this.kartRoot =
			this.kartBuilder.createKart(scene);

		this.characterBuilder.createCharacter(
			scene,
			this.kartRoot);

		this.raceCamera.initialize(scene);
		this.startGameLoop(scene);

		this.destroyRef.onDestroy(
			() => this.cleanup(scene));
	}

	/**
	 * Handle kart color change from the color selector.
	 * @param color
	 * The newly selected kart color.
	 */
	onKartColorChange(color: KartColor): void
	{
		this.kartBuilder.setKartColor(color);
	}

	/**
	 * Handle character change from the color selector.
	 * @param character
	 * The newly selected character type.
	 */
	onCharacterChange(character: CharacterType): void
	{
		this.raceState.setCharacterType(character);
		this.characterBuilder.setCharacterType(character);

		if (this.scene !== null && this.rescueCharRoot !== null)
		{
			this.rescueCharRoot.dispose();
			const newRescue: TransformNode =
				this.characterBuilder.createRescueCharacter(this.scene);
			const newPosition: Vector3 =
				this.rescueCenter.clone();
			newPosition.y =
				RESCUE_PLATFORM_HEIGHT;
			newRescue.position = newPosition;
			this.rescueCharRoot = newRescue;
		}
	}

	/**
	 * Start or restart the game with a 3-second countdown.
	 * Resets all state so it can be called from any race phase.
	 */
	onStartGame(): void
	{
		this.raceState.reset();
		this.drivingPhysics.reset();
		this.boostService.reset();
		this.coinService.reset();
		this.raceState.startCountdown();
		this.lastCountdownValue = 3;
		this.audioService.playCountdownBing(false);
	}

	/**
	 * Starts the main game loop via the scene's before-render observable.
	 * @param scene
	 * The Babylon.js scene to attach the game loop to.
	 */
	private startGameLoop(scene: Scene): void
	{
		this.gameLoopObserver =
			scene.onBeforeRenderObservable.add(
				() =>
				{
					const engine: import("@babylonjs/core/Engines/engine").Engine =
						scene
							.getEngine() as import("@babylonjs/core/Engines/engine").Engine;
					const deltaTime: number =
						engine.getDeltaTime() / 1000;

					const currentState: RaceState =
						this.raceState.currentState();

					if (
						currentState === RaceState.Countdown
							&& this.raceState.isCountdownActive())
					{
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

						return;
					}

					const isRacing: boolean =
						currentState !== RaceState.Countdown
							&& currentState !== RaceState.Victory
							&& currentState !== RaceState.GameOver;

					const activeKeys: Record<string, boolean> =
						isRacing
							? { ...this.inputService.keys, mouseLeft: this.inputService.mouseLeft }
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
						this.kartRoot.position =
							new Vector3(
								state.positionX,
								state.positionY,
								state.positionZ);
						this.kartRoot.rotation.y =
							state.rotationY;
					}

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

					const boundary: RoadBoundaryResult =
						this.roadCollision.checkRoadBoundary(
							state.positionX,
							state.positionZ,
							this.trackBuilder.getSegments());

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

					this.octopusBoss.updateAnimation(deltaTime);

					this.handleGameFlow(state, currentState, boundary, deltaTime);
				});
	}

	/**
	 * Handle game state flow: octopus approach, rescue, victory, restart.
	 * @param state
	 * Current driving state snapshot.
	 * @param currentState
	 * Current race lifecycle state.
	 * @param boundary
	 * Current road boundary check result.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private handleGameFlow(
		state: DrivingState,
		currentState: RaceState,
		boundary: RoadBoundaryResult,
		deltaTime: number): void
	{
		const kartPosition: Vector3 =
			this.kartRoot?.position ?? Vector3.Zero();

		if (currentState === RaceState.Racing)
		{
			if (this.octopusBoss.checkApproachZone(kartPosition))
			{
				this.raceState.transitionTo(RaceState.OctopusPhase);
				this.audioService.playOctopusRumble();
			}
		}

		if (currentState === RaceState.OctopusPhase)
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

			if (this.octopusBoss.hasCleared(kartPosition))
			{
				this.raceState.transitionTo(RaceState.Rescue);
			}
			else if (
				state.isGrounded
					&& !boundary.isOnRoad
					&& !this.isOnLandingRoad(state.positionX, state.positionZ))
			{
				this.raceState.transitionTo(RaceState.GameOver);
				this.drivingPhysics.setMaxSpeed(0);
				this.audioService.stopEngine();
				this.audioService.stopMusic();
				this.audioService.playGameOver();
			}
		}

		if (currentState === RaceState.OctopusAttack)
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

		if (currentState === RaceState.Rescue)
		{
			if (state.isGrounded)
			{
				const isOnLanding: boolean =
					this.isOnLandingRoad(
						state.positionX,
						state.positionZ);

				if (!isOnLanding)
				{
					this.raceState.transitionTo(RaceState.GameOver);
					this.drivingPhysics.setMaxSpeed(0);
					this.audioService.stopEngine();
					this.audioService.stopMusic();
					this.audioService.playGameOver();

					return;
				}
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

		if (currentState === RaceState.Victory)
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
	}

	/**
	 * Check whether a position is on the landing road after the octopus.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @returns
	 * True if the position is within the landing road bounds.
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

	/**
	 * Cleans up game loop observer and disposes all services.
	 * @param scene
	 * The Babylon.js scene to clean up.
	 */
	private cleanup(scene: Scene): void
	{
		if (this.gameLoopObserver !== null)
		{
			scene.onBeforeRenderObservable.remove(
				this.gameLoopObserver);
			this.gameLoopObserver = null;
		}

		this.coinService.dispose();
		this.boostService.dispose();
		this.octopusBoss.dispose();
		this.roadCollision.dispose();
		this.trackFeatures.dispose();
		this.raceCamera.dispose();
		this.characterBuilder.dispose();
		this.kartBuilder.dispose();
		this.trackBuilder.dispose();
		this.raceScene.dispose();
		this.drivingPhysics.reset();
		this.inputService.dispose();
		this.audioService.dispose();
	}
}