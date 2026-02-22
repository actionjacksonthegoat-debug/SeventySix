// <copyright file="breakpoint-snapshot.model.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Breakpoint state at a point in time.
 * Maps each breakpoint query to its match status.
 */
export interface BreakpointSnapshot
{
	/** Whether any breakpoint matches. */
	readonly matches: boolean;
	/** Per-query match status. */
	readonly breakpoints: Readonly<Record<string, boolean>>;
}