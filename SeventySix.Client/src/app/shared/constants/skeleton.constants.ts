// <copyright file="skeleton.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Skeleton loader theme presets for consistent loading states.
 * Use with ngx-skeleton-loader's [theme] input.
 */

/** Skeleton theme type for ngx-skeleton-loader. */
export interface SkeletonTheme
{
	height: string;
	width: string;
	borderRadius?: string;
	margin?: string;
}

/** Material input field skeleton (56px height). */
export const SKELETON_INPUT: SkeletonTheme =
	{
		height: "56px",
		width: "100%",
		borderRadius: "4px"
	};

/** Checkbox/radio skeleton (24px square). */
export const SKELETON_CHECKBOX: SkeletonTheme =
	{
		height: "24px",
		width: "24px",
		borderRadius: "4px"
	};

/** Standard button skeleton. */
export const SKELETON_BUTTON: SkeletonTheme =
	{
		height: "36px",
		width: "120px",
		borderRadius: "4px"
	};

/** Short text line (labels, names). */
export const SKELETON_TEXT_SHORT: SkeletonTheme =
	{
		height: "16px",
		width: "120px",
		borderRadius: "4px"
	};

/** Medium text line (descriptions). */
export const SKELETON_TEXT_MEDIUM: SkeletonTheme =
	{
		height: "16px",
		width: "200px",
		borderRadius: "4px"
	};

/** Long text line (full-width content). */
export const SKELETON_TEXT_LONG: SkeletonTheme =
	{
		height: "16px",
		width: "100%",
		borderRadius: "4px"
	};

/** Avatar/profile image skeleton. */
export const SKELETON_AVATAR: SkeletonTheme =
	{
		height: "40px",
		width: "40px",
		borderRadius: "50%"
	};

/** Table cell content skeleton. */
export const SKELETON_TABLE_CELL: SkeletonTheme =
	{
		height: "20px",
		width: "100%",
		borderRadius: "4px",
		margin: "0"
	};

/** Card/panel skeleton. */
export const SKELETON_CARD: SkeletonTheme =
	{
		height: "200px",
		width: "100%",
		borderRadius: "8px"
	};

/** Page title skeleton. */
export const SKELETON_TITLE: SkeletonTheme =
	{
		height: "32px",
		width: "200px",
		borderRadius: "4px"
	};

/** Textarea/multiline input skeleton. */
export const SKELETON_TEXTAREA: SkeletonTheme =
	{
		height: "120px",
		width: "100%",
		borderRadius: "4px"
	};
