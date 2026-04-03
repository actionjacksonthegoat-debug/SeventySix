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
	CHARACTER_STANDING_FOOT_OFFSET,
	KART_GROUND_OFFSET,
	LANDING_ROAD_LENGTH,
	OCTOPUS_SPAWN_OFFSET_Z,
	RESCUE_PLATFORM_HEIGHT,
	RESCUE_PLATFORM_OFFSET_Z,
	RESCUE_ZONE_RADIUS
} from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	CharacterType,
	KartColor,
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
import { DisposableRegistryService } from "@games/shared/services/disposable-registry.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";

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

	/** Disposable registry for batch service cleanup. */
	private readonly disposableRegistry: DisposableRegistryService =
		inject(DisposableRegistryService);

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

		if (this.kartRoot !== null)
		{
			this.gameFlow.setContext(
				scene,
				this.kartRoot,
				this.rescueCenter);
		}

		this.startGameLoop(scene);

		this.disposableRegistry.register(this.audioService);
		this.disposableRegistry.register(this.inputService);
		this.disposableRegistry.register(this.raceScene);
		this.disposableRegistry.register(this.trackBuilder);
		this.disposableRegistry.register(this.kartBuilder);
		this.disposableRegistry.register(this.characterBuilder);
		this.disposableRegistry.register(this.raceCamera);
		this.disposableRegistry.register(this.trackFeatures);
		this.disposableRegistry.register(this.roadCollision);
		this.disposableRegistry.register(this.octopusBoss);
		this.disposableRegistry.register(this.boostService);
		this.disposableRegistry.register(this.coinService);
		this.disposableRegistry.register(this.gameLoop);

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
		this.gameFlow.resetForNewRace();
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
		this.gameFlow.update(deltaTime);
	}

	/**
	 * Cleans up the game loop and disposes all services.
	 */
	private cleanup(): void
	{
		this.drivingPhysics.reset();
		this.disposableRegistry.disposeAll();
	}
}