// <copyright file="spy-search-outcome.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Search Outcome Service.
 * Applies search outcome effects to game state: inventory changes, trap damage,
 * remedy consumption, item drops, and life modifications.
 * Extracted from SpyFlowService to follow Single Responsibility Principle.
 * Domain-scoped — provided via route `providers` array.
 */

import { inject, Injectable } from "@angular/core";
import { REQUIRED_ITEM_COUNT } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	RemedyType,
	SpyIdentity
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { LifeChange, SearchOutcome } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyDamageHandlerService } from "@games/spy-vs-spy/services/spy-damage-handler.service";
import { SpyInventoryService } from "@games/spy-vs-spy/services/spy-inventory.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";

/**
 * Applies search outcome effects and returns any required life changes
 * for the orchestrator to apply to its own signals.
 */
@Injectable()
export class SpySearchOutcomeService
{
	/** Inventory management. */
	private readonly inventoryService: SpyInventoryService =
		inject(SpyInventoryService);

	/** Search handler for notifications. */
	private readonly searchHandler: SpySearchHandlerService =
		inject(SpySearchHandlerService);

	/** Damage handler for trap stun/visual effects. */
	private readonly damageHandler: SpyDamageHandlerService =
		inject(SpyDamageHandlerService);

	/** Search service for redistributing dropped items. */
	private readonly searchService: SearchService =
		inject(SearchService);

	/** Trap service for replenishing trap inventory. */
	private readonly trapService: TrapService =
		inject(TrapService);

	/** AI spy service for AI-side inventory tracking. */
	private readonly spyAi: SpyAiService =
		inject(SpyAiService);

	/**
	 * Applies the effects of a search outcome and returns any life changes needed.
	 * @param outcome
	 * The search outcome to apply.
	 * @param isPlayer1
	 * Whether the searching/affected player is player 1 (Black spy).
	 * @returns Array of life changes the orchestrator should apply to its signals.
	 */
	public applyOutcome(
		outcome: SearchOutcome,
		isPlayer1: boolean): LifeChange[]
	{
		switch (outcome.type)
		{
			case "item":
				this.applyItemOutcome(outcome, isPlayer1);
				return [];

			case "trap":
				return this.applyTrapOutcome(outcome, isPlayer1);

			case "remedy-defused":
				this.applyRemedyDefusedOutcome(outcome, isPlayer1);
				return [];

			case "remedy-pickup":
				return this.applyRemedyPickup(outcome.remedyType!, isPlayer1);

			case "empty":
				return [];
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
			this.inventoryService.collectItem(SpyIdentity.Black, outcome.itemType);
			const itemName: string =
				this.inventoryService.getItemDisplayName(outcome.itemType);
			const count: number =
				this.inventoryService.getItemCount(SpyIdentity.Black);

			if (count < REQUIRED_ITEM_COUNT)
			{
				this.searchHandler.showNotification(
					`[${String(count)}/4] ${itemName} found!`,
					1500,
					"#0f0");
			}
		}
		else
		{
			this.inventoryService.collectItem(SpyIdentity.White, outcome.itemType);
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
	 * @returns Life changes from bomb traps.
	 */
	private applyTrapOutcome(
		outcome: SearchOutcome,
		isPlayer1: boolean): LifeChange[]
	{
		if (outcome.trapType == null)
		{
			return [];
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
			return this.applyBombItemDrop(isPlayer1);
		}

		return [];
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

		this.inventoryService.consumeRemedy(
			isPlayer1 ? SpyIdentity.Black : SpyIdentity.White,
			outcome.remedyType);

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
	 * Adds a picked-up remedy to the player's inventory and returns life changes.
	 * @param remedyType
	 * The type of remedy found.
	 * @param isPlayer1
	 * Whether the picking-up player is player 1 (Black spy).
	 * @returns Life changes from shield pickups.
	 */
	private applyRemedyPickup(
		remedyType: RemedyType,
		isPlayer1: boolean): LifeChange[]
	{
		const changes: LifeChange[] = [];

		if (isPlayer1)
		{
			this.inventoryService.collectRemedy(SpyIdentity.Black, remedyType);

			if (remedyType === RemedyType.Shield)
			{
				changes.push(
					{ identity: SpyIdentity.Black, delta: 1 });
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
			this.inventoryService.collectRemedy(SpyIdentity.White, remedyType);

			if (remedyType === RemedyType.Shield)
			{
				changes.push(
					{ identity: SpyIdentity.White, delta: 1 });
			}

			this.spyAi.collectRemedy(remedyType);
		}

		return changes;
	}

	/**
	 * Handles bomb-specific inventory and life consequences.
	 * Visual and audio effects are handled by the damage handler.
	 * @param isPlayer1
	 * Whether the affected spy is player 1 (Black).
	 * @returns Life change for the affected player (-1 life).
	 */
	private applyBombItemDrop(isPlayer1: boolean): LifeChange[]
	{
		const identity: SpyIdentity =
			isPlayer1 ? SpyIdentity.Black : SpyIdentity.White;
		const droppedItem: ItemType | null =
			this.inventoryService.dropRandomItem(identity);

		if (droppedItem != null)
		{
			this.searchService.redistributeItem(
				droppedItem,
				identity);
		}

		return [
			{ identity, delta: -1 }
		];
	}
}