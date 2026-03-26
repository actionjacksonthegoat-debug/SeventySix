// <copyright file="spy-mobile-controls.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Mobile Controls Component.
 * Provides a transparent full-screen touch overlay for directional movement.
 * Calculates the direction from screen center to touch point and injects
 * WASD key presses via InputService.setKey() so game physics require zero changes.
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	type OutputEmitterRef,
	type Signal
} from "@angular/core";
import { InputService } from "@games/shared/services/input.service";

/** Mobile tap payload with viewport coordinates. */
interface MobileTapEvent
{
	/** Tap X coordinate in viewport pixels. */
	readonly clientX: number;

	/** Tap Y coordinate in viewport pixels. */
	readonly clientY: number;
}

/** Maximum gesture duration to classify as tap (milliseconds). */
const TAP_MAX_DURATION_MS: number = 220;

/** Maximum gesture travel distance to classify as tap (pixels). */
const TAP_MAX_DISTANCE_PX: number = 12;

/**
 * Angle threshold in radians for cardinal direction detection.
 * A threshold of 67.5° (3π/8) allows overlapping diagonal zones
 * where two adjacent cardinal keys are set simultaneously.
 * @type {number}
 */
const DIRECTION_THRESHOLD: number =
	(3 * Math.PI) / 8;

/**
 * Transparent touch overlay component for Spy And Fly mobile controls.
 * Touch anywhere on screen to move the spy in that direction.
 * Supports 8-directional movement via overlapping cardinal zones.
 */
@Component(
	{
		selector: "app-spy-mobile-controls",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./spy-mobile-controls.html",
		styleUrl: "./spy-mobile-controls.scss"
	})
export class SpyMobileControlsComponent
{
	/** Emits when a tap gesture is detected on the touch overlay. */
	readonly mobileTap: OutputEmitterRef<MobileTapEvent> =
		output<MobileTapEvent>();

	/** Input service for injecting virtual key presses. */
	private readonly inputService: InputService =
		inject(InputService);

	/**
	 * Whether touch controls overlay should be displayed.
	 * True if the device uses touch OR if mobile preview mode is active.
	 * @type {Signal<boolean>}
	 */
	protected readonly showControls: Signal<boolean> =
		computed(
			() =>
				this.inputService.isTouchDevice
					|| this.inputService.isMobilePreview());

	/** Direction keys that may be active during a touch gesture. */
	private readonly directionKeys: readonly string[] =
		["w", "a", "s", "d"];

	/** Timestamp when current touch gesture started. */
	private touchStartTimestampMs: number = 0;

	/** Gesture start X coordinate. */
	private touchStartX: number = 0;

	/** Gesture start Y coordinate. */
	private touchStartY: number = 0;

	/** Latest touch X coordinate. */
	private touchCurrentX: number = 0;

	/** Latest touch Y coordinate. */
	private touchCurrentY: number = 0;

	/**
	 * Handles touch start on the overlay.
	 * Calculates direction from center and sets appropriate keys.
	 * @param {TouchEvent} event
	 * The touch start event.
	 */
	protected onTouchStart(event: TouchEvent): void
	{
		event.preventDefault();
		if (event.touches.length > 0)
		{
			const touch: Touch =
				event.touches[0];
			this.touchStartTimestampMs =
				performance.now();
			this.touchStartX =
				touch.clientX;
			this.touchStartY =
				touch.clientY;
			this.touchCurrentX =
				touch.clientX;
			this.touchCurrentY =
				touch.clientY;
			this.updateDirection(
				touch.clientX,
				touch.clientY);
		}
	}

	/**
	 * Handles touch move on the overlay.
	 * Recalculates direction as the finger moves.
	 * @param {TouchEvent} event
	 * The touch move event.
	 */
	protected onTouchMove(event: TouchEvent): void
	{
		event.preventDefault();
		if (event.touches.length > 0)
		{
			const touch: Touch =
				event.touches[0];
			this.touchCurrentX =
				touch.clientX;
			this.touchCurrentY =
				touch.clientY;
			this.updateDirection(
				touch.clientX,
				touch.clientY);
		}
	}

	/**
	 * Handles touch end on the overlay.
	 * Releases all direction keys.
	 * @param {TouchEvent} _event
	 * The touch end event (unused).
	 */
	protected onTouchEnd(_event: TouchEvent): void
	{
		this.releaseAllKeys();

		const durationMs: number =
			performance.now() - this.touchStartTimestampMs;
		const deltaX: number =
			this.touchCurrentX - this.touchStartX;
		const deltaY: number =
			this.touchCurrentY - this.touchStartY;
		const distance: number =
			Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (durationMs <= TAP_MAX_DURATION_MS && distance <= TAP_MAX_DISTANCE_PX)
		{
			this.mobileTap.emit(
				{
					clientX: this.touchCurrentX,
					clientY: this.touchCurrentY
				});
		}
	}

	/**
	 * Handles touch cancel on the overlay.
	 * Releases all direction keys to prevent stuck movement.
	 * @param {TouchEvent} _event
	 * The touch cancel event (unused).
	 */
	protected onTouchCancel(_event: TouchEvent): void
	{
		this.releaseAllKeys();
	}

	/**
	 * Calculates direction from screen center to touch point and sets keys.
	 * Uses angle-based detection with overlapping zones for diagonal support.
	 * @param {number} touchX
	 * Touch X coordinate in viewport pixels.
	 * @param {number} touchY
	 * Touch Y coordinate in viewport pixels.
	 */
	private updateDirection(
		touchX: number,
		touchY: number): void
	{
		const centerX: number =
			window.innerWidth / 2;
		const centerY: number =
			window.innerHeight / 2;

		const dx: number =
			touchX - centerX;
		const dy: number =
			touchY - centerY;
		const angle: number =
			Math.atan2(dy, dx);

		// Release all keys first, then set active ones
		this.releaseAllKeys();

		// Up: angle near -π/2 (top of screen, negative Y in screen coords)
		if (
			angle > -(Math.PI / 2) - DIRECTION_THRESHOLD
				&& angle < -(Math.PI / 2) + DIRECTION_THRESHOLD)
		{
			this.inputService.setKey("w", true);
		}

		// Down: angle near π/2
		if (
			angle > (Math.PI / 2) - DIRECTION_THRESHOLD
				&& angle < (Math.PI / 2) + DIRECTION_THRESHOLD)
		{
			this.inputService.setKey("s", true);
		}

		// Right: angle near 0
		if (
			angle > -DIRECTION_THRESHOLD
				&& angle < DIRECTION_THRESHOLD)
		{
			this.inputService.setKey("d", true);
		}

		// Left: angle near ±π
		if (
			angle > Math.PI - DIRECTION_THRESHOLD
				|| angle < -Math.PI + DIRECTION_THRESHOLD)
		{
			this.inputService.setKey("a", true);
		}
	}

	/**
	 * Releases all direction keys via InputService.
	 */
	private releaseAllKeys(): void
	{
		for (const key of this.directionKeys)
		{
			this.inputService.setKey(key, false);
		}
	}
}