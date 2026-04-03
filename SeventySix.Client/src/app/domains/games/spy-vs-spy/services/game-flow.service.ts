// <copyright file="game-flow.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Game Flow Service (SpyFlowService).
 * Orchestrates the Spy vs Spy two-player turn-based game lifecycle.
 * Single Responsibility: state transitions, turn orchestration,
 * win/lose evaluation, and wiring of TurnService, SearchService, CombatService.
 * Delegates AI coordination, search result handling, and damage effects
 * to SpyAiCoordinatorService, SpySearchHandlerService, and SpyDamageHandlerService.
 */

import { inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { CountdownHelper, CountdownTickResult } from "@games/shared/utilities/countdown.utility";
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	AIRSTRIP_RUNWAY_WIDTH,
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	COUNTDOWN_DURATION_SECONDS,
	GAME_TIMER_SECONDS,
	ISLAND_ROOMS,
	REQUIRED_ITEM_COUNT,
	SPY_STARTING_LIVES
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	CombatResult,
	RemedyType,
	RoomId,
	SpyGameState,
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	FurnitureDefinition,
	SearchAttemptResult,
	SpyPhysicsState,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { SearchOutcome } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { AirplaneService } from "@games/spy-vs-spy/services/airplane.service";
import { CombatService } from "@games/spy-vs-spy/services/combat.service";
import { ExplosionService } from "@games/spy-vs-spy/services/explosion.service";
import { FurnitureService } from "@games/spy-vs-spy/services/furniture.service";
import { ItemService } from "@games/spy-vs-spy/services/item.service";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiCoordinatorService } from "@games/spy-vs-spy/services/spy-ai-coordinator.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { SpyCameraService } from "@games/spy-vs-spy/services/spy-camera.service";
import { SpyDamageHandlerService } from "@games/spy-vs-spy/services/spy-damage-handler.service";
import { SpyInventoryService } from "@games/spy-vs-spy/services/spy-inventory.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { type LifeChange, SpySearchOutcomeService } from "@games/spy-vs-spy/services/spy-search-outcome.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";
import { TurnService } from "@games/spy-vs-spy/services/turn.service";

/**
 * Orchestrates the Spy vs Spy two-player turn-based game lifecycle.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyFlowService
{
	/** Player spy physics service. */
	private readonly spyPhysics: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** AI spy service. */
	private readonly spyAi: SpyAiService =
		inject(SpyAiService);

	/** Mission item service. */
	private readonly itemService: ItemService =
		inject(ItemService);

	/** Trap management service. */
	private readonly trapService: TrapService =
		inject(TrapService);

	/** Airplane creation and takeoff animation service. */
	private readonly airplaneService: AirplaneService =
		inject(AirplaneService);

	/** Explosion visual effects service. */
	private readonly explosionService: ExplosionService =
		inject(ExplosionService);

	/** Camera control service for pan/zoom during cutscenes. */
	private readonly cameraService: SpyCameraService =
		inject(SpyCameraService);

	/** Audio feedback service. */
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	/** Turn management service. */
	private readonly turnService: TurnService =
		inject(TurnService);

	/** Furniture search service. */
	private readonly searchService: SearchService =
		inject(SearchService);

	/** Combat service. */
	private readonly combatService: CombatService =
		inject(CombatService);

	/** Furniture spatial queries. */
	private readonly furnitureService: FurnitureService =
		inject(FurnitureService);

	/** AI coordination service for delegated AI updates. */
	private readonly aiCoordinator: SpyAiCoordinatorService =
		inject(SpyAiCoordinatorService);

	/** Search result handler with notification and overlay management. */
	private readonly searchHandler: SpySearchHandlerService =
		inject(SpySearchHandlerService);

	/** Damage handler for stun/death visual effects and combat resolution. */
	private readonly damageHandler: SpyDamageHandlerService =
		inject(SpyDamageHandlerService);

	/** Per-player item and remedy inventory manager. */
	private readonly inventoryService: SpyInventoryService =
		inject(SpyInventoryService);

	/** Search outcome handler — applies items, traps, remedies, and item drops. */
	private readonly searchOutcomeService: SpySearchOutcomeService =
		inject(SpySearchOutcomeService);

	/* ─── Private Writable Signals ─────────────────────────────────────── */

	/** Current game state writable signal. */
	private readonly gameStateSignal: WritableSignal<SpyGameState> =
		signal<SpyGameState>(SpyGameState.Idle);

	/** Elapsed game time in seconds (Playing state only). */
	private readonly elapsedSecondsSignal: WritableSignal<number> =
		signal<number>(0);

	/** Countdown value for Ready state HUD display. */
	private readonly countdownValueSignal: WritableSignal<number> =
		signal<number>(COUNTDOWN_DURATION_SECONDS);

	/** Whether player is near searchable furniture. */
	private readonly nearFurnitureSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Player 1 (Black spy) remaining lives. */
	private readonly player1LivesSignal: WritableSignal<number> =
		signal<number>(SPY_STARTING_LIVES);

	/** Player 2 (White spy / AI) remaining lives. */
	private readonly player2LivesSignal: WritableSignal<number> =
		signal<number>(SPY_STARTING_LIVES);

	/** Short reason message for the win/loss result screen. */
	private readonly winReasonSignal: WritableSignal<string> =
		signal<string>("");

	/** Current room name the player is standing in (empty = outside rooms). */
	private readonly currentRoomSignal: WritableSignal<string> =
		signal<string>("");

	/** Remaining stun seconds for the player (0 = not stunned). */
	private readonly playerStunRemainingSignal: WritableSignal<number> =
		signal<number>(0);

	/* ─── Private State ────────────────────────────────────────────────── */

	/** Countdown timer for Ready state. */
	private readonly countdown: CountdownHelper =
		new CountdownHelper(COUNTDOWN_DURATION_SECONDS);

	/** Babylon.js scene reference for visual effects. */
	private sceneRef: Scene | null = null;

	/** Player 1 (Black spy) TransformNode for visual effects. */
	private player1Node: TransformNode | null = null;

	/** Parked airplane TransformNode for escape cinematic. */
	private airplaneNode: TransformNode | null = null;

	/* ─── Public Readonly Signals ──────────────────────────────────────── */

	/** Readonly signal — current game state. */
	readonly gameState: Signal<SpyGameState> =
		this.gameStateSignal.asReadonly();

	/** Readonly signal — elapsed seconds. */
	readonly elapsedSeconds: Signal<number> =
		this.elapsedSecondsSignal.asReadonly();

	/** Readonly signal — countdown value during Ready state. */
	readonly countdownValue: Signal<number> =
		this.countdownValueSignal.asReadonly();

	/** Readonly signal — player 1 item count (delegated to SpyInventoryService). */
	readonly player1Items: Signal<number> =
		this.inventoryService.player1ItemCount;

	/** Readonly signal — player 2 item count (delegated to SpyInventoryService). */
	readonly player2Items: Signal<number> =
		this.inventoryService.player2ItemCount;

	/** Readonly signal — shared island self-destruct timer. */
	readonly islandTimer: Signal<number> =
		this.turnService.islandTimer;

	/** Readonly signal — whether a search is active. */
	readonly isSearching: Signal<boolean> =
		this.searchHandler.isSearching;

	/** Readonly signal — active notification message (empty = hidden). */
	readonly notificationMessage: Signal<string> =
		this.searchHandler.notificationMessage;

	/** Readonly signal — notification CSS color. */
	readonly notificationColor: Signal<string> =
		this.searchHandler.notificationColor;

	/** Readonly signal — player 1 collected remedy count (delegated to SpyInventoryService). */
	readonly player1RemedyCount: Signal<number> =
		this.inventoryService.player1RemedyCount;

	/** Readonly signal — whether player is near searchable furniture. */
	readonly nearFurniture: Signal<boolean> =
		this.nearFurnitureSignal.asReadonly();

	/** Readonly signal — player 1 remaining lives. */
	readonly player1Lives: Signal<number> =
		this.player1LivesSignal.asReadonly();

	/** Readonly signal — player 2 remaining lives. */
	readonly player2Lives: Signal<number> =
		this.player2LivesSignal.asReadonly();

	/** Readonly signal — win/loss reason message for result screen. */
	readonly winReason: Signal<string> =
		this.winReasonSignal.asReadonly();

	/** Readonly signal — whether combat is active. */
	readonly isInCombat: Signal<boolean> =
		this.combatService.isInCombat;

	/** Readonly signal — remaining combat timer in seconds. */
	readonly combatTimer: Signal<number> =
		this.combatService.combatTimer;

	/** Readonly signal — display name of the room the player is currently in. */
	readonly currentRoom: Signal<string> =
		this.currentRoomSignal.asReadonly();

	/** Readonly signal — player stun countdown in seconds (0 = not stunned). */
	readonly playerStunRemaining: Signal<number> =
		this.playerStunRemainingSignal.asReadonly();

	/** Readonly signal — whether the player has found all 4 mission items (delegated to SpyInventoryService). */
	readonly allItemsCollected: Signal<boolean> =
		this.inventoryService.allItemsCollected;

	/** Backward-compatible alias for player 1 item count. */
	readonly playerItemCount: Signal<number> =
		this.inventoryService.player1ItemCount;

	/**
	 * Stores scene and spy node references for visual effects and win condition checking.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param blackSpyNode
	 * Player 1 (Black) TransformNode.
	 * @param whiteSpyNode
	 * Player 2 (White / AI) TransformNode.
	 */
	initializeVisuals(
		scene: Scene,
		blackSpyNode: TransformNode,
		whiteSpyNode: TransformNode): void
	{
		this.sceneRef = scene;
		this.player1Node = blackSpyNode;
		this.damageHandler.initializeVisuals(scene, blackSpyNode, whiteSpyNode);
		this.explosionService.initialize(scene);
		this.airplaneService.initialize(scene);
		this.airplaneNode =
			this.airplaneService.createParkedAirplane();
	}

	/**
	 * Begins the game — transitions from Idle to Ready (countdown phase).
	 */
	startGame(): void
	{
		this.gameStateSignal.set(SpyGameState.Ready);
		this.countdown.reset();
		this.countdownValueSignal.set(COUNTDOWN_DURATION_SECONDS);
		this.elapsedSecondsSignal.set(0);
		this.turnService.initialize(GAME_TIMER_SECONDS);
		this.searchService.initialize(
			this.itemService.getUncollectedItems(),
			[TrapType.Bomb, TrapType.Bomb, TrapType.SpringTrap],
			[RemedyType.WireCutters, RemedyType.Shield]);
	}

	/**
	 * Per-frame update. Handles countdown, turn-based movement,
	 * search/combat resolution, and win/lose evaluation.
	 * @param deltaTime
	 * Time elapsed since last frame in seconds.
	 */
	update(deltaTime: number): void
	{
		const currentState: SpyGameState =
			this.gameStateSignal();

		if (currentState === SpyGameState.Ready)
		{
			this.updateCountdown(deltaTime);
			return;
		}

		if (currentState !== SpyGameState.Playing)
		{
			return;
		}

		this.elapsedSecondsSignal.update(
			(elapsed: number) => elapsed + deltaTime);

		/* If combat is active, resolve it when timer expires. */
		if (this.combatService.isInCombat())
		{
			const combatFinished: boolean =
				this.combatService.update(deltaTime);

			if (combatFinished)
			{
				this.resolveCombat();
			}
		}

		/* Update turn timer (always ticks, even during combat). */
		this.turnService.update(deltaTime);

		this.updateNonCombatGameLogic(deltaTime);

		/* Sync AI personal timer. */
		this.spyAi.setPersonalTimer(
			this.turnService.islandTimer());

		/* Update furniture proximity indicator. */
		this.updateFurnitureProximity();

		/* Check win/lose conditions. */
		this.checkWinCondition();
		this.checkLoseCondition();
		this.checkTimerExpiry();
		this.checkLivesExpiry();
	}

	/**
	 * Updates non-combat game logic: AI movement and search result handling.
	 * @param deltaTime
	 * Time elapsed since last frame in seconds.
	 */
	private updateNonCombatGameLogic(deltaTime: number): void
	{
		if (this.combatService.isInCombat())
		{
			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();
		const playerSpyState: Readonly<SpyState> =
			this.aiCoordinator.buildPlayerSpyState(
				playerState,
				this.determineRoom(
					playerState.positionX,
					playerState.positionZ) ?? RoomId.JungleHQ,
				this.inventoryService.getItems(SpyIdentity.Black),
				this.inventoryService.getRemedies(SpyIdentity.Black),
				this.turnService.islandTimer());
		const aiSearchResult: SearchAttemptResult | null =
			this.aiCoordinator.updateAi(deltaTime, playerSpyState);

		if (aiSearchResult != null)
		{
			this.handleSearchResult(aiSearchResult, false);
		}
	}

	/**
	 * Trigger a search at the player's position.
	 * Called from component when E key is pressed.
	 * Always searches as Player 1 (human) — AI searching
	 * is handled internally via the AI coordinator.
	 */
	triggerSearch(): void
	{
		if (this.gameStateSignal() !== SpyGameState.Playing)
		{
			return;
		}

		if (this.combatService.isInCombat())
		{
			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();
		const result: SearchAttemptResult | null =
			this.searchService.searchNearby(
				playerState.positionX,
				playerState.positionZ,
				this.inventoryService.getRemedies(SpyIdentity.Black),
				SpyIdentity.Black);

		if (result == null)
		{
			return;
		}

		this.audioService.playSearch();
		this.searchHandler.showSearchOverlay();
		this.handleSearchResult(result, true);
	}

	/**
	 * Place a trap into nearby furniture.
	 * Called from component when T key is pressed.
	 * @param trapType
	 * The type of trap to place.
	 */
	triggerTrapPlacement(trapType: TrapType): void
	{
		if (this.gameStateSignal() !== SpyGameState.Playing)
		{
			return;
		}

		if (this.combatService.isInCombat())
		{
			return;
		}

		if (!this.trapService.canPlaceTrap(SpyIdentity.Black, trapType))
		{
			this.searchHandler.showNotification(
				"No traps of this type!",
				900,
				"#888");

			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();

		const placed: boolean =
			this.searchService.placeTrapInFurniture(
				playerState.positionX,
				playerState.positionZ,
				trapType,
				SpyIdentity.Black);

		if (placed)
		{
			this.trapService.consumeTrap(SpyIdentity.Black, trapType);

			const trapName: string =
				trapType === TrapType.Bomb
					? "Bomb"
					: "Spring Trap";
			this.searchHandler.showNotification(
				`${trapName} placed!`,
				1200,
				"#ff0");
			this.audioService.playItemCollected();
		}
		else
		{
			this.searchHandler.showNotification(
				"No furniture nearby!",
				900,
				"#888");
		}
	}

	/**
	 * Trigger combat between the two spies.
	 * Called from component when Space key is pressed.
	 */
	triggerCombat(): void
	{
		if (this.gameStateSignal() !== SpyGameState.Playing)
		{
			return;
		}

		if (this.combatService.isInCombat())
		{
			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();
		const aiState: Readonly<SpyState> =
			this.spyAi.getState();

		const canFight: boolean =
			this.combatService.canEngage(
				playerState.positionX,
				playerState.positionZ,
				aiState.positionX,
				aiState.positionZ);

		if (!canFight)
		{
			return;
		}

		this.combatService.startCombat();
	}

	/**
	 * Resets game to Idle state and clears all state.
	 */
	restartGame(): void
	{
		this.gameStateSignal.set(SpyGameState.Idle);
		this.elapsedSecondsSignal.set(0);
		this.countdownValueSignal.set(COUNTDOWN_DURATION_SECONDS);
		this.inventoryService.reset();
		this.nearFurnitureSignal.set(false);
		this.player1LivesSignal.set(SPY_STARTING_LIVES);
		this.player2LivesSignal.set(SPY_STARTING_LIVES);
		this.countdown.reset();
		this.winReasonSignal.set("");
		this.currentRoomSignal.set("");
		this.playerStunRemainingSignal.set(0);

		/* Delegate sub-service resets. */
		this.searchHandler.dispose();
		this.aiCoordinator.reset();
		this.trapService.reset();
		this.turnService.reset();
		this.combatService.reset();
		this.searchService.dispose();
		this.explosionService.dispose();

		if (this.sceneRef != null)
		{
			this.explosionService.initialize(this.sceneRef);
		}

		/* Reset spy positions to spawn points. */
		this.spyPhysics.resetPosition(
			BLACK_SPY_SPAWN_X,
			BLACK_SPY_SPAWN_Z);
		this.spyAi.reset();

		/* Re-spawn items with fresh positions. */
		if (this.sceneRef != null)
		{
			this.itemService.reset(this.sceneRef);
		}

		/* Re-initialize search service with fresh item distribution. */
		this.searchService.initialize(
			this.itemService.getUncollectedItems(),
			[TrapType.Bomb, TrapType.Bomb, TrapType.SpringTrap],
			[RemedyType.WireCutters, RemedyType.Shield]);
	}

	/**
	 * Returns current game state (for non-signal usage in tests).
	 * @returns
	 * The current SpyGameState.
	 */
	getState(): SpyGameState
	{
		return this.gameState();
	}

	/**
	 * Handles countdown timer in Ready state.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private updateCountdown(deltaTime: number): void
	{
		const result: CountdownTickResult =
			this.countdown.update(deltaTime);

		if (result.valueChanged)
		{
			this.countdownValueSignal.set(this.countdown.currentValue);
		}

		if (result.completed)
		{
			this.gameStateSignal.set(SpyGameState.Playing);
			this.elapsedSecondsSignal.set(0);
			this.searchHandler.showNotification("GO!", 800, "#0f0");
		}
	}

	/**
	 * Handles the result of a search attempt using the search handler.
	 * Delegates outcome application to SpySearchOutcomeService and applies life changes.
	 * @param result
	 * The search attempt result.
	 * @param isPlayer1
	 * Whether the searching player is player 1.
	 */
	private handleSearchResult(
		result: SearchAttemptResult,
		isPlayer1: boolean): void
	{
		const outcome: SearchOutcome =
			this.searchHandler.handleSearchResult(result, isPlayer1);

		const lifeChanges: LifeChange[] =
			this.searchOutcomeService.applyOutcome(outcome, isPlayer1);

		for (const change of lifeChanges)
		{
			this.applyLifeChange(change);
		}
	}

	/**
	 * Applies a life-change delta returned by search outcome or combat resolution.
	 * @param change
	 * The life change to apply.
	 */
	private applyLifeChange(change: LifeChange): void
	{
		const signal: WritableSignal<number> =
			change.identity === SpyIdentity.Black
				? this.player1LivesSignal
				: this.player2LivesSignal;

		signal.update(
			(lives: number) =>
				Math.max(0, lives + change.delta));
	}

	/**
	 * Resolves combat when the combat timer expires.
	 * Delegates stun application to the damage handler and handles life/notification changes.
	 */
	private resolveCombat(): void
	{
		const result: CombatResult =
			this.damageHandler.resolveCombat();

		if (result === CombatResult.Player1Wins)
		{
			this.searchHandler.showNotification(
				"You defeated the spy!",
				1500,
				"#0f0");
			this.applyLifeChange(
				{ identity: SpyIdentity.White, delta: -1 });
		}
		else
		{
			this.searchHandler.showNotification(
				"Spy defeated you!",
				1500,
				"#f00");
			this.applyLifeChange(
				{ identity: SpyIdentity.Black, delta: -1 });
		}
	}

	/**
	 * Updates the furniture proximity indicator signal.
	 * Checks if the player is near any searchable furniture.
	 * Also tracks the player's current room for HUD display.
	 */
	private updateFurnitureProximity(): void
	{
		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();

		const nearby: FurnitureDefinition | null =
			this.furnitureService.getNearbyFurniture(
				playerState.positionX,
				playerState.positionZ);

		this.nearFurnitureSignal.set(nearby !== null);

		const room: RoomId | null =
			this.determineRoom(
				playerState.positionX,
				playerState.positionZ);
		this.currentRoomSignal.set(
			room !== null ? this.getRoomDisplayName(room) : "");

		this.playerStunRemainingSignal.set(
			playerState.stunRemainingSeconds);
	}

	/**
	 * Checks if player 1 (Black spy) has won — all items + airstrip zone.
	 * Transitions to Escaping state to trigger plane takeoff animation.
	 */
	private checkWinCondition(): void
	{
		if (!this.inventoryService.hasAllItems(SpyIdentity.Black))
		{
			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();

		if (!this.isWithinAirstripRunway(playerState.positionX, playerState.positionZ))
		{
			return;
		}

		this.winReasonSignal.set("You collected all 4 items and escaped!");
		this.gameStateSignal.set(SpyGameState.Escaping);
		this.audioService.playWon();

		if (this.player1Node != null)
		{
			this.player1Node.setEnabled(false);
		}

		this.startEscapeAnimation();
	}

	/**
	 * Starts the plane takeoff, camera pan-back, and island explosion sequence.
	 * Called after the player has won and boarded the plane.
	 */
	private startEscapeAnimation(): void
	{
		/* Attach chase camera behind the airplane for spy's POV during takeoff. */
		if (this.airplaneNode != null)
		{
			this.cameraService.focusOnAirplane(this.airplaneNode);
			this.cameraService.attachToAirplane(this.airplaneNode);
		}

		this.airplaneService.animateTakeoff(
			() =>
			{
				/* onLeavesIsland — plane has cleared the island. Detach chase cam, pan back, explode. */
				this.cameraService.detachFromAirplane();
				this.gameStateSignal.set(SpyGameState.Exploding);
				this.cameraService.zoomOutToIslandView(
					Vector3.Zero(),
					() =>
					{
						this.explosionService.explodeIsland(
							Vector3.Zero(),
							() =>
							{
								this.gameStateSignal.set(SpyGameState.Won);
							});
					});
			},
			() =>
			{
				/* onComplete — takeoff animation finished (plane out of view). */
			});
	}

	/**
	 * Checks if player 2 (AI / White spy) has won — all items + airstrip zone.
	 */
	private checkLoseCondition(): void
	{
		const aiState: Readonly<SpyState> =
			this.spyAi.getState();

		if (aiState.inventory.length < REQUIRED_ITEM_COUNT)
		{
			return;
		}

		if (this.isWithinAirstripRunway(aiState.positionX, aiState.positionZ))
		{
			this.winReasonSignal.set("The enemy spy escaped with the mission items!");
			this.gameStateSignal.set(SpyGameState.Lost);
			this.audioService.playLost();
		}
	}

	/**
	 * Checks if the island timer has expired.
	 * Triggers camera zoom-out and island explosion before declaring result.
	 */
	private checkTimerExpiry(): void
	{
		if (this.turnService.islandTimer() <= 0)
		{
			this.winReasonSignal.set("The island self-destruct timer expired!");
			this.triggerTimerExplosion(SpyGameState.Lost);
		}
	}

	/**
	 * Checks whether a world-space point is inside the runway rectangle.
	 * @param positionX
	 * World-space X position.
	 * @param positionZ
	 * World-space Z position.
	 * @returns
	 * True when the point is inside runway bounds.
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
	 * Shared explosion sequence for timer expiry.
	 * Zooms camera out, triggers explosion, then transitions to the final state.
	 * @param finalState
	 * The game state after the explosion completes.
	 */
	private triggerTimerExplosion(finalState: SpyGameState): void
	{
		this.gameStateSignal.set(SpyGameState.Exploding);
		this.cameraService.zoomOutToIslandView(
			Vector3.Zero(),
			() =>
			{
				this.explosionService.explodeIsland(
					Vector3.Zero(),
					() =>
					{
						this.gameStateSignal.set(finalState);

						if (finalState === SpyGameState.Won)
						{
							this.audioService.playWon();
						}
						else
						{
							this.audioService.playLost();
						}
					});
			});
	}

	/**
	 * Checks if either player has run out of lives.
	 * Zero lives for enemy = player wins; zero lives for player = player loses.
	 */
	private checkLivesExpiry(): void
	{
		if (this.gameStateSignal() !== SpyGameState.Playing)
		{
			return;
		}

		if (this.player2LivesSignal() <= 0)
		{
			this.winReasonSignal.set("Enemy spy eliminated — all lives lost!");
			this.gameStateSignal.set(SpyGameState.Won);
			this.audioService.playWon();
		}

		if (this.player1LivesSignal() <= 0)
		{
			this.winReasonSignal.set("You were eliminated — all lives lost!");
			this.gameStateSignal.set(SpyGameState.Lost);
			this.audioService.playLost();
		}
	}

	/**
	 * Determines which room a position falls within.
	 * @param positionX
	 * World-space X position.
	 * @param positionZ
	 * World-space Z position.
	 * @returns
	 * The RoomId containing the position, or null if outside all rooms.
	 */
	private determineRoom(
		positionX: number,
		positionZ: number): RoomId | null
	{
		for (const room of ISLAND_ROOMS)
		{
			const withinX: boolean =
				positionX >= room.centerX - room.halfWidth
					&& positionX <= room.centerX + room.halfWidth;
			const withinZ: boolean =
				positionZ >= room.centerZ - room.halfDepth
					&& positionZ <= room.centerZ + room.halfDepth;

			if (withinX && withinZ)
			{
				return room.id;
			}
		}

		return null;
	}

	/**
	 * Maps a RoomId to its human-readable HUD display name.
	 * @param roomId
	 * The RoomId enum value.
	 * @returns
	 * The display name string.
	 */
	private getRoomDisplayName(roomId: RoomId): string
	{
		const names: Record<RoomId, string> =
			{
				[RoomId.BeachShack]: "Beach Shack",
				[RoomId.JungleHQ]: "Jungle HQ",
				[RoomId.Watchtower]: "Watchtower",
				[RoomId.CoveCave]: "Cove Cave",
				[RoomId.Compound]: "Compound",
				[RoomId.Library]: "Library"
			};

		return names[roomId];
	}
}