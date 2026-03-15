/**
 * Input Service.
 * Manages keyboard and mouse state for game controls via polling.
 * Tracks pressed keys and mouse buttons each frame for the game loop to read.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";

/**
 * Service for tracking keyboard and mouse input state.
 * Game loop reads current key/mouse state each frame via polling.
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

	/** Whether the left mouse button is currently pressed. */
	mouseLeft: boolean = false;

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
	 * Bound mousedown handler for cleanup.
	 * @type {(event: MouseEvent) => void}
	 * @private
	 */
	private readonly boundMouseDown: (event: MouseEvent) => void =
		(event: MouseEvent): void =>
			this.onMouseDown(event);

	/**
	 * Bound mouseup handler for cleanup.
	 * @type {(event: MouseEvent) => void}
	 * @private
	 */
	private readonly boundMouseUp: (event: MouseEvent) => void =
		(event: MouseEvent): void =>
			this.onMouseUp(event);

	/**
	 * Attaches keyboard and mouse event listeners to the window.
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
		window.addEventListener(
			"mousedown",
			this.boundMouseDown);
		window.addEventListener(
			"mouseup",
			this.boundMouseUp);
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
	 * Removes keyboard and mouse event listeners and resets state.
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
		window.removeEventListener(
			"mousedown",
			this.boundMouseDown);
		window.removeEventListener(
			"mouseup",
			this.boundMouseUp);
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
	 * Handles mousedown events by recording the left button as pressed.
	 * @param {MouseEvent} event
	 * The mouse event.
	 * @private
	 */
	private onMouseDown(event: MouseEvent): void
	{
		if (event.button === 0)
		{
			this.mouseLeft = true;
		}
	}

	/**
	 * Handles mouseup events by recording the left button as released.
	 * @param {MouseEvent} event
	 * The mouse event.
	 * @private
	 */
	private onMouseUp(event: MouseEvent): void
	{
		if (event.button === 0)
		{
			this.mouseLeft = false;
		}
	}

	/**
	 * Resets all key and mouse states to unpressed.
	 * Called on window blur to prevent stuck inputs.
	 * @private
	 */
	private resetAll(): void
	{
		for (const key of Object.keys(this.keys))
		{
			this.keys[key] = false;
		}
		this.mouseLeft = false;
	}
}