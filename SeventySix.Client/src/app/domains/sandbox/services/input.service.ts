/**
 * Input Service.
 * Manages keyboard state for game controls via polling.
 * Tracks pressed keys each frame for the game loop to read.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";

/**
 * Service for tracking keyboard input state.
 * Game loop reads current key state each frame via polling.
 */
@Injectable()
export class InputService
{
	/**
	 * Map of currently pressed key states.
	 * @type {Record<string, boolean>}
	 * @readonly
	 */
	readonly keys: Record<string, boolean> = {};

	/**
	 * Bound keydown handler for cleanup.
	 * @type {(event: KeyboardEvent) => void}
	 * @private
	 */
	private readonly boundKeyDown: (event: KeyboardEvent) => void =
		(event: KeyboardEvent): void =>
			this.onKeyDown(event);

	/**
	 * Bound keyup handler for cleanup.
	 * @type {(event: KeyboardEvent) => void}
	 * @private
	 */
	private readonly boundKeyUp: (event: KeyboardEvent) => void =
		(event: KeyboardEvent): void =>
			this.onKeyUp(event);

	/**
	 * Bound blur handler for cleanup.
	 * @type {() => void}
	 * @private
	 */
	private readonly boundBlur: () => void =
		(): void => this.resetAllKeys();

	/**
	 * Attaches keyboard event listeners to the window.
	 */
	initialize(): void
	{
		window.addEventListener(
			"keydown",
			this.boundKeyDown);
		window.addEventListener(
			"keyup",
			this.boundKeyUp);
		window.addEventListener(
			"blur",
			this.boundBlur);
	}

	/**
	 * Returns whether a specific key is currently pressed.
	 * @param {string} key
	 * The key identifier to check (e.g., "w", "Enter").
	 * @returns {boolean}
	 * True if the key is currently pressed.
	 */
	isKeyPressed(key: string): boolean
	{
		return this.keys[key] === true;
	}

	/**
	 * Removes keyboard event listeners and resets state.
	 */
	dispose(): void
	{
		window.removeEventListener(
			"keydown",
			this.boundKeyDown);
		window.removeEventListener(
			"keyup",
			this.boundKeyUp);
		window.removeEventListener(
			"blur",
			this.boundBlur);
		this.resetAllKeys();
	}

	/**
	 * Handles keydown events by recording the key as pressed.
	 * @param {KeyboardEvent} event
	 * The keyboard event.
	 * @private
	 */
	private onKeyDown(event: KeyboardEvent): void
	{
		this.keys[event.key] = true;
	}

	/**
	 * Handles keyup events by recording the key as released.
	 * @param {KeyboardEvent} event
	 * The keyboard event.
	 * @private
	 */
	private onKeyUp(event: KeyboardEvent): void
	{
		this.keys[event.key] = false;
	}

	/**
	 * Resets all key states to unpressed.
	 * Called on window blur to prevent stuck keys.
	 * @private
	 */
	private resetAllKeys(): void
	{
		for (const key of Object.keys(this.keys))
		{
			this.keys[key] = false;
		}
	}
}