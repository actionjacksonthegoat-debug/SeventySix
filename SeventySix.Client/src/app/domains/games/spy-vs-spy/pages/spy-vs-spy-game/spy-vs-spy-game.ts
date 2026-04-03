// <copyright file="spy-vs-spy-game.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy vs Spy Game Page Component.
 * Thin controller: initializes the Babylon.js engine and wires scene services.
 * All game logic lives in focused services.
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	inject,
	Signal,
	signal,
	viewChild,
	WritableSignal
} from "@angular/core";
import { RouterLink } from "@angular/router";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { Scene } from "@babylonjs/core/scene";
import { BabylonCanvasComponent } from "@games/shared/components/babylon-canvas/babylon-canvas";
import { FullscreenToggleComponent } from "@games/shared/components/fullscreen-toggle/fullscreen-toggle";
import { DisposableRegistryService } from "@games/shared/services/disposable-registry.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import {
	formatTimerValue,
	formatTimerValuePadded,
	getTimerWarningClass
} from "@games/shared/utilities/timer-display.utility";
import { SpyMobileControlsComponent } from "@games/spy-vs-spy/components/spy-mobile-controls/spy-mobile-controls";
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	AIRSTRIP_RUNWAY_WIDTH,
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	SPY_STARTING_LIVES
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	SpyGameState,
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { FurnitureService } from "@games/spy-vs-spy/services/furniture.service";
import { SpyFlowService } from "@games/spy-vs-spy/services/game-flow.service";
import { IslandSceneService } from "@games/spy-vs-spy/services/island-scene.service";
import { ItemService } from "@games/spy-vs-spy/services/item.service";
import { MinimapService } from "@games/spy-vs-spy/services/minimap.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { SpyBuilderService } from "@games/spy-vs-spy/services/spy-builder.service";
import { SpyCameraService } from "@games/spy-vs-spy/services/spy-camera.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";

/** Mobile tap payload with viewport coordinates. */
interface MobileTapEvent
{
	/** Tap X coordinate in viewport pixels. */
	readonly clientX: number;

	/** Tap Y coordinate in viewport pixels. */
	readonly clientY: number;
}

/** Spy vs Spy island game page — orchestrates scene and service wiring. */
@Component(
	{
		selector: "app-spy-vs-spy-game",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [BabylonCanvasComponent, FullscreenToggleComponent, RouterLink, SpyMobileControlsComponent],
		templateUrl: "./spy-vs-spy-game.html",
		styleUrl: "./spy-vs-spy-game.scss",
		host: {
			"(document:keydown.e)": "onSearch()",
			"(document:keydown.t)": "onPlaceTrap()",
			"(document:keydown.q)": "onCycleTrapType()",
			"(document:keydown.space)": "onCombat($event)"
		}
	})
export class SpyVsSpyGameComponent
{
	/** Whether the browser is currently in fullscreen mode. */
	protected readonly isFullscreen: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Expose SpyGameState enum to the template. */
	protected readonly SpyGameState: typeof SpyGameState = SpyGameState;

	/** Expose TrapType enum to the template. */
	protected readonly TrapType: typeof TrapType = TrapType;

	/** Currently selected trap type for placement (cycles with Q). */
	protected selectedTrapType: TrapType =
		TrapType.Bomb;

	/** Reference to the minimap canvas element. */
	private readonly minimapCanvas: Signal<ElementRef<HTMLCanvasElement> | undefined> =
		viewChild<
			ElementRef<HTMLCanvasElement>>("minimapCanvas");

	/** Destroy ref for cleanup registration. */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/** Disposable registry for batch service cleanup. */
	private readonly disposableRegistry: DisposableRegistryService =
		inject(DisposableRegistryService);

	/** Island scene builder service. */
	private readonly islandScene: IslandSceneService =
		inject(IslandSceneService);

	/** Furniture placement and query service. */
	private readonly furnitureService: FurnitureService =
		inject(FurnitureService);

	/** Top-down camera service. */
	private readonly spyCamera: SpyCameraService =
		inject(SpyCameraService);

	/** Spy mesh builder service. */
	private readonly spyBuilder: SpyBuilderService =
		inject(SpyBuilderService);

	/** Keyboard input service. */
	private readonly inputService: InputService =
		inject(InputService);

	/** Player spy physics service. */
	private readonly spyPhysics: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** AI spy service. */
	private readonly spyAi: SpyAiService =
		inject(SpyAiService);

	/** Mission item service. */
	private readonly itemService: ItemService =
		inject(ItemService);

	/** Game loop service. */
	private readonly gameLoop: GameLoopService =
		inject(GameLoopService);

	/** Game flow orchestration service. */
	private readonly spyFlowService: SpyFlowService =
		inject(SpyFlowService);

	/** Trap management service. */
	private readonly trapService: TrapService =
		inject(TrapService);

	/** Audio feedback service. */
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	/** Minimap rendering service. */
	private readonly minimapService: MinimapService =
		inject(MinimapService);

	/** Current game state for template binding. */
	protected readonly gameState: Signal<SpyGameState> =
		this.spyFlowService.gameState;

	/** Player 1 item count for HUD display. */
	protected readonly player1ItemCount: Signal<number> =
		this.spyFlowService.player1Items;

	/** Player 2 item count for HUD display. */
	protected readonly player2ItemCount: Signal<number> =
		this.spyFlowService.player2Items;

	/** Backward-compatible alias for player 1 items. */
	protected readonly itemCount: Signal<number> =
		this.spyFlowService.player1Items;

	/** Shared island self-destruct timer for HUD. */
	protected readonly islandTimer: Signal<number> =
		this.spyFlowService.islandTimer;

	/** Whether a search is active. */
	protected readonly isSearching: Signal<boolean> =
		this.spyFlowService.isSearching;

	/** Whether combat is active. */
	protected readonly isInCombat: Signal<boolean> =
		this.spyFlowService.isInCombat;

	/** Remaining combat timer in seconds. */
	protected readonly combatTimer: Signal<number> =
		this.spyFlowService.combatTimer;

	/** Combat timer formatted as a whole number for display. */
	protected readonly combatTimerDisplay: Signal<number> =
		computed(() => Math.ceil(this.combatTimer()));

	/** Win/loss reason message for the result screen. */
	protected readonly winReason: Signal<string> =
		this.spyFlowService.winReason;

	/** Current notification message to display. */
	protected readonly notificationMessage: Signal<string> =
		this.spyFlowService.notificationMessage;

	/** Notification CSS color for overlay styling. */
	protected readonly notificationColor: Signal<string> =
		this.spyFlowService.notificationColor;

	/** Player 1 collected remedy count for HUD display. */
	protected readonly player1RemedyCount: Signal<number> =
		this.spyFlowService.player1RemedyCount;

	/** Player 1 remaining lives for HUD display. */
	protected readonly player1Lives: Signal<number> =
		this.spyFlowService.player1Lives;

	/** Player 2 remaining lives for HUD display. */
	protected readonly player2Lives: Signal<number> =
		this.spyFlowService.player2Lives;

	/** Player 1 lives as heart symbols (♥ filled, ♡ empty). */
	protected readonly player1Hearts: Signal<string> =
		computed(
			() =>
				this.buildHeartsDisplay(this.player1Lives()));

	/** Player 2 lives as heart symbols (♥ filled, ♡ empty). */
	protected readonly player2Hearts: Signal<string> =
		computed(
			() =>
				this.buildHeartsDisplay(this.player2Lives()));

	/** Current room name the player is in for HUD display. */
	protected readonly currentRoom: Signal<string> =
		this.spyFlowService.currentRoom;

	/** Remaining stun seconds for the player (0 = not stunned). */
	protected readonly playerStunRemaining: Signal<number> =
		this.spyFlowService.playerStunRemaining;

	/** Stun countdown rounded up to a whole second for display. */
	protected readonly playerStunDisplay: Signal<number> =
		computed(() =>
			Math.ceil(this.playerStunRemaining()));

	/** Whether player is near searchable furniture. */
	protected readonly nearFurniture: Signal<boolean> =
		this.spyFlowService.nearFurniture;

	/** Whether the player has found all 4 mission items. */
	protected readonly allItemsCollected: Signal<boolean> =
		this.spyFlowService.allItemsCollected;

	/** CSS class for the island timer based on remaining time. */
	protected readonly islandTimerClass: Signal<string> =
		computed(
			() =>
				this.getTimerWarningClass(this.islandTimer()));

	/** Island timer formatted as M:SS for HUD display. */
	protected readonly formattedIslandTimer: Signal<string> =
		computed(
			() =>
				formatTimerValue(this.islandTimer()));

	/**
	 * Returns a CSS class based on remaining timer seconds.
	 * @param seconds
	 * Remaining seconds on the personal timer.
	 * @returns
	 * CSS class name: timer-ok, timer-warning, or timer-danger.
	 */
	private getTimerWarningClass(seconds: number): string
	{
		return getTimerWarningClass(seconds);
	}

	/**
	 * Builds a hearts display string representing remaining lives.
	 * Uses filled ♥ for remaining lives and empty ♡ for lost lives.
	 * @param lives
	 * Current remaining lives count.
	 * @returns
	 * A string of heart symbols, e.g. "♥♥♡".
	 */
	private buildHeartsDisplay(lives: number): string
	{
		const filled: string =
			"♥".repeat(Math.max(0, lives));
		const empty: string =
			"♡".repeat(Math.max(0, SPY_STARTING_LIVES - lives));

		return filled + empty;
	}

	/** Formatted elapsed time as MM:SS for HUD display. */
	protected readonly formattedTime: Signal<string> =
		computed(
			() =>
				formatTimerValuePadded(
					this.spyFlowService.elapsedSeconds()));

	/** Countdown value for Ready state overlay. */
	protected readonly countdown: Signal<number> =
		this.spyFlowService.countdownValue;

	/** Whether the minimap has been initialized. */
	private minimapInitialized: boolean = false;

	/** Cached scene reference for trap placement. */
	private scene: Scene | null = null;

	/**
	 * Handle Babylon.js scene initialization.
	 * Called when the canvas component emits the ready scene.
	 * @param scene
	 * The initialized Babylon.js Scene instance.
	 */
	onSceneReady(scene: Scene): void
	{
		this.scene = scene;

		this.islandScene.initialize(scene);
		this.furnitureService.initialize(scene);

		const blackSpyNode: import("@babylonjs/core/Meshes/transformNode").TransformNode =
			this.spyBuilder.buildSpy(
				scene,
				SpyIdentity.Black);
		const whiteSpyNode: import("@babylonjs/core/Meshes/transformNode").TransformNode =
			this.spyBuilder.buildSpy(
				scene,
				SpyIdentity.White);

		this.spyCamera.initialize(scene, blackSpyNode);

		this.spyPhysics.initialize(
			blackSpyNode,
			BLACK_SPY_SPAWN_X,
			BLACK_SPY_SPAWN_Z);
		this.spyAi.initialize(scene, whiteSpyNode);
		this.spyFlowService.initializeVisuals(
			scene,
			blackSpyNode,
			whiteSpyNode);
		this.spyFlowService.restartGame();
		this.itemService.initializeItems(scene);
		this.inputService.initialize();

		this.gameLoop.initialize(scene);

		this.gameLoop.onUpdate =
			(deltaTimeMs: number): void =>
			{
				const dt: number =
					deltaTimeMs / 1000;
				this.spyFlowService.update(dt);

				if (this.spyFlowService.gameState() === SpyGameState.Playing)
				{
					this.spyPhysics.update(
						this.inputService.keys,
						dt);

					this.initializeMinimapIfNeeded();
					this.minimapService.update(
						blackSpyNode.position.x,
						blackSpyNode.position.z);
					this.spyCamera.updateTarget(blackSpyNode);
				}
			};

		this.gameLoop.start();

		this.registerDisposables();

		this.destroyRef.onDestroy(
			() => this.cleanup());
	}

	/**
	 * Register all disposable services for batch cleanup on destroy.
	 */
	private registerDisposables(): void
	{
		this.disposableRegistry.register(this.minimapService);
		this.disposableRegistry.register(this.islandScene);
		this.disposableRegistry.register(this.furnitureService);
		this.disposableRegistry.register(this.spyCamera);
		this.disposableRegistry.register(this.spyBuilder);
		this.disposableRegistry.register(this.audioService);
		this.disposableRegistry.register(this.trapService);
		this.disposableRegistry.register(this.itemService);
		this.disposableRegistry.register(this.spyPhysics);
		this.disposableRegistry.register(this.spyAi);
		this.disposableRegistry.register(this.inputService);
		this.disposableRegistry.register(this.gameLoop);
	}

	/**
	 * Handle start game button click.
	 * Delegates to SpyFlowService to begin the game.
	 */
	onStartGame(): void
	{
		this.spyFlowService.startGame();
		this.audioService.playSoundtrack();
	}

	/**
	 * Handle restart game button click.
	 * Delegates to SpyFlowService to reset and return to Idle.
	 */
	onRestartGame(): void
	{
		this.spyFlowService.restartGame();
	}

	/**
	 * Handle search via E key.
	 * Triggers a furniture search at the active player's position.
	 */
	protected onSearch(): void
	{
		this.spyFlowService.triggerSearch();
	}

	/**
	 * Handle trap placement via T key.
	 * Places selected trap type into nearest furniture.
	 */
	protected onPlaceTrap(): void
	{
		this.spyFlowService.triggerTrapPlacement(this.selectedTrapType);
	}

	/**
	 * Cycle trap type selection via Q key.
	 * Toggles between Bomb and SpringTrap.
	 */
	protected onCycleTrapType(): void
	{
		this.selectedTrapType =
			this.selectedTrapType === TrapType.Bomb
				? TrapType.SpringTrap
				: TrapType.Bomb;
	}

	/**
	 * Handle combat via Space key.
	 * Initiates combat if spies are in proximity.
	 * @param event
	 * The keyboard event (prevented to stop scrolling).
	 */
	protected onCombat(event: Event): void
	{
		event.preventDefault();
		this.spyFlowService.triggerCombat();
	}

	/**
	 * Handle mobile tap gesture for movement and interaction.
	 * @param tap
	 * Mobile tap coordinates in viewport pixels.
	 */
	protected onMobileTap(tap: MobileTapEvent): void
	{
		if (this.gameState() !== SpyGameState.Playing)
		{
			return;
		}

		if (this.nearFurniture())
		{
			this.spyFlowService.triggerSearch();
			return;
		}

		const worldPoint: { x: number; z: number; } | null =
			this.pickWorldPointFromTap(tap.clientX, tap.clientY);

		if (worldPoint == null)
		{
			return;
		}

		this.spyPhysics.setMoveTarget(worldPoint.x, worldPoint.z);

		if (
			this.allItemsCollected()
				&& this.isWithinAirstripRunway(worldPoint.x, worldPoint.z))
		{
			this.spyPhysics.resetPosition(worldPoint.x, worldPoint.z);
		}
	}

	/**
	 * Checks whether a world-space position is within runway bounds.
	 * @param positionX
	 * World-space X coordinate.
	 * @param positionZ
	 * World-space Z coordinate.
	 * @returns
	 * True when inside the runway rectangle.
	 */
	private isWithinAirstripRunway(
		positionX: number,
		positionZ: number): boolean
	{
		const halfRunwayLength: number =
			AIRSTRIP_RUNWAY_LENGTH / 2;
		const halfRunwayWidth: number =
			AIRSTRIP_RUNWAY_WIDTH / 2;
		const withinX: boolean =
			positionX >= AIRSTRIP_CENTER_X - halfRunwayLength
				&& positionX <= AIRSTRIP_CENTER_X + halfRunwayLength;
		const withinZ: boolean =
			positionZ >= AIRSTRIP_CENTER_Z - halfRunwayWidth
				&& positionZ <= AIRSTRIP_CENTER_Z + halfRunwayWidth;

		return withinX && withinZ;
	}

	/**
	 * Convert a screen-space tap into a world-space point on island or runway meshes.
	 * @param clientX
	 * Tap X coordinate in viewport pixels.
	 * @param clientY
	 * Tap Y coordinate in viewport pixels.
	 * @returns
	 * World-space X/Z point, or null when no valid hit exists.
	 */
	private pickWorldPointFromTap(
		clientX: number,
		clientY: number): { x: number; z: number; } | null
	{
		if (this.scene == null)
		{
			return null;
		}

		const pickResult: PickingInfo =
			this.scene.pick(
				clientX,
				clientY,
				(mesh) =>
					mesh.name === "island-ground"
						|| mesh.name === "airstrip-runway");

		if (
			pickResult == null
				|| !pickResult.hit
				|| pickResult.pickedPoint == null)
		{
			return null;
		}

		return {
			x: pickResult.pickedPoint.x,
			z: pickResult.pickedPoint.z
		};
	}

	/**
	 * Initializes the minimap canvas on first Playing frame.
	 * Deferred because the canvas is conditionally rendered.
	 */
	private initializeMinimapIfNeeded(): void
	{
		if (this.minimapInitialized)
		{
			return;
		}

		const canvasRef: ElementRef<HTMLCanvasElement> | undefined =
			this.minimapCanvas();

		if (canvasRef != null)
		{
			this.minimapService.initialize(canvasRef.nativeElement);
			this.minimapInitialized = true;
		}
	}

	/**
	 * Clean up all game resources.
	 */
	private cleanup(): void
	{
		this.spyFlowService.restartGame();
		this.disposableRegistry.disposeAll();
	}
}