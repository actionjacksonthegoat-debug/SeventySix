// <copyright file="ui.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Table component height constants in pixels.
 * Based on Material Design density scale -1 (compact mode).
 * Measurements reflect actual rendered heights in the application.
 */
const TABLE_COMPONENT_HEIGHTS: Readonly<{
	/** Search toolbar height: mat-form-field at density -1 (48px) + padding (12px top/bottom). */
	SEARCH_TOOLBAR: 72;
	/** Filter chips toolbar height: chips at density -1 (24px) + padding (12px top/bottom). */
	FILTER_CHIPS_TOOLBAR: 48;
	/** Standard table row height at density -1. */
	ROW_HEIGHT: 48;
	/** Table header height at density -1. */
	HEADER_HEIGHT: 56;
	/** Paginator height at density -1. */
	PAGINATOR_HEIGHT: 56;
	/** Default minimum table height. */
	MIN_HEIGHT: 400;
}> =
	{
		SEARCH_TOOLBAR: 72,
		FILTER_CHIPS_TOOLBAR: 48,
		ROW_HEIGHT: 48,
		HEADER_HEIGHT: 56,
		PAGINATOR_HEIGHT: 56,
		MIN_HEIGHT: 400
	} as const;

/**
 * Calculates the standard table offset for search + filter toolbars.
 * @returns {number}
 * Total offset in pixels (120px = search 72px + filters 48px).
 */
export function getStandardTableOffset(): number
{
	return TABLE_COMPONENT_HEIGHTS.SEARCH_TOOLBAR + TABLE_COMPONENT_HEIGHTS.FILTER_CHIPS_TOOLBAR;
}
