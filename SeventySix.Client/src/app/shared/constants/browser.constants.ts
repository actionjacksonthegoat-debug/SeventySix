// <copyright file="browser.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Browser API feature detection keys for `in window` capability checks.
 */
export const BROWSER_FEATURE: Readonly<{
	/** Key string for Window.requestIdleCallback feature detection. */
	IDLE_CALLBACK: "requestIdleCallback";
}> =
	{
		IDLE_CALLBACK: "requestIdleCallback"
	} as const;

/**
 * Valid values for `document.readyState`.
 */
export const DOCUMENT_READY_STATE: Readonly<{
	/** DOM and all sub-resources have finished loading. */
	COMPLETE: "complete";
}> =
	{
		COMPLETE: "complete"
	} as const;

/**
 * DOM window event names used with `addEventListener`.
 */
export const WINDOW_EVENT: Readonly<{
	/** Fires when the page and all its sub-resources have finished loading. */
	LOAD: "load";
}> =
	{
		LOAD: "load"
	} as const;

/**
 * String results of the `typeof` operator for runtime environment detection.
 */
export const TYPEOF_RESULT: Readonly<{
	/** Returned by `typeof` when a value or global is absent / undefined. */
	UNDEFINED: "undefined";
}> =
	{
		UNDEFINED: "undefined"
	} as const;