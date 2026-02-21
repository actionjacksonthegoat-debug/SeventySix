// <copyright file="timing.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized debounce time constants.
 * Eliminates magic numbers for timing-related values.
 */
export const DEBOUNCE_TIME: Readonly<{
	INPUT_VALIDATION: 500;
	RESIZE_EVENT: 500;
	SEARCH: 300;
}> =
	{
	/** Debounce time for form input validation (500ms). */
		INPUT_VALIDATION: 500,
		/** Debounce time for window resize events (500ms). */
		RESIZE_EVENT: 500,
		/** Debounce time for search input (300ms). */
		SEARCH: 300
	} as const;

/**
 * Polling interval constants for periodic checks.
 * Eliminates magic numbers for timer intervals.
 */
export const POLL_INTERVAL: Readonly<{
	POPUP_CLOSED: 500;
}> =
	{
	/** Interval for checking if an OAuth popup window has closed (500ms). */
		POPUP_CLOSED: 500
	} as const;

/**
 * Millisecond conversion constants for time calculations.
 * Use these instead of magic numbers in date/time logic.
 */
export const MILLISECONDS: Readonly<{
	PER_SECOND: 1_000;
	PER_MINUTE: 60_000;
	PER_HOUR: 3_600_000;
	PER_DAY: 86_400_000;
	PER_WEEK: 604_800_000;
}> =
	{
	/** Milliseconds in one second (1,000). */
		PER_SECOND: 1_000,
		/** Milliseconds in one minute (60,000). */
		PER_MINUTE: 60_000,
		/** Milliseconds in one hour (3,600,000). */
		PER_HOUR: 3_600_000,
		/** Milliseconds in one day (86,400,000). */
		PER_DAY: 86_400_000,
		/** Milliseconds in one week (604,800,000). */
		PER_WEEK: 604_800_000
	} as const;