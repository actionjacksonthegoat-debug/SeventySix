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
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_TRIGGER_RADIUS,
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	COUNTDOWN_DURATION_SECONDS,
	ISLAND_ROOMS,
	REQUIRED_ITEM_COUNT,
	SPY_STARTING_LIVES
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	CombatResult,
	ItemType,
	RemedyType,
	RoomId,
	SpyGameState,
	SpyIdentity,
	TrapType,
	TurnPhase
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	FurnitureDefinition,
	SearchAttemptResult,
	SpyPhysicsState,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
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
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import type { SearchOutcome } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
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

	/** Player 1 (Black) item count writable signal. */
	private readonly player1ItemCountSignal: WritableSignal<number> =
		signal<number>(0);

	/** Player 2 (White / AI) item count writable signal. */
	private readonly player2ItemCountSignal: WritableSignal<number> =
		signal<number>(0);

	/** Player 1 remedy count signal (publicly readable). */
	private readonly player1RemedyCountSignal: WritableSignal<number> =
		signal<number>(0);

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

	/** Whether the player has collected all required mission items. */
	private readonly allItemsCollectedSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/* ─── Private State ────────────────────────────────────────────────── */

	/** Player 1 (Black spy) inventory. */
	private readonly player1Inventory: ItemType[] = [];

	/** Player 2 (White spy / AI) inventory. */
	private readonly player2Inventory: ItemType[] = [];

	/** Player 1 remedies. */
	private readonly player1Remedies: RemedyType[] = [];

	/** Player 2 remedies. */
	private readonly player2Remedies: RemedyType[] = [];

	/** Countdown timer for Ready state. */
	private countdownElapsed: number = 0;

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

	/** Readonly signal — player 1 item count. */
	readonly player1Items: Signal<number> =
		this.player1ItemCountSignal.asReadonly();

	/** Readonly signal — player 2 item count. */
	readonly player2Items: Signal<number> =
		this.player2ItemCountSignal.asReadonly();

	/** Readonly signal — whose turn it is. */
	readonly currentTurn: Signal<TurnPhase> =
		this.turnService.currentTurn;

	/** Readonly signal — player 1 personal timer. */
	readonly player1Timer: Signal<number> =
		this.turnService.player1Timer;

	/** Readonly signal — player 2 personal timer. */
	readonly player2Timer: Signal<number> =
		this.turnService.player2Timer;

	/** Readonly signal — whether a search is active. */
	readonly isSearching: Signal<boolean> =
		this.searchHandler.isSearching;

	/** Readonly signal — active notification message (empty = hidden). */
	readonly notificationMessage: Signal<string> =
		this.searchHandler.notificationMessage;

	/** Readonly signal — notification CSS color. */
	readonly notificationColor: Signal<string> =
		this.searchHandler.notificationColor;

	/** Readonly signal — player 1 collected remedy count. */
	readonly player1RemedyCount: Signal<number> =
		this.player1RemedyCountSignal.asReadonly();

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

	/** Readonly signal — whether the player has found all 4 mission items. */
	readonly allItemsCollected: Signal<boolean> =
		this.allItemsCollectedSignal.asReadonly();

	/** Backward-compatible alias for player 1 item count. */
	readonly playerItemCount: Signal<number> =
		this.player1ItemCountSignal.asReadonly();

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
		this.countdownElapsed = 0;
		this.countdownValueSignal.set(COUNTDOWN_DURATION_SECONDS);
		this.elapsedSecondsSignal.set(0);
		this.turnService.initialize();
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

		/* Non-combat game logic: AI movement and searching. */
		if (!this.combatService.isInCombat())
		{
			const playerState: SpyPhysicsState =
				this.spyPhysics.getState();
			const playerSpyState: Readonly<SpyState> =
				this.aiCoordinator.buildPlayerSpyState(
					playerState,
					this.determineRoom(
						playerState.positionX,
						playerState.positionZ) ?? RoomId.JungleHQ,
					this.player1Inventory,
					this.player1Remedies,
					this.turnService.player1Timer());
			const aiSearchResult: SearchAttemptResult | null =
				this.aiCoordinator.updateAi(deltaTime, playerSpyState);

			if (aiSearchResult != null)
			{
				this.handleSearchResult(aiSearchResult, false);
			}
		}

		/* Sync AI personal timer. */
		this.spyAi.setPersonalTimer(
			this.turnService.player2Timer());

		/* Update furniture proximity indicator. */
		this.updateFurnitureProximity();

		/* Check win/lose conditions. */
		this.checkWinCondition();
		this.checkLoseCondition();
		this.checkTimerExpiry();
		this.checkLivesExpiry();
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
				this.player1Remedies,
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
		this.player1Inventory.length = 0;
		this.player2Inventory.length = 0;
		this.player1Remedies.length = 0;
		this.player2Remedies.length = 0;
		this.player1ItemCountSignal.set(0);
		this.player2ItemCountSignal.set(0);
		this.player1RemedyCountSignal.set(0);
		this.nearFurnitureSignal.set(false);
		this.player1LivesSignal.set(SPY_STARTING_LIVES);
		this.player2LivesSignal.set(SPY_STARTING_LIVES);
		this.allItemsCollectedSignal.set(false);
		this.countdownElapsed = 0;
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
	 * Returns elapsed seconds in the current round.
	 * @returns
	 * Elapsed time in seconds.
	 */
	private getElapsedSeconds(): number
	{
		return this.elapsedSeconds();
	}

	/**
	 * Returns the player 1 item count.
	 * @returns
	 * Number of items collected by player 1.
	 */
	private getPlayerItemCount(): number
	{
		return this.player1Items();
	}

	/**
	 * Returns the player 2 item count.
	 * @returns
	 * Number of items collected by player 2.
	 */
	private getPlayer2ItemCount(): number
	{
		return this.player2Items();
	}

	/**
	 * Adds an item to player 1's inventory.
	 * @param itemType
	 * The type of item collected.
	 */
	private addPlayerItem(itemType: ItemType): void
	{
		this.player1Inventory.push(itemType);
		this.player1ItemCountSignal.set(this.player1Inventory.length);
	}

	/**
	 * Adds an item to player 2's inventory.
	 * @param itemType
	 * The type of item collected.
	 */
	private addPlayer2Item(itemType: ItemType): void
	{
		this.player2Inventory.push(itemType);
		this.player2ItemCountSignal.set(this.player2Inventory.length);
	}

	/**
	 * Returns a human-readable display name for an item type.
	 * @param itemType
	 * The item type to name.
	 * @returns
	 * Friendly display name.
	 */
	private getItemDisplayName(itemType: ItemType): string
	{
		switch (itemType)
		{
			case ItemType.SecretDocuments:
				return "Secret Documents";
			case ItemType.Passport:
				return "Passport";
			case ItemType.KeyCard:
				return "Key Card";
			case ItemType.MoneyBag:
				return "Money Bag";
		}
	}

	/**
	 * Removes a random item from player 1's inventory (trap/combat penalty).
	 * @returns
	 * The dropped ItemType, or null if inventory was empty.
	 */
	private dropRandomPlayerItem(): ItemType | null
	{
		if (this.player1Inventory.length === 0)
		{
			return null;
		}

		const index: number =
			Math.floor(Math.random() * this.player1Inventory.length);
		const dropped: ItemType =
			this.player1Inventory.splice(index, 1)[0];

		this.player1ItemCountSignal.set(this.player1Inventory.length);

		return dropped;
	}

	/**
	 * Removes a random item from player 2's inventory (trap/combat penalty).
	 * @returns
	 * The dropped ItemType, or null if inventory was empty.
	 */
	private dropRandomPlayer2Item(): ItemType | null
	{
		if (this.player2Inventory.length === 0)
		{
			return null;
		}

		const index: number =
			Math.floor(Math.random() * this.player2Inventory.length);
		const dropped: ItemType =
			this.player2Inventory.splice(index, 1)[0];

		this.player2ItemCountSignal.set(this.player2Inventory.length);

		return dropped;
	}

	/**
	 * Consumes a remedy from a spy's inventory after trap defusal.
	 * @param remedyType
	 * The remedy type that was consumed.
	 * @param isPlayer1
	 * Whether the consuming spy is player 1.
	 */
	private consumeRemedy(
		remedyType: RemedyType,
		isPlayer1: boolean): void
	{
		const remedies: RemedyType[] =
			isPlayer1 ? this.player1Remedies : this.player2Remedies;
		const index: number =
			remedies.indexOf(remedyType);

		if (index >= 0)
		{
			remedies.splice(index, 1);
		}

		if (isPlayer1)
		{
			this.player1RemedyCountSignal.set(
				this.player1Remedies.length);
		}
	}

	/**
	 * Returns the countdown value for HUD display.
	 * @returns
	 * Countdown seconds remaining (3, 2, 1, 0).
	 */
	private getCountdownValue(): number
	{
		return Math.max(
			0,
			COUNTDOWN_DURATION_SECONDS - Math.floor(this.countdownElapsed));
	}

	/**
	 * Handles countdown timer in Ready state.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private updateCountdown(deltaTime: number): void
	{
		this.countdownElapsed += deltaTime;

		this.countdownValueSignal.set(
			Math.max(
				0,
				COUNTDOWN_DURATION_SECONDS - Math.floor(this.countdownElapsed)));

		if (this.countdownElapsed >= COUNTDOWN_DURATION_SECONDS)
		{
			this.gameStateSignal.set(SpyGameState.Playing);
			this.elapsedSecondsSignal.set(0);
			this.searchHandler.showNotification("GO!", 800, "#0f0");
		}
	}

	/**
	 * Handles the result of a search attempt using the search handler.
	 * Applies inventory changes, trap effects, and remedy effects based on the outcome.
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

		switch (outcome.type)
		{
			case "item":
				this.applyItemOutcome(outcome, isPlayer1);
				break;

			case "trap":
				this.applyTrapOutcome(outcome, isPlayer1);
				break;

			case "remedy-defused":
				this.applyRemedyDefusedOutcome(outcome, isPlayer1);
				break;

			case "remedy-pickup":
				this.handleRemedyPickup(outcome.remedyType!, isPlayer1);
				break;

			case "empty":
				break;
		}
	}

	/**
	 * Applies the inventory changes from a found-item search outcome.
	 * @param outcome
	 * The search outcome with item details.
	 * @param isPlayer1
	 * Whether the finding player is player 1.
	 */
	private applyItemOutcome(
		outcome: SearchOutcome,
		isPlayer1: boolean): void
	{
		if (outcome.itemType == null)
		{
			return;
		}

		if (isPlayer1)
		{
			this.addPlayerItem(outcome.itemType);
			const itemName: string =
				this.getItemDisplayName(outcome.itemType);
			const count: number =
				this.player1Inventory.length;

			if (count >= REQUIRED_ITEM_COUNT)
			{
				this.allItemsCollectedSignal.set(true);
				this.searchHandler.showNotification(
					"Get to the Airport!",
					0,
					"#ff0");
			}
			else
			{
				this.searchHandler.showNotification(
					`[${String(count)}/4] ${itemName} found!`,
					1500,
					"#0f0");
			}
		}
		else
		{
			this.addPlayer2Item(outcome.itemType);
			this.spyAi.collectItem(outcome.itemType);
		}
	}

	/**
	 * Applies trap damage and inventory effects from a trap search outcome.
	 * Notification was already shown by the search handler.
	 * @param outcome
	 * The search outcome with trap details.
	 * @param isPlayer1
	 * Whether the trapped player is player 1.
	 */
	private applyTrapOutcome(
		outcome: SearchOutcome,
		isPlayer1: boolean): void
	{
		if (outcome.trapType == null)
		{
			return;
		}

		const isBomb: boolean =
			this.damageHandler.applyTrapToSpy(outcome.trapType, isPlayer1);

		/* Replenish the placing spy's inventory for this trap type. */
		if (outcome.trapPlacedBy != null)
		{
			this.trapService.replenishTrap(
				outcome.trapPlacedBy,
				outcome.trapType);
		}

		if (isBomb)
		{
			this.applyBombItemDrop(isPlayer1);
		}
	}

	/**
	 * Applies remedy defusal effects — consumes the remedy from inventory.
	 * @param outcome
	 * The search outcome with remedy details.
	 * @param isPlayer1
	 * Whether the defusing player is player 1.
	 */
	private applyRemedyDefusedOutcome(
		outcome: SearchOutcome,
		isPlayer1: boolean): void
	{
		if (outcome.remedyType == null)
		{
			return;
		}

		this.consumeRemedy(outcome.remedyType, isPlayer1);

		if (isPlayer1)
		{
			const remedyName: string =
				outcome.remedyType === RemedyType.WireCutters
					? "Wire Cutters"
					: "Shield";
			this.searchHandler.showNotification(
				`${remedyName} defused the trap!`,
				1200,
				"#ff0");
		}
	}

	/**
	 * Adds a picked-up remedy to the player's inventory and applies immediate effects.
	 * @param remedyType
	 * The type of remedy found.
	 * @param isPlayer1
	 * Whether the picking-up player is player 1 (Black spy).
	 */
	private handleRemedyPickup(
		remedyType: RemedyType,
		isPlayer1: boolean): void
	{
		if (isPlayer1)
		{
			this.player1Remedies.push(remedyType);
			this.player1RemedyCountSignal.set(
				this.player1Remedies.length);

			if (remedyType === RemedyType.Shield)
			{
				this.player1LivesSignal.update(
					(lives: number) => lives + 1);
				this.searchHandler.showNotification(
					"Shield collected! +1 life!",
					1200,
					"#ff0");
			}
			else
			{
				this.searchHandler.showNotification(
					"Wire Cutters collected!",
					1200,
					"#ff0");
			}
		}
		else
		{
			this.player2Remedies.push(remedyType);

			if (remedyType === RemedyType.Shield)
			{
				this.player2LivesSignal.update(
					(lives: number) => lives + 1);
			}

			this.spyAi.collectRemedy(remedyType);
		}
	}

	/**
	 * Handles bomb-specific inventory and life consequences.
	 * Visual and audio effects are handled by the damage handler.
	 * @param isPlayer1
	 * Whether the affected spy is player 1 (Black).
	 */
	private applyBombItemDrop(isPlayer1: boolean): void
	{
		if (isPlayer1)
		{
			const droppedItem: ItemType | null =
				this.dropRandomPlayerItem();

			if (droppedItem != null)
			{
				this.searchService.redistributeItem(
					droppedItem,
					SpyIdentity.Black);
			}

			this.player1LivesSignal.update(
				(lives: number) =>
					Math.max(0, lives - 1));
		}
		else
		{
			const droppedItem: ItemType | null =
				this.dropRandomPlayer2Item();

			if (droppedItem != null)
			{
				this.searchService.redistributeItem(
					droppedItem,
					SpyIdentity.White);
			}

			this.player2LivesSignal.update(
				(lives: number) =>
					Math.max(0, lives - 1));
		}
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
			this.player2LivesSignal.update(
				(lives: number) =>
					Math.max(0, lives - 1));
		}
		else
		{
			this.searchHandler.showNotification(
				"Spy defeated you!",
				1500,
				"#f00");
			this.player1LivesSignal.update(
				(lives: number) =>
					Math.max(0, lives - 1));
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
		if (this.player1Inventory.length < REQUIRED_ITEM_COUNT)
		{
			return;
		}

		const playerState: SpyPhysicsState =
			this.spyPhysics.getState();
		const distanceToAirstrip: number =
			Math.sqrt(
				(playerState.positionX - AIRSTRIP_CENTER_X) ** 2
					+ (playerState.positionZ - AIRSTRIP_CENTER_Z) ** 2);

		if (distanceToAirstrip > AIRSTRIP_TRIGGER_RADIUS)
		{
			/* Player has all items but hasn't reached the airport yet. */
			this.allItemsCollectedSignal.set(true);
			this.searchHandler.showNotification(
				"Get to the Airport!",
				0,
				"#ff0");

			return;
		}

		this.winReasonSignal.set("You collected all 4 items and escaped!");
		this.gameStateSignal.set(SpyGameState.Escaping);
		this.audioService.playWon();

		/* Hide player mesh — they're boarding the plane. */
		if (this.player1Node != null)
		{
			this.player1Node.setEnabled(false);
		}

		/* Start takeoff animation with existing parked airplane. */
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

		const distanceToAirstrip: number =
			Math.sqrt(
				(aiState.positionX - AIRSTRIP_CENTER_X) ** 2
					+ (aiState.positionZ - AIRSTRIP_CENTER_Z) ** 2);

		if (distanceToAirstrip <= AIRSTRIP_TRIGGER_RADIUS)
		{
			this.winReasonSignal.set("The enemy spy escaped with the mission items!");
			this.gameStateSignal.set(SpyGameState.Lost);
			this.audioService.playLost();
		}
	}

	/**
	 * Checks if either player's personal timer has expired.
	 * Triggers camera zoom-out and island explosion before declaring result.
	 */
	private checkTimerExpiry(): void
	{
		if (this.turnService.isTimerExpired(SpyIdentity.Black))
		{
			this.winReasonSignal.set("Your mission timer ran out!");
			this.triggerTimerExplosion(SpyGameState.Lost);
		}

		if (this.turnService.isTimerExpired(SpyIdentity.White))
		{
			this.winReasonSignal.set("Enemy spy ran out of time!");
			this.triggerTimerExplosion(SpyGameState.Won);
		}
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