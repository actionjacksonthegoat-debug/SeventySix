// <copyright file="spy-ai.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy AI Service.
 * Controls the AI-driven White spy with furniture-based search and combat behavior.
 * Single Responsibility: AI decision making and movement for the non-player spy.
 * Rule-based AI (no pathfinding library) — appropriate for grid room layout.
 *
 * Priority order:
 * 1. Escape — head to airstrip when all items collected
 * 2. Early Escape — head to airstrip under time pressure with 2+ items
 * 3. Intercept Player — engage when in same or adjacent room
 * 4. Search — navigate to nearest unsearched furniture
 * 5. Unsearched Room — move to room with unsearched furniture
 * 6. Trap — probabilistic trap placement (20% chance)
 * 7. Wander — move to random room center (excludes recently visited)
 *
 * AI escapes earlier when personal timer runs low (below 60 seconds).
 */

import { inject, Injectable } from "@angular/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
	AI_DECISION_INTERVAL_SECONDS,
	AI_INTERCEPT_PROBABILITY,
	AI_RECENT_ROOM_BUFFER_SIZE,
	AI_SAME_ROOM_TRAP_PROBABILITY,
	AI_SEARCH_COOLDOWN_SECONDS,
	AI_WANDER_PROBABILITY,
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	COMBAT_ENGAGE_RADIUS,
	ISLAND_ROOMS,
	REQUIRED_ITEM_COUNT,
	ROOM_FURNITURE,
	WHITE_SPY_SPAWN_X,
	WHITE_SPY_SPAWN_Z
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	RemedyType,
	RoomId,
	SpyIdentity,
	StunState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	FurnitureDefinition,
	PlacedTrap,
	RoomDefinition,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyPathfindingService } from "@games/spy-vs-spy/services/spy-pathfinding.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";

/** Distance threshold for considering goal reached. */
const GOAL_REACHED_DISTANCE: number = 1.5;

/** Probability AI places a trap when evaluating (0-1). */
const TRAP_PLACE_PROBABILITY: number = 0.2;

/** Timer threshold (seconds) below which AI prioritizes escape earlier. */
const LOW_TIMER_THRESHOLD_SECONDS: number = 60;

/** Minimum items needed before AI considers early escape under time pressure. */
const EARLY_ESCAPE_ITEM_COUNT: number = 2;

/**
 * Controls the AI-driven White spy with furniture search and combat.
 * Evaluates goals based on priority: Escape > Intercept > Search > Unsearched Room > Wander.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyAiService
{
	/** Physics service for wall collision detection. */
	private readonly physicsService: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** Pathfinding service for navigation and room detection. */
	private readonly pathfinding: SpyPathfindingService =
		inject(SpyPathfindingService);

	/** Bound AI spy TransformNode. */
	private aiNode: TransformNode | null = null;

	/** Items collected by the AI spy. */
	private readonly aiInventory: ItemType[] = [];

	/** Remedies held by the AI spy. */
	private readonly aiRemedies: RemedyType[] = [];

	/** Set of furniture IDs the AI has already searched. */
	private readonly searchedFurniture: Set<string> =
		new Set<string>();

	/** Timer tracking when to next re-evaluate goal. */
	private decisionTimer: number =
		AI_DECISION_INTERVAL_SECONDS;

	/** Current stun state. */
	private currentStunState: StunState =
		StunState.None;

	/** Remaining stun duration in seconds. */
	private stunRemaining: number = 0;

	/** Personal countdown timer in seconds. */
	private personalTimerSeconds: number = 0;

	/** Whether AI wants to initiate combat this frame. */
	private wantsCombat: boolean = false;

	/** Whether AI wants to search this frame. */
	private wantsSearch: boolean = false;

	/** Cooldown timer before AI can search again (seconds). */
	private searchCooldownRemaining: number = 0;

	/** Ring buffer of recently visited room IDs for anti-clustering behavior. */
	private readonly recentlyVisitedRooms: RoomId[] = [];

	/** Rooms where AI has searched all furniture — deprioritized for revisiting. */
	private readonly fullySearchedRooms: Set<RoomId> =
		new Set<RoomId>();

	/**
	 * Initializes the AI spy mesh and starting state.
	 * @param _scene
	 * The Babylon.js scene (reserved for future use).
	 * @param spyNode
	 * The TransformNode representing the AI spy.
	 */
	initialize(
		_scene: Scene,
		spyNode: TransformNode): void
	{
		this.aiNode = spyNode;
		spyNode.position.x = WHITE_SPY_SPAWN_X;
		spyNode.position.z = WHITE_SPY_SPAWN_Z;
		this.pathfinding.setGoal(WHITE_SPY_SPAWN_X, WHITE_SPY_SPAWN_Z);
		this.pathfinding.clearWaypoint();
		this.decisionTimer =
			AI_DECISION_INTERVAL_SECONDS;
		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.personalTimerSeconds = 0;
		this.wantsCombat = false;
		this.wantsSearch = false;
		this.searchCooldownRemaining = 0;
		this.aiInventory.length = 0;
		this.aiRemedies.length = 0;
		this.searchedFurniture.clear();
		this.recentlyVisitedRooms.length = 0;
		this.fullySearchedRooms.clear();
	}

	/**
	 * Per-frame AI update. Re-evaluates goal every AI_DECISION_INTERVAL_SECONDS,
	 * then moves toward current goal each frame.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @param playerState
	 * The player spy's current state (used for combat engagement and interception).
	 * @param unsearchedFurnitureIds
	 * IDs of furniture not yet searched.
	 * @param _activeTraps
	 * All currently placed traps (reserved for future trap avoidance).
	 */
	update(
		deltaTime: number,
		playerState: Readonly<SpyState>,
		unsearchedFurnitureIds: ReadonlyArray<string>,
		_activeTraps: ReadonlyArray<PlacedTrap>): void
	{
		if (this.aiNode == null)
		{
			return;
		}

		const aiNode: TransformNode =
			this.aiNode;

		this.wantsCombat = false;
		this.wantsSearch = false;

		/* Tick search cooldown. */
		if (this.searchCooldownRemaining > 0)
		{
			this.searchCooldownRemaining =
				Math.max(0, this.searchCooldownRemaining - deltaTime);
		}

		/* Process stun timer. */
		if (this.stunRemaining > 0)
		{
			this.stunRemaining =
				Math.max(0, this.stunRemaining - deltaTime);

			if (this.stunRemaining <= 0)
			{
				this.currentStunState =
					StunState.None;
			}

			return;
		}

		/* Check if player spy is nearby for combat. */
		const currentX: number =
			aiNode.position.x;
		const currentZ: number =
			aiNode.position.z;

		this.checkCombatOpportunity(
			currentX,
			currentZ,
			playerState.positionX,
			playerState.positionZ);

		/* Decision timer — re-evaluate goal periodically. */
		this.decisionTimer += deltaTime;

		if (this.decisionTimer >= AI_DECISION_INTERVAL_SECONDS)
		{
			this.decisionTimer = 0;
			this.evaluateGoal(unsearchedFurnitureIds, playerState);
		}

		/* Check if at goal furniture for search. */
		this.checkSearchOpportunity(
			currentX,
			currentZ,
			unsearchedFurnitureIds);

		/* Move toward goal. */
		this.pathfinding.moveTowardGoal(aiNode, deltaTime);
	}

	/**
	 * Adds an item to the AI spy's inventory.
	 * @param itemType
	 * The type of item collected.
	 */
	collectItem(itemType: ItemType): void
	{
		this.aiInventory.push(itemType);
		this.fullySearchedRooms.clear();
	}

	/**
	 * Adds a remedy to the AI spy's remedies.
	 * @param remedyType
	 * The remedy type to add.
	 */
	collectRemedy(remedyType: RemedyType): void
	{
		this.aiRemedies.push(remedyType);
	}

	/**
	 * Marks a furniture piece as searched by the AI.
	 * Resets the search cooldown to prevent rapid-fire searching.
	 * @param furnitureId
	 * The furniture identifier.
	 */
	markFurnitureSearched(furnitureId: string): void
	{
		this.searchedFurniture.add(furnitureId);
		this.searchCooldownRemaining =
			AI_SEARCH_COOLDOWN_SECONDS;
		this.updateFullySearchedRooms(furnitureId);
	}

	/**
	 * Sets the AI's personal timer for time-pressure awareness.
	 * @param seconds
	 * Remaining personal timer in seconds.
	 */
	setPersonalTimer(seconds: number): void
	{
		this.personalTimerSeconds = seconds;
	}

	/**
	 * Returns whether the AI wants to initiate combat this frame.
	 * @returns True if AI wants combat.
	 */
	getWantsCombat(): boolean
	{
		return this.wantsCombat;
	}

	/**
	 * Returns whether the AI wants to search furniture this frame.
	 * @returns True if AI wants to search.
	 */
	getWantsSearch(): boolean
	{
		return this.wantsSearch;
	}

	/**
	 * Returns the AI spy's current remedies.
	 * @returns Copy of the AI's remedy array.
	 */
	getRemedies(): RemedyType[]
	{
		return [...this.aiRemedies];
	}

	/**
	 * Removes a remedy from the AI's inventory (used when defusing a trap).
	 * @param remedyType
	 * The remedy type to consume.
	 */
	consumeRemedy(remedyType: RemedyType): void
	{
		const index: number =
			this.aiRemedies.indexOf(remedyType);

		if (index >= 0)
		{
			this.aiRemedies.splice(index, 1);
		}
	}

	/**
	 * Returns the AI spy's current state.
	 * @returns
	 * Read-only SpyState snapshot for the AI spy.
	 */
	getState(): Readonly<SpyState>
	{
		return {
			identity: SpyIdentity.White,
			currentRoomId: this.pathfinding.determineCurrentRoom(
				this.aiNode?.position.x ?? 0,
				this.aiNode?.position.z ?? 0),
			positionX: this.aiNode?.position.x ?? 0,
			positionZ: this.aiNode?.position.z ?? 0,
			rotationY: this.aiNode?.rotation.y ?? 0,
			inventory: [...this.aiInventory],
			remedies: [...this.aiRemedies],
			stunState: this.currentStunState,
			stunRemainingSeconds: this.stunRemaining,
			personalTimer: this.personalTimerSeconds
		};
	}

	/**
	 * Applies a stun effect, preventing movement for the given duration.
	 * @param stun
	 * The type of stun to apply.
	 * @param durationSeconds
	 * How long the stun lasts.
	 */
	setStunned(
		stun: StunState,
		durationSeconds: number): void
	{
		this.currentStunState = stun;
		this.stunRemaining = durationSeconds;
	}

	/**
	 * Resets the AI spy to spawn position and clears all state.
	 * Used on game restart without full dispose/reinitialize.
	 */
	reset(): void
	{
		if (this.aiNode != null)
		{
			this.aiNode.position.x = WHITE_SPY_SPAWN_X;
			this.aiNode.position.z = WHITE_SPY_SPAWN_Z;
			this.aiNode.rotation.y = 0;
		}

		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.personalTimerSeconds = 0;
		this.wantsCombat = false;
		this.wantsSearch = false;
		this.searchCooldownRemaining = 0;
		this.pathfinding.reset(WHITE_SPY_SPAWN_X, WHITE_SPY_SPAWN_Z);
		this.aiInventory.length = 0;
		this.aiRemedies.length = 0;
		this.searchedFurniture.clear();
		this.recentlyVisitedRooms.length = 0;
		this.fullySearchedRooms.clear();
		this.decisionTimer =
			AI_DECISION_INTERVAL_SECONDS;
	}

	/**
	 * Disposes internal state and unbinds from scene node.
	 */
	dispose(): void
	{
		this.aiNode = null;
		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.personalTimerSeconds = 0;
		this.wantsCombat = false;
		this.wantsSearch = false;
		this.searchCooldownRemaining = 0;
		this.pathfinding.reset(0, 0);
		this.aiInventory.length = 0;
		this.aiRemedies.length = 0;
		this.searchedFurniture.clear();
		this.recentlyVisitedRooms.length = 0;
		this.fullySearchedRooms.clear();
		this.decisionTimer =
			AI_DECISION_INTERVAL_SECONDS;
	}

	/**
	 * Checks if player spy is within combat range and sets combat flag.
	 * @param aiX AI position X.
	 * @param aiZ AI position Z.
	 * @param playerX Player position X.
	 * @param playerZ Player position Z.
	 */
	private checkCombatOpportunity(
		aiX: number,
		aiZ: number,
		playerX: number,
		playerZ: number): void
	{
		const deltaX: number =
			aiX - playerX;
		const deltaZ: number =
			aiZ - playerZ;
		const distanceSq: number =
			deltaX * deltaX + deltaZ * deltaZ;
		const engageRadiusSq: number =
			COMBAT_ENGAGE_RADIUS * COMBAT_ENGAGE_RADIUS;

		if (distanceSq <= engageRadiusSq)
		{
			this.wantsCombat = true;
		}
	}

	/**
	 * Checks if AI is near unsearched furniture and triggers search.
	 * @param aiX AI position X.
	 * @param aiZ AI position Z.
	 * @param unsearchedFurnitureIds IDs of unsearched furniture.
	 */
	private checkSearchOpportunity(
		aiX: number,
		aiZ: number,
		unsearchedFurnitureIds: ReadonlyArray<string>): void
	{
		if (this.searchCooldownRemaining > 0)
		{
			return;
		}

		for (const furnitureId of unsearchedFurnitureIds)
		{
			if (this.searchedFurniture.has(furnitureId))
			{
				continue;
			}

			const definition: FurnitureDefinition | undefined =
				ROOM_FURNITURE.find(
					(furniture) =>
						furniture.id === furnitureId);

			if (definition === undefined)
			{
				continue;
			}

			const room: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === definition.roomId);

			if (room === undefined)
			{
				continue;
			}

			const worldX: number =
				room.centerX + definition.offsetX;
			const worldZ: number =
				room.centerZ + definition.offsetZ;
			const deltaX: number =
				aiX - worldX;
			const deltaZ: number =
				aiZ - worldZ;

			if (deltaX * deltaX + deltaZ * deltaZ <= GOAL_REACHED_DISTANCE * GOAL_REACHED_DISTANCE)
			{
				this.wantsSearch = true;
				return;
			}
		}
	}

	/**
	 * Evaluates the best goal based on priority:
	 * Escape > Early Escape > Intercept Player > Search > Unsearched Room > Trap > Wander.
	 * @param unsearchedFurnitureIds
	 * IDs of furniture not yet searched.
	 * @param playerState
	 * Current player spy state for interception decisions.
	 */
	private evaluateGoal(
		unsearchedFurnitureIds: ReadonlyArray<string>,
		playerState: Readonly<SpyState>): void
	{
		/* Clear any active waypoint when re-evaluating goals. */
		this.pathfinding.clearWaypoint();

		/* Track current room in recent-room ring buffer. */
		this.trackCurrentRoom();

		/* Priority 1: Escape — if inventory has all required items, head to airstrip. */
		if (this.aiInventory.length >= REQUIRED_ITEM_COUNT)
		{
			this.setGoalToAirstrip();
			return;
		}

		/* Priority 1b: Early escape under time pressure. */
		if (
			this.personalTimerSeconds > 0
				&& this.personalTimerSeconds < LOW_TIMER_THRESHOLD_SECONDS
				&& this.aiInventory.length >= EARLY_ESCAPE_ITEM_COUNT)
		{
			this.setGoalToAirstrip();
			return;
		}

		/* Priority 2: Intercept player in same or adjacent room. */
		if (this.checkPlayerInterception(playerState))
		{
			return;
		}

		/* Priority 3: Search nearest unsearched furniture. */
		if (this.navigateToNearestFurniture(unsearchedFurnitureIds))
		{
			return;
		}

		/* Priority 4: Move to an unsearched room (systematic coverage). */
		if (this.navigateToUnsearchedRoom())
		{
			return;
		}

		/* Priority 5: Random wander (reduced probability, excludes recent rooms). */
		if (Math.random() < AI_WANDER_PROBABILITY)
		{
			this.goToRandomRoom();
			return;
		}

		/* Priority 6: Place trap (probabilistic). */
		if (Math.random() < TRAP_PLACE_PROBABILITY)
		{
			this.goToRandomRoom();
			return;
		}

		/* Priority 7: Wander fallback — move to random room center. */
		this.goToRandomRoom();
	}

	/**
	 * Sets the AI goal to a random room center, excluding recently visited rooms.
	 * Falls back to any room if all rooms are recently visited.
	 */
	private goToRandomRoom(): void
	{
		const candidateRooms: ReadonlyArray<RoomDefinition> =
			ISLAND_ROOMS.filter(
				(room) =>
					!this.recentlyVisitedRooms.includes(room.id));

		const roomPool: ReadonlyArray<RoomDefinition> =
			candidateRooms.length > 0
				? candidateRooms
				: ISLAND_ROOMS;

		const randomIndex: number =
			Math.floor(Math.random() * roomPool.length);
		const randomRoom: RoomDefinition =
			roomPool[randomIndex]!;

		this.pathfinding.setGoal(randomRoom.centerX, randomRoom.centerZ);
	}

	/**
	 * Navigates the AI toward the nearest unsearched furniture.
	 * Sets goal position if a reachable furniture piece is found.
	 * @param unsearchedFurnitureIds
	 * IDs of furniture not yet searched.
	 * @returns
	 * True if a valid furniture goal was set.
	 */
	private navigateToNearestFurniture(
		unsearchedFurnitureIds: ReadonlyArray<string>): boolean
	{
		const nearestFurniture: FurnitureDefinition | null =
			this.findNearestUnsearchedFurniture(
				unsearchedFurnitureIds);

		if (nearestFurniture == null)
		{
			return false;
		}

		const room: RoomDefinition | undefined =
			ISLAND_ROOMS.find(
				(room) =>
					room.id === nearestFurniture.roomId);

		if (room == null)
		{
			return false;
		}

		this.pathfinding.setGoal(
			room.centerX + nearestFurniture.offsetX,
			room.centerZ + nearestFurniture.offsetZ);

		return true;
	}

	/**
	 * Sets the AI goal to the airstrip zone for escape.
	 */
	private setGoalToAirstrip(): void
	{
		this.pathfinding.setGoal(AIRSTRIP_CENTER_X, AIRSTRIP_CENTER_Z);
	}

	/**
	 * Tracks the AI's current room in the recently-visited ring buffer.
	 * Prevents the AI from revisiting the same rooms in quick succession.
	 */
	private trackCurrentRoom(): void
	{
		const currentRoomId: RoomId | null =
			this.pathfinding.determineCurrentRoom(
				this.aiNode?.position.x ?? 0,
				this.aiNode?.position.z ?? 0);

		if (currentRoomId == null)
		{
			return;
		}

		/* Avoid duplicate consecutive entries. */
		if (
			this.recentlyVisitedRooms.length > 0
				&& this.recentlyVisitedRooms[this.recentlyVisitedRooms.length - 1] === currentRoomId)
		{
			return;
		}

		this.recentlyVisitedRooms.push(currentRoomId);

		if (this.recentlyVisitedRooms.length > AI_RECENT_ROOM_BUFFER_SIZE)
		{
			this.recentlyVisitedRooms.shift();
		}
	}

	/**
	 * Checks whether the AI should intercept the player.
	 * Same-room: high probability of setting trap or engaging combat.
	 * Adjacent room: moderate probability of moving toward the player.
	 * @param playerState
	 * Current player spy state.
	 * @returns
	 * True if an interception goal was set.
	 */
	private checkPlayerInterception(playerState: Readonly<SpyState>): boolean
	{
		const aiRoomId: RoomId | null =
			this.pathfinding.determineCurrentRoom(
				this.aiNode?.position.x ?? 0,
				this.aiNode?.position.z ?? 0);

		if (aiRoomId == null)
		{
			return false;
		}

		/* Same room — aggressive engagement. */
		if (playerState.currentRoomId === aiRoomId)
		{
			if (Math.random() < AI_SAME_ROOM_TRAP_PROBABILITY)
			{
				this.wantsCombat = true;
				return true;
			}
		}

		/* Adjacent room — move toward player. */
		const currentRoom: RoomDefinition | undefined =
			ISLAND_ROOMS.find(
				(room) => room.id === aiRoomId);

		if (currentRoom == null)
		{
			return false;
		}

		const isAdjacent: boolean =
			currentRoom.connections.includes(playerState.currentRoomId);

		if (isAdjacent && Math.random() < AI_INTERCEPT_PROBABILITY)
		{
			const targetRoom: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) =>
						room.id === playerState.currentRoomId);

			if (targetRoom != null)
			{
				this.pathfinding.setGoal(targetRoom.centerX, targetRoom.centerZ);
				return true;
			}
		}

		return false;
	}

	/**
	 * Navigates the AI to a room that has unsearched furniture.
	 * Prefers rooms not in the fully-searched set.
	 * @returns
	 * True if a navigation goal to an unsearched room was set.
	 */
	private navigateToUnsearchedRoom(): boolean
	{
		const unsearchedRooms: RoomDefinition[] =
			ISLAND_ROOMS.filter(
				(room) =>
					!this.fullySearchedRooms.has(room.id)
						&& !this.recentlyVisitedRooms.includes(room.id));

		if (unsearchedRooms.length === 0)
		{
			return false;
		}

		const randomIndex: number =
			Math.floor(Math.random() * unsearchedRooms.length);
		const targetRoom: RoomDefinition =
			unsearchedRooms[randomIndex]!;

		this.pathfinding.setGoal(targetRoom.centerX, targetRoom.centerZ);
		return true;
	}

	/**
	 * Checks if all furniture in a room has been searched and marks it fully searched.
	 * @param furnitureId
	 * The furniture ID that was just searched.
	 */
	private updateFullySearchedRooms(furnitureId: string): void
	{
		const furniture: FurnitureDefinition | undefined =
			ROOM_FURNITURE.find(
				(fur) => fur.id === furnitureId);

		if (furniture == null)
		{
			return;
		}

		const roomFurniture: ReadonlyArray<FurnitureDefinition> =
			ROOM_FURNITURE.filter(
				(fur) => fur.roomId === furniture.roomId);

		const allSearched: boolean =
			roomFurniture.every(
				(fur) =>
					this.searchedFurniture.has(fur.id));

		if (allSearched)
		{
			this.fullySearchedRooms.add(furniture.roomId);
		}
	}

	/**
	 * Finds the nearest unsearched furniture to the AI's current position.
	 * @param unsearchedFurnitureIds IDs of furniture not yet searched.
	 * @returns The nearest unsearched furniture definition, or null.
	 */
	private findNearestUnsearchedFurniture(
		unsearchedFurnitureIds: ReadonlyArray<string>): FurnitureDefinition | null
	{
		const currentX: number =
			this.aiNode?.position.x ?? 0;
		const currentZ: number =
			this.aiNode?.position.z ?? 0;

		let nearest: FurnitureDefinition | null = null;
		let nearestDistanceSq: number =
			Number.MAX_VALUE;

		for (const furnitureId of unsearchedFurnitureIds)
		{
			if (this.searchedFurniture.has(furnitureId))
			{
				continue;
			}

			const definition: FurnitureDefinition | undefined =
				ROOM_FURNITURE.find(
					(furniture) =>
						furniture.id === furnitureId);

			if (definition === undefined)
			{
				continue;
			}

			const room: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === definition.roomId);

			if (room === undefined)
			{
				continue;
			}

			const worldX: number =
				room.centerX + definition.offsetX;
			const worldZ: number =
				room.centerZ + definition.offsetZ;
			const deltaX: number =
				currentX - worldX;
			const deltaZ: number =
				currentZ - worldZ;
			const distanceSq: number =
				deltaX * deltaX + deltaZ * deltaZ;

			if (distanceSq < nearestDistanceSq)
			{
				nearestDistanceSq = distanceSq;
				nearest = definition;
			}
		}

		return nearest;
	}
}