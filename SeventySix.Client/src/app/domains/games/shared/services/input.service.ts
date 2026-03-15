/**
 * Input Service.
 * Manages keyboard and touch state for game controls via polling.
 * Tracks pressed keys each frame for the game loop to read.
 * Touch-capable devices can inject virtual key presses through `setKey()`.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable, Signal, signal, WritableSignal } from "@angular/core";

/**
 * Service for tracking keyboard, mouse, and touch input state.
 * Game loop reads current key/mouse state each frame via polling.
 * Mobile touch controls feed into the same key state via `setKey()`.
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
	 * Whether the current device supports touch input.
	 * Used to conditionally show mobile controls overlay.
	 * @type {boolean}
	 * @readonly
	 */
	readonly isTouchDevice: boolean =
		"ontouchstart" in globalThis || navigator.maxTouchPoints > 0;

	/**
	 * Writable signal that allows desktop users to force-enable touch mode
	 * for development/testing purposes.
	 * @type {WritableSignal<boolean>}
	 * @private
	 */
	private readonly _forceTouchMode: WritableSignal<boolean> =
		signal(false);

	/**
	 * Read-only signal for whether mobile preview mode is active.
	 * Desktop-only feature — allows testing touch controls without a touch device.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isMobilePreview: Signal<boolean> =
		this._forceTouchMode.asReadonly();

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
		(): void => this.resetAll();

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
	 * Sets a virtual key state from external sources (e.g., mobile touch controls).
	 * Allows touch UI components to inject key presses into the same polling
	 * mechanism used by keyboard input, requiring zero changes in game physics.
	 * @param {string} key
	 * The key identifier to set (e.g., "ArrowLeft", " ").
	 * @param {boolean} pressed
	 * Whether the key should be marked as pressed or released.
	 */
	setKey(
		key: string,
		pressed: boolean): void
	{
		this.keys[key] = pressed;
	}

	/**
	 * Toggles the mobile preview mode on or off.
	 * When active, mobile touch controls overlay is shown on non-touch devices.
	 * Intended for development and testing purposes only.
	 */
	toggleMobilePreview(): void
	{
		this._forceTouchMode.update(
			(current: boolean) => !current);
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
		this.resetAll();
	}

	/**
	 * Handles keydown events by recording the key as pressed.
	 * @param {KeyboardEvent} event
	 * The keyboard event.
	 * @private
	 */
	private onKeyDown(event: KeyboardEvent): void
	{
		if (event.key === " ")
		{
			event.preventDefault();
		}

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
		if (event.key === " ")
		{
			event.preventDefault();
		}

		this.keys[event.key] = false;
	}

	/**
	 * Resets all key states to unpressed.
	 * Called on window blur to prevent stuck inputs.
	 * @private
	 */
	private resetAll(): void
	{
		for (const key of Object.keys(this.keys))
		{
			this.keys[key] = false;
		}
	}
}