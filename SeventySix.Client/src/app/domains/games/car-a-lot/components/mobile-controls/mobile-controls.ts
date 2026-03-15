/**
 * Mobile Touch Controls Component.
 * Provides on-screen touch controls for mobile/tablet devices.
 * Renders steering arrows (left/right) and action buttons (gas, jump).
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
	 * True if the device uses touch OR if mobile preview mode is active.
	 * @type {Signal<boolean>}
	 */
	protected readonly showControls: Signal<boolean> =
		computed(
			() =>
				this.inputService.isTouchDevice
					|| this.inputService.isMobilePreview());

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
	 * Handles pointer down on a control button.
	 * Sets the mapped key as pressed in InputService.
	 * Uses PointerEvent for unified touch, mouse, and pen support.
	 * @param {PointerEvent} event
	 * The pointer event from the button.
	 * @param {string} key
	 * The key identifier to press (e.g., "ArrowLeft").
	 */
	protected onPointerDown(
		event: PointerEvent,
		key: string): void
	{
		event.preventDefault();
		this.inputService.setKey(
			key,
			true);
	}

	/**
	 * Handles pointer up on a control button.
	 * Releases the mapped key in InputService.
	 * Uses PointerEvent for unified touch, mouse, and pen support.
	 * @param {PointerEvent} event
	 * The pointer event from the button.
	 * @param {string} key
	 * The key identifier to release (e.g., "ArrowLeft").
	 */
	protected onPointerUp(
		event: PointerEvent,
		key: string): void
	{
		event.preventDefault();
		this.inputService.setKey(
			key,
			false);
	}
}