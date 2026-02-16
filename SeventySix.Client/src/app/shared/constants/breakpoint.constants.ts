// <copyright file="breakpoint.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Application breakpoint media queries.
 * Mirrors Angular CDK Breakpoints values but avoids the CDK BreakpointObserver
 * which uses the deprecated MediaQueryList.addListener() method.
 *
 * @see https://material.io/design/layout/responsive-layout-grid.html
 */
interface AppBreakpoints
{
	readonly XSmall: string;
	readonly Small: string;
	readonly Medium: string;
	readonly Large: string;
	readonly XLarge: string;
}

export const APP_BREAKPOINTS: AppBreakpoints =
	{
		/** Mobile phones — (max-width: 599.98px) */
		XSmall: "(max-width: 599.98px)",
		/** Tablets — (min-width: 600px) and (max-width: 959.98px) */
		Small: "(min-width: 600px) and (max-width: 959.98px)",
		/** Laptops — (min-width: 960px) and (max-width: 1279.98px) */
		Medium: "(min-width: 960px) and (max-width: 1279.98px)",
		/** Desktops — (min-width: 1280px) and (max-width: 1919.98px) */
		Large: "(min-width: 1280px) and (max-width: 1919.98px)",
		/** Large desktops — (min-width: 1920px) */
		XLarge: "(min-width: 1920px)"
	};
