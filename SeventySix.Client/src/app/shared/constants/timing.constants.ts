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
	SCROLL: 100;
}> =
	{
	/** Debounce time for form input validation (500ms). */
		INPUT_VALIDATION: 500,
		/** Debounce time for window resize events (500ms). */
		RESIZE_EVENT: 500,
		/** Debounce time for search input (300ms). */
		SEARCH: 300,
		/** Debounce time for scroll events (100ms). */
		SCROLL: 100
	} as const;

/**
 * Animation duration constants in milliseconds.
 */
export const ANIMATION_DURATION: Readonly<{
	FAST: 150;
	NORMAL: 300;
	SLOW: 500;
}> =
	{
	/** Fast animation duration (150ms). */
		FAST: 150,
		/** Normal animation duration (300ms). */
		NORMAL: 300,
		/** Slow animation duration (500ms). */
		SLOW: 500
	} as const;
