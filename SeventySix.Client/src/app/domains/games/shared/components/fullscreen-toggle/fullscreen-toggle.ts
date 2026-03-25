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
	inject,
	output,
	OutputEmitterRef,
	signal,
	WritableSignal
} from "@angular/core";

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
		signal<boolean>(!!document.fullscreenElement);

	/** Emits when fullscreen state changes. */
	readonly fullscreenChange: OutputEmitterRef<boolean> =
		output<boolean>();

	/** @private */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Toggle between entering and exiting fullscreen mode.
	 */
	toggleFullscreen(): void
	{
		if (this.isFullscreen())
		{
			document.exitFullscreen();
		}
		else
		{
			document.documentElement.requestFullscreen();
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