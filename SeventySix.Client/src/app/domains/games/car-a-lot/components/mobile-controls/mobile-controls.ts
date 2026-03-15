/**
 * Mobile Touch Controls Component.
 * Provides on-screen touch controls for mobile/tablet devices.
 * Renders steering arrows (left/right) and action buttons (gas, brake, jump).
 * Feeds touch input into InputService via setKey() so game physics
 * require zero changes — same polling mechanism as keyboard.
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	type Signal
} from "@angular/core";
import { RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { InputService } from "@games/shared/services/input.service";

/** Minimum touch target size in pixels for kid-friendly accessibility. */
const TOUCH_TARGET_MIN_PX: number = 56;

/**
 * On-screen touch controls overlay for mobile devices.
 * Only visible on touch-capable devices. Absolutely positioned
 * over the game canvas with pointer-events only on the buttons.
 */
@Component(
	{
		selector: "app-mobile-controls",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./mobile-controls.html",
		styleUrl: "./mobile-controls.scss",
		host: {
			"[style.min-height.px]": `${TOUCH_TARGET_MIN_PX}`
		}
	})
export class MobileControlsComponent
{
	/** Input service for injecting virtual key presses. */
	private readonly inputService: InputService =
		inject(InputService);

	/** Race state service for contextual button visibility. */
	private readonly raceStateService: RaceStateService =
		inject(RaceStateService);

	/**
	 * Whether touch controls should be displayed.
	 * @type {boolean}
	 */
	protected readonly showControls: boolean =
		this.inputService.isTouchDevice;

	/**
	 * Whether the jump button should be visible (only during OctopusPhase).
	 * @type {Signal<boolean>}
	 */
	protected readonly showJumpButton: Signal<boolean> =
		computed(
			() =>
				this.raceStateService.currentState() === RaceState.OctopusPhase);

	/**
	 * Whether the game is in an active playing state (controls responsive).
	 * @type {Signal<boolean>}
	 */
	protected readonly isPlaying: Signal<boolean> =
		computed(
			() =>
			{
				const state: RaceState =
					this.raceStateService.currentState();

				return state === RaceState.Racing
					|| state === RaceState.OctopusPhase
					|| state === RaceState.Rescue;
			});

	/**
	 * Handles touch start on a control button.
	 * Sets the mapped key as pressed in InputService.
	 * @param {TouchEvent} event
	 * The touch event from the button.
	 * @param {string} key
	 * The key identifier to press (e.g., "ArrowLeft").
	 */
	protected onTouchStart(
		event: TouchEvent,
		key: string): void
	{
		event.preventDefault();
		this.inputService.setKey(
			key,
			true);
	}

	/**
	 * Handles touch end on a control button.
	 * Releases the mapped key in InputService.
	 * @param {TouchEvent} event
	 * The touch event from the button.
	 * @param {string} key
	 * The key identifier to release (e.g., "ArrowLeft").
	 */
	protected onTouchEnd(
		event: TouchEvent,
		key: string): void
	{
		event.preventDefault();
		this.inputService.setKey(
			key,
			false);
	}
}