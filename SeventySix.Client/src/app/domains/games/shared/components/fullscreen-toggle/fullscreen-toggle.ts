// <copyright file="fullscreen-toggle.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Fullscreen Toggle Component.
 * Provides a button to enter/exit fullscreen mode.
 * Uses the Fullscreen API with a signal-based state tracker.
 */

import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	inject,
	output,
	OutputEmitterRef,
	signal,
	WritableSignal
} from "@angular/core";
import { isPresent } from "@shared/utilities/null-check.utility";

/**
 * Toggle button for entering/exiting browser fullscreen mode.
 * Standalone — import into any game page component.
 * Emits fullscreen state changes via `fullscreenChange` output.
 */
@Component(
	{
		selector: "app-fullscreen-toggle",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./fullscreen-toggle.html",
		styleUrl: "./fullscreen-toggle.scss",
		host: {
			"(document:fullscreenchange)": "onFullscreenChange()"
		}
	})
export class FullscreenToggleComponent
{
	/** Whether the document is currently in fullscreen mode. */
	readonly isFullscreen: WritableSignal<boolean> =
		signal<boolean>(isPresent(document.fullscreenElement));

	/** Emits when fullscreen state changes. */
	readonly fullscreenChange: OutputEmitterRef<boolean> =
		output<boolean>();

	/** Element reference for finding the parent game container. */
	private readonly elementRef: ElementRef<HTMLElement> =
		inject(ElementRef);

	/** @private */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Toggle between entering and exiting fullscreen mode.
	 * Targets the nearest `.game-container` ancestor for natural app chrome hiding.
	 * Falls back to `document.documentElement` when no game container is found.
	 */
	toggleFullscreen(): void
	{
		if (this.isFullscreen())
		{
			document.exitFullscreen();
		}
		else
		{
			const gameContainer: Element | null =
				this.elementRef.nativeElement.closest(".game-container");
			const target: Element =
				gameContainer ?? document.documentElement;
			target.requestFullscreen();
		}
	}

	/**
	 * Handle document fullscreenchange events to sync signal state.
	 */
	onFullscreenChange(): void
	{
		const fullscreen: boolean =
			document.fullscreenElement != null;
		this.isFullscreen.set(fullscreen);
		this.fullscreenChange.emit(fullscreen);
	}
}