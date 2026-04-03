// <copyright file="spy-inventory.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Inventory Service.
 * Manages per-player item and remedy collections for the Spy vs Spy game.
 * Extracted from SpyFlowService to follow Single Responsibility Principle.
 * Domain-scoped — provided via route `providers` array.
 */

import { Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { REQUIRED_ITEM_COUNT } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	RemedyType,
	SpyIdentity
} from "@games/spy-vs-spy/models/spy-vs-spy.models";

/**
 * Manages per-player item and remedy inventories.
 * Exposes readonly signals for HUD display and provides mutation methods
 * that SpyFlowService calls during search, combat, and trap resolution.
 */
@Injectable()
export class SpyInventoryService
{
	/* ─── Private State ────────────────────────────────────────────────── */

	/** Player 1 (Black spy) collected items. */
	private readonly player1Items: ItemType[] = [];

	/** Player 2 (White spy / AI) collected items. */
	private readonly player2Items: ItemType[] = [];

	/** Player 1 collected remedies. */
	private readonly player1Remedies: RemedyType[] = [];

	/** Player 2 collected remedies. */
	private readonly player2Remedies: RemedyType[] = [];

	/* ─── Writable Signals ─────────────────────────────────────────────── */

	/** Player 1 item count writable signal. */
	private readonly player1ItemCountSignal: WritableSignal<number> =
		signal<number>(0);

	/** Player 2 item count writable signal. */
	private readonly player2ItemCountSignal: WritableSignal<number> =
		signal<number>(0);

	/** Player 1 remedy count writable signal. */
	private readonly player1RemedyCountSignal: WritableSignal<number> =
		signal<number>(0);

	/** Whether player 1 has collected all required mission items. */
	private readonly allItemsCollectedSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/* ─── Public Readonly Signals ──────────────────────────────────────── */

	/** Readonly signal — player 1 item count. */
	readonly player1ItemCount: Signal<number> =
		this.player1ItemCountSignal.asReadonly();

	/** Readonly signal — player 2 item count. */
	readonly player2ItemCount: Signal<number> =
		this.player2ItemCountSignal.asReadonly();

	/** Readonly signal — player 1 remedy count. */
	readonly player1RemedyCount: Signal<number> =
		this.player1RemedyCountSignal.asReadonly();

	/** Readonly signal — whether player 1 has found all mission items. */
	readonly allItemsCollected: Signal<boolean> =
		this.allItemsCollectedSignal.asReadonly();

	/* ─── Public Methods ───────────────────────────────────────────────── */

	/**
	 * Adds an item to a player's inventory and updates the corresponding signal.
	 * @param identity
	 * Which spy collected the item.
	 * @param itemType
	 * The type of item collected.
	 */
	collectItem(
		identity: SpyIdentity,
		itemType: ItemType): void
	{
		const inventory: ItemType[] =
			this.getItemsArray(identity);

		inventory.push(itemType);
		this.syncItemSignal(identity);

		if (
			identity === SpyIdentity.Black
				&& inventory.length >= REQUIRED_ITEM_COUNT)
		{
			this.allItemsCollectedSignal.set(true);
		}
	}

	/**
	 * Removes a random item from a player's inventory (trap/combat penalty).
	 * @param identity
	 * Which spy loses an item.
	 * @returns
	 * The dropped ItemType, or null if inventory was empty.
	 */
	dropRandomItem(identity: SpyIdentity): ItemType | null
	{
		const inventory: ItemType[] =
			this.getItemsArray(identity);

		if (inventory.length === 0)
		{
			return null;
		}

		const index: number =
			Math.floor(Math.random() * inventory.length);
		const dropped: ItemType =
			inventory.splice(index, 1)[0];

		this.syncItemSignal(identity);

		return dropped;
	}

	/**
	 * Returns the current item count for a player.
	 * @param identity
	 * Which spy to check.
	 * @returns
	 * Number of items in that spy's inventory.
	 */
	getItemCount(identity: SpyIdentity): number
	{
		return this.getItemsArray(identity).length;
	}

	/**
	 * Checks whether a player has collected all required mission items.
	 * @param identity
	 * Which spy to check.
	 * @returns
	 * True if the spy has REQUIRED_ITEM_COUNT or more items.
	 */
	hasAllItems(identity: SpyIdentity): boolean
	{
		return this.getItemsArray(identity).length >= REQUIRED_ITEM_COUNT;
	}

	/**
	 * Adds a remedy to a player's inventory and updates the signal.
	 * @param identity
	 * Which spy collected the remedy.
	 * @param remedyType
	 * The type of remedy collected.
	 */
	collectRemedy(
		identity: SpyIdentity,
		remedyType: RemedyType): void
	{
		const remedies: RemedyType[] =
			this.getRemediesArray(identity);

		remedies.push(remedyType);

		if (identity === SpyIdentity.Black)
		{
			this.player1RemedyCountSignal.set(remedies.length);
		}
	}

	/**
	 * Consumes (removes) a remedy from a player's inventory after trap defusal.
	 * @param identity
	 * Which spy used the remedy.
	 * @param remedyType
	 * The remedy type that was consumed.
	 */
	consumeRemedy(
		identity: SpyIdentity,
		remedyType: RemedyType): void
	{
		const remedies: RemedyType[] =
			this.getRemediesArray(identity);
		const index: number =
			remedies.indexOf(remedyType);

		if (index >= 0)
		{
			remedies.splice(index, 1);
		}

		if (identity === SpyIdentity.Black)
		{
			this.player1RemedyCountSignal.set(remedies.length);
		}
	}

	/**
	 * Returns a readonly view of a player's item inventory.
	 * @param identity
	 * Which spy to query.
	 * @returns
	 * Readonly array of items.
	 */
	getItems(identity: SpyIdentity): readonly ItemType[]
	{
		return this.getItemsArray(identity);
	}

	/**
	 * Returns a readonly view of a player's remedy inventory.
	 * @param identity
	 * Which spy to query.
	 * @returns
	 * Readonly array of remedies.
	 */
	getRemedies(identity: SpyIdentity): readonly RemedyType[]
	{
		return this.getRemediesArray(identity);
	}

	/**
	 * Returns a human-readable display name for an item type.
	 * @param itemType
	 * The item type to name.
	 * @returns
	 * Friendly display name.
	 */
	getItemDisplayName(itemType: ItemType): string
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
	 * Resets all inventories and signals to their initial state.
	 * Called on game restart.
	 */
	reset(): void
	{
		this.player1Items.length = 0;
		this.player2Items.length = 0;
		this.player1Remedies.length = 0;
		this.player2Remedies.length = 0;
		this.player1ItemCountSignal.set(0);
		this.player2ItemCountSignal.set(0);
		this.player1RemedyCountSignal.set(0);
		this.allItemsCollectedSignal.set(false);
	}

	/* ─── Private Helpers ──────────────────────────────────────────────── */

	/**
	 * Returns the item array for a given spy identity.
	 * @param identity
	 * Which spy.
	 * @returns
	 * Mutable item array.
	 */
	private getItemsArray(identity: SpyIdentity): ItemType[]
	{
		return identity === SpyIdentity.Black
			? this.player1Items
			: this.player2Items;
	}

	/**
	 * Returns the remedy array for a given spy identity.
	 * @param identity
	 * Which spy.
	 * @returns
	 * Mutable remedy array.
	 */
	private getRemediesArray(identity: SpyIdentity): RemedyType[]
	{
		return identity === SpyIdentity.Black
			? this.player1Remedies
			: this.player2Remedies;
	}

	/**
	 * Synchronizes the item count signal for a given spy identity.
	 * @param identity
	 * Which spy's signal to update.
	 */
	private syncItemSignal(identity: SpyIdentity): void
	{
		if (identity === SpyIdentity.Black)
		{
			this.player1ItemCountSignal.set(this.player1Items.length);
		}
		else
		{
			this.player2ItemCountSignal.set(this.player2Items.length);
		}
	}
}