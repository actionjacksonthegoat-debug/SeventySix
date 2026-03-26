// <copyright file="spy-ai-coordinator.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { inject, Injectable } from "@angular/core";
import type {
	PlacedTrap,
	SearchAttemptResult,
	SpyPhysicsState,
	SpyState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { ItemType, RemedyType, RoomId, SpyIdentity, TrapType } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { CombatService } from "@games/spy-vs-spy/services/combat.service";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";

/**
 * Coordinates AI spy behavior each frame, delegating to specialized services
 * for search, combat, and trap placement decisions.
 * Extracted from SpyFlowService to isolate AI coordination logic.
 *
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyAiCoordinatorService
{
	/** AI decision-making service. */
	private readonly spyAi: SpyAiService =
		inject(SpyAiService);

	/** Player physics state service. */
	private readonly spyPhysics: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** Furniture search service. */
	private readonly searchService: SearchService =
		inject(SearchService);

	/** Trap management service. */
	private readonly trapService: TrapService =
		inject(TrapService);

	/** Combat engagement service. */
	private readonly combatService: CombatService =
		inject(CombatService);

	/** Cooldown timer in seconds before the AI attempts to place another trap. */
	private aiTrapCooldown: number = 0;

	/**
	 * Main per-frame AI update. Processes AI search, trap placement, and combat.
	 * @param deltaTime
	 * Elapsed time in seconds since the last frame.
	 * @param playerSpyState
	 * Readonly snapshot of the human player's current state.
	 * @returns A SearchAttemptResult if the AI searched this frame, or null otherwise.
	 */
	public updateAi(
		deltaTime: number,
		playerSpyState: Readonly<SpyState>): SearchAttemptResult | null
	{
		const unsearchedIds: ReadonlyArray<string> =
			this.searchService.getUnsearched(SpyIdentity.White);
		const activeTraps: ReadonlyArray<PlacedTrap> =
			this.trapService.getActiveTraps();

		this.spyAi.update(deltaTime, playerSpyState, unsearchedIds, activeTraps);

		const searchResult: SearchAttemptResult | null =
			this.handleAiSearchTick();

		this.aiTrapCooldown -= deltaTime;
		if (this.aiTrapCooldown <= 0)
		{
			this.placeAiTrap();
		}

		this.handleAiCombatTick();

		return searchResult;
	}

	/**
	 * Builds a readonly SpyState snapshot for the human player.
	 * Used to pass player state context to the AI service.
	 * @param playerState
	 * The player's current physics state.
	 * @param currentRoomId
	 * The room the player is currently in.
	 * @param inventory
	 * The player's current inventory items.
	 * @param remedies
	 * The player's current remedy items.
	 * @param personalTimer
	 * The player's remaining personal timer value.
	 * @returns A frozen snapshot of the player's spy state.
	 */
	public buildPlayerSpyState(
		playerState: SpyPhysicsState,
		currentRoomId: RoomId,
		inventory: ReadonlyArray<ItemType>,
		remedies: ReadonlyArray<RemedyType>,
		personalTimer: number): Readonly<SpyState>
	{
		const spyState: SpyState =
			{
				identity: SpyIdentity.Black,
				currentRoomId,
				positionX: playerState.positionX,
				positionZ: playerState.positionZ,
				rotationY: playerState.rotationY,
				inventory: [...inventory],
				remedies: [...remedies],
				stunState: playerState.stunState,
				stunRemainingSeconds: playerState.stunRemainingSeconds,
				personalTimer
			};

		return spyState;
	}

	/**
	 * Resets the AI coordinator state for a new game.
	 */
	public reset(): void
	{
		this.aiTrapCooldown = 0;
	}

	/**
	 * Handles the AI's search action for the current tick.
	 * @returns A SearchAttemptResult if the AI performed a search, or null otherwise.
	 */
	private handleAiSearchTick(): SearchAttemptResult | null
	{
		if (!this.spyAi.getWantsSearch())
		{
			return null;
		}

		const aiState: Readonly<SpyState> =
			this.spyAi.getState();
		const aiRemedies: ReadonlyArray<RemedyType> =
			this.spyAi.getRemedies();
		const result: SearchAttemptResult | null =
			this.searchService.searchNearby(
				aiState.positionX,
				aiState.positionZ,
				aiRemedies,
				SpyIdentity.White);

		if (result !== null)
		{
			this.spyAi.markFurnitureSearched(result.furnitureId);
			return result;
		}

		return null;
	}

	/**
	 * Handles the AI's combat engagement logic for the current tick.
	 */
	private handleAiCombatTick(): void
	{
		if (!this.spyAi.getWantsCombat() || this.combatService.isInCombat())
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

		if (canFight)
		{
			this.combatService.startCombat();
		}
	}

	/**
	 * Attempts to place a trap in nearby furniture on behalf of the AI spy.
	 */
	private placeAiTrap(): void
	{
		const availableTypes: ReadonlyArray<TrapType> =
			this.trapService.getAvailableTrapTypes(SpyIdentity.White);

		if (availableTypes.length === 0)
		{
			this.aiTrapCooldown = 5;
			return;
		}

		const randomIndex: number =
			Math.floor(Math.random() * availableTypes.length);
		const trapType: TrapType =
			availableTypes[randomIndex];
		const aiState: Readonly<SpyState> =
			this.spyAi.getState();
		const placed: boolean =
			this.searchService.placeTrapInFurniture(
				aiState.positionX,
				aiState.positionZ,
				trapType,
				SpyIdentity.White);

		if (placed)
		{
			this.trapService.consumeTrap(SpyIdentity.White, trapType);
			this.aiTrapCooldown = 20;
		}
		else
		{
			this.aiTrapCooldown = 5;
		}
	}
}