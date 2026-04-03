/**
 * Timer Display Utility.
 * Shared HUD formatting functions for game timers.
 * Provides consistent time formatting across all game modes.
 */

/** Warning threshold configuration for timer CSS classes. */
export interface TimerWarningThresholds
{
	/** Seconds at or below which the timer enters "danger" mode. */
	danger: number;

	/** Seconds at or below which the timer enters "warning" mode. */
	warning: number;
}

/** Default warning thresholds (30s danger, 60s warning). */
const DEFAULT_THRESHOLDS: TimerWarningThresholds =
	{ danger: 30, warning: 60 };

/**
 * Formats a time value in seconds to a M:SS display string.
 * @param totalSeconds
 * Total seconds (fractional values are floored).
 * @returns
 * Formatted string like "1:05" or "0:30".
 */
export function formatTimerValue(totalSeconds: number): string
{
	const rounded: number =
		Math.floor(totalSeconds);
	const minutes: number =
		Math.floor(rounded / 60);
	const seconds: number =
		rounded % 60;

	return `${String(minutes)}:${
		String(seconds)
			.padStart(2, "0")
	}`;
}

/**
 * Formats a time value in seconds to a MM:SS display string (zero-padded minutes).
 * @param totalSeconds
 * Total seconds (fractional values are floored).
 * @returns
 * Formatted string like "01:05" or "00:30".
 */
export function formatTimerValuePadded(totalSeconds: number): string
{
	const rounded: number =
		Math.floor(totalSeconds);
	const minutes: number =
		Math.floor(rounded / 60);
	const seconds: number =
		rounded % 60;

	return `${
		String(minutes)
			.padStart(2, "0")
	}:${
		String(seconds)
			.padStart(2, "0")
	}`;
}

/**
 * Returns a CSS class based on remaining timer seconds.
 * @param seconds
 * Remaining seconds on the timer.
 * @param thresholds
 * Optional custom thresholds. Defaults to 30s danger, 60s warning.
 * @returns
 * CSS class name: "timer-ok", "timer-warning", or "timer-danger".
 */
export function getTimerWarningClass(
	seconds: number,
	thresholds: TimerWarningThresholds = DEFAULT_THRESHOLDS): string
{
	if (seconds <= thresholds.danger)
	{
		return "timer-danger";
	}

	if (seconds <= thresholds.warning)
	{
		return "timer-warning";
	}

	return "timer-ok";
}