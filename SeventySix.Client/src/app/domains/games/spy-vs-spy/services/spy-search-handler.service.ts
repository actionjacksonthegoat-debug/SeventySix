// <copyright file="spy-search-handler.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { SEARCH_DISPLAY_MS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { ItemType, RemedyType, SearchResult, SpyIdentity, TrapType } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { SearchAttemptResult } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { ItemService } from "@games/spy-vs-spy/services/item.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";

/** Outcome of processing a search result for the orchestrator to apply. */
export interface SearchOutcome
{
	/** The type of search outcome. */
	readonly type: "item" | "trap" | "remedy-pickup" | "remedy-defused" | "empty";
	/** The item type found, if any. */
	readonly itemType?: ItemType;
	/** The trap type triggered, if any. */
	readonly trapType?: TrapType;
	/** The identity of the spy who placed the triggered trap, if any. */
	readonly trapPlacedBy?: SpyIdentity;
	/** The remedy type found or consumed, if any. */
	readonly remedyType?: RemedyType;
}

/** Handles search results, notifications, and search overlay state for the Spy vs Spy game. */
@Injectable()
export class SpySearchHandlerService
{
	/** Item service for collecting items. */
	private readonly itemService: ItemService =
		inject(ItemService);

	/** Audio service for playing search-related sounds. */
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	/** Whether the search overlay is currently visible. */
	private readonly isSearchingSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/** The active notification message. */
	private readonly notificationMessageSignal: WritableSignal<string> =
		signal<string>("");

	/** The notification CSS color. */
	private readonly notificationColorSignal: WritableSignal<string> =
		signal<string>("#0f0");

	/** Timer for search overlay auto-hide. */
	private searchDisplayTimer: ReturnType<typeof setTimeout> | null = null;

	/** Timer for notification auto-hide. */
	private notificationTimer: ReturnType<typeof setTimeout> | null = null;

	/** Readonly signal — whether the search overlay is visible. */
	readonly isSearching: Signal<boolean> =
		this.isSearchingSignal.asReadonly();

	/** Readonly signal — active notification message text. */
	readonly notificationMessage: Signal<string> =
		this.notificationMessageSignal.asReadonly();

	/** Readonly signal — active notification CSS color. */
	readonly notificationColor: Signal<string> =
		this.notificationColorSignal.asReadonly();

	/**
	 * Processes a search attempt result and returns the outcome for the orchestrator to apply.
	 * @param result
	 * The search attempt result to process.
	 * @param isPlayer1
	 * Whether the searching spy is player 1.
	 * @returns The search outcome describing what was found.
	 */
	public handleSearchResult(result: SearchAttemptResult, isPlayer1: boolean): SearchOutcome
	{
		switch (result.result)
		{
			case SearchResult.FoundItem:
			{
				const identity: SpyIdentity =
					isPlayer1 ? SpyIdentity.Black : SpyIdentity.White;
				this.itemService.collectItemByType(result.itemType!, identity);
				this.audioService.playItemCollected();
				return { type: "item", itemType: result.itemType };
			}
			case SearchResult.FoundTrap:
			{
				const trapName: string =
					result.trapType === TrapType.Bomb ? "BOMB" : "SPRING TRAP";
				if (isPlayer1)
				{
					this.showNotification(`${trapName}! Stunned!`, 1500, "#f00");
				}
				else
				{
					this.showNotification(`Enemy hit ${trapName}!`, 1500, "#0f0");
				}
				return { type: "trap", trapType: result.trapType, trapPlacedBy: result.trapPlacedBy };
			}
			case SearchResult.FoundRemedy:
			{
				if (result.wasDefusal === true)
				{
					return { type: "remedy-defused", remedyType: result.remedyType };
				}
				return { type: "remedy-pickup", remedyType: result.remedyType };
			}
			case SearchResult.Empty:
			{
				if (isPlayer1)
				{
					this.showNotification("Nothing here...", 800, "#888");
				}
				return { type: "empty" };
			}
			default:
			{
				return { type: "empty" };
			}
		}
	}

	/** Shows the search overlay and schedules it to auto-hide after the configured display duration. */
	public showSearchOverlay(): void
	{
		this.clearSearchTimer();
		this.isSearchingSignal.set(true);

		this.searchDisplayTimer =
			setTimeout(
				(): void =>
				{
					this.isSearchingSignal.set(false);
					this.searchDisplayTimer = null;
				},
				SEARCH_DISPLAY_MS);
	}

	/** Clears the search overlay auto-hide timer if one is active. */
	public clearSearchTimer(): void
	{
		if (this.searchDisplayTimer != null)
		{
			clearTimeout(this.searchDisplayTimer);
			this.searchDisplayTimer = null;
		}
	}

	/**
	 * Shows a notification message with optional auto-hide duration.
	 * @param message
	 * The notification text to display.
	 * @param durationMs
	 * Duration in milliseconds before auto-hide. Use 0 to persist until the next call.
	 * @param color
	 * The CSS color for the notification text.
	 */
	public showNotification(
		message: string,
		durationMs: number,
		color: string = "#0f0"): void
	{
		if (this.notificationTimer != null)
		{
			clearTimeout(this.notificationTimer);
		}

		this.notificationColorSignal.set(color);
		this.notificationMessageSignal.set(message);

		if (durationMs > 0)
		{
			this.notificationTimer =
				setTimeout(
					(): void =>
					{
						this.notificationMessageSignal.set("");
						this.notificationTimer = null;
					},
					durationMs);
		}
	}

	/** Disposes all timers and resets signals to their default values. */
	public dispose(): void
	{
		this.clearSearchTimer();
		if (this.notificationTimer != null)
		{
			clearTimeout(this.notificationTimer);
			this.notificationTimer = null;
		}
		this.isSearchingSignal.set(false);
		this.notificationMessageSignal.set("");
		this.notificationColorSignal.set("#0f0");
	}
}