/**
 * Car-a-Lot Game Page Component.
 * Smart container that hosts the Babylon.js canvas, driving HUD, and color selector.
 * Orchestrates scene initialization and game loop.
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, WritableSignal } from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { ColorSelectorComponent } from "@games/car-a-lot/components/color-selector/color-selector";
import { DrivingHudComponent } from "@games/car-a-lot/components/driving-hud/driving-hud";
import { MobileControlsComponent } from "@games/car-a-lot/components/mobile-controls/mobile-controls";
import {
	BUMPER_WIDTH,
	CHARACTER_STANDING_FOOT_OFFSET,
	KART_GROUND_OFFSET,
	LANDING_ROAD_LENGTH,
	MAX_SPEED_MPH,
	OCTOPUS_SPAWN_OFFSET_Z,
	RESCUE_PLATFORM_HEIGHT,
	RESCUE_PLATFORM_OFFSET_Z,
	RESCUE_ZONE_RADIUS
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
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { BabylonCanvasComponent } from "@games/shared/components/babylon-canvas/babylon-canvas";
import { FullscreenToggleComponent } from "@games/shared/components/fullscreen-toggle/fullscreen-toggle";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";

import { isPresent } from "@shared/utilities/null-check.utility";

/** Car-a-Lot driving game page — orchestrates scene, HUD, and selectors. */
@Component(
	{
		selector: "app-car-a-lot-game",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			BabylonCanvasComponent,
			DrivingHudComponent,
			ColorSelectorComponent,
			FullscreenToggleComponent,
			MobileControlsComponent
		],
		templateUrl: "./car-a-lot-game.html",
		styleUrl: "./car-a-lot-game.scss"
	})
export class CarALotGameComponent
{
	/** Whether the browser is currently in fullscreen mode. */
	protected readonly isFullscreen: WritableSignal<boolean> =
		signal<boolean>(false);

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

	/** Game flow coordinator — handles state transitions each frame. */
	private readonly gameFlow: GameFlowService =
		inject(GameFlowService);

	/** Shared game loop — manages the Babylon.js render observable. */
	private readonly gameLoop: GameLoopService =
		inject(GameLoopService);

	/** Reference to the kart root node for game loop position updates. */
	private kartRoot: TransformNode | null = null;

	/** Rescue platform center position for auto-stop. */
	private rescueCenter: Vector3 =
		Vector3.Zero();

	/** Reference to the scene for restart. */
	private scene: Scene | null = null;

	/** Last countdown value for bing sound detection. */
	private lastCountdownValue: number = -1;

	/** Whether the victory standing character has been shown for the current race. */
	private victoryCharacterShown: boolean = false;

	/** Reference to the rescue character root node for rebuild on character change. */
	private rescueCharRoot: TransformNode | null = null;

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

		this.raceScene.createLandingRoad(
			scene,
			octopusPosition);

		// Bumpers run from the octopus to just before the victory circle, then
		// resume after the victory circle into the castle — leaving the circle
		// area bump-free.
		const beforeCircleLength: number =
			RESCUE_PLATFORM_OFFSET_Z - RESCUE_ZONE_RADIUS;
		const afterCircleStartOffset: number =
			RESCUE_PLATFORM_OFFSET_Z + RESCUE_ZONE_RADIUS;
		const afterCircleLength: number =
			LANDING_ROAD_LENGTH - afterCircleStartOffset;

		const landingRoadSegments: RoadSegment[] =
			[
				{
					positionX: octopusPosition.x,
					positionZ: octopusPosition.z + beforeCircleLength / 2,
					length: beforeCircleLength,
					rotationY: 0,
					isFork: false,
					elevation: 0
				},
				{
					positionX: octopusPosition.x,
					positionZ: octopusPosition.z + afterCircleStartOffset + afterCircleLength / 2,
					length: afterCircleLength,
					rotationY: 0,
					isFork: false,
					elevation: 0
				}
			];

		this.roadCollision.createBumpers(
			scene,
			landingRoadSegments);

		this.gameFlow.initialize(
			octopusPosition.x,
			octopusPosition.z,
			landingRoadSegments);

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
			RESCUE_PLATFORM_HEIGHT + CHARACTER_STANDING_FOOT_OFFSET;
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
			() => this.cleanup());
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
				RESCUE_PLATFORM_HEIGHT + CHARACTER_STANDING_FOOT_OFFSET;
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

		// Move kart to start position immediately so it is at start
		// during the countdown rather than snapping there after GO!.
		if (this.kartRoot !== null)
		{
			this.kartRoot.position =
				new Vector3(0, KART_GROUND_OFFSET, 0);
			this.kartRoot.rotation.y = 0;
		}

		// Rebuild seated character on kart using current selection
		// (victory standing disposed the seated character).
		this.characterBuilder.setCharacterType(
			this.raceState.characterType());

		// Rebuild rescue character at platform position.
		if (this.scene !== null)
		{
			if (this.rescueCharRoot !== null)
			{
				this.rescueCharRoot.dispose();
			}

			const newRescue: TransformNode =
				this.characterBuilder.createRescueCharacter(this.scene);
			const rescuePosition: Vector3 =
				this.rescueCenter.clone();
			rescuePosition.y =
				RESCUE_PLATFORM_HEIGHT + CHARACTER_STANDING_FOOT_OFFSET;
			newRescue.position = rescuePosition;
			this.rescueCharRoot = newRescue;
		}

		this.raceState.startCountdown();
		this.lastCountdownValue = 3;
		this.victoryCharacterShown = false;
		this.audioService.playCountdownBing(false);
	}

	/**
	 * Starts the main game loop via the shared GameLoopService.
	 * @param scene
	 * The Babylon.js scene to attach the game loop to.
	 */
	private startGameLoop(scene: Scene): void
	{
		this.gameLoop.initialize(scene);
		this.gameLoop.onUpdate =
			(deltaTimeMs: number) =>
				this.onFrameUpdate(deltaTimeMs / 1000);
		this.gameLoop.start();
	}

	/**
	 * Per-frame update — called by GameLoopService each render tick.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private onFrameUpdate(deltaTime: number): void
	{
		const currentState: RaceState =
			this.raceState.currentState();

		if (
			this.handleCountdown(
				deltaTime,
				currentState))
		{
			return;
		}

		this.showVictoryCharacterOnFirstFrame(currentState);

		const state: DrivingState =
			this.updatePhysics(
				deltaTime,
				currentState);

		this.updateVisuals(
			state,
			deltaTime);

		const boundary: RoadBoundaryResult =
			this.roadCollision.checkRoadBoundary(
				state.positionX,
				state.positionZ,
				this.trackBuilder.getSegments());

		this.handleCollisions(
			state,
			currentState,
			boundary);

		this.updateItems(
			state,
			deltaTime);

		this.octopusBoss.updateAnimation(deltaTime);

		this.gameFlow.update(
			state,
			currentState,
			boundary,
			deltaTime,
			this.rescueCenter);
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

		// Keep camera lerping toward the kart so it returns to the
		// start position during the 3-2-1 countdown.
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
			this.kartRoot.position =
				new Vector3(
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
	 */
	private updateVisuals(
		state: DrivingState,
		deltaTime: number): void
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

		const currentState: RaceState =
			this.raceState.currentState();

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
	 * Cleans up the game loop and disposes all services.
	 */
	private cleanup(): void
	{
		this.gameLoop.dispose();
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