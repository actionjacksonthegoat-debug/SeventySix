/**
 * ContentHelper - Utility for calculating available content height
 * Provides hardcoded layout dimensions for consistent height calculations across components.
 *
 * @remarks
 * These values match the design system defined in _variables.scss and component styles.
 * The breadcrumb height includes padding (0.5rem top + 0.5rem bottom = 16px)
 * plus estimated content height (button height ~36px) = ~52px total.
 */

/**
 * Layout dimension constants.
 * @type {Readonly<{ HEADER_HEIGHT: number; BREADCRUMB_HEIGHT: number; FOOTER_HEIGHT: number; TOTAL_FIXED_HEIGHT: number; }>}
 * Internal fixed dimensions used for layout calculations.
 */
const LAYOUT_DIMENSIONS: {
	readonly HEADER_HEIGHT: number;
	readonly BREADCRUMB_HEIGHT: number;
	readonly FOOTER_HEIGHT: number;
	readonly TOTAL_FIXED_HEIGHT: number;
} =
	{
	/**
	 * Header height (mat-toolbar primary)
	 * Desktop: 64px, Mobile: 56px
	 * Using desktop value as default
	 */
		HEADER_HEIGHT: 64,

		/**
	 * Breadcrumb navigation height
	 * Includes vertical padding (0.5rem * 2 = 16px) + content (~36px)
	 * Total: ~52px
	 */
		BREADCRUMB_HEIGHT: 52,

		/**
	 * Footer height (mat-toolbar)
	 * Min-height: 48px (can be taller on mobile with wrapped content)
	 */
		FOOTER_HEIGHT: 48,

		/**
	 * Total fixed layout height (header + breadcrumb + footer)
	 */
		get TOTAL_FIXED_HEIGHT(): number
		{
			return this.HEADER_HEIGHT + this.BREADCRUMB_HEIGHT + this.FOOTER_HEIGHT;
		}
	} as const;

/**
 * Calculates the available content height for scrollable content areas.
 * @param {number} offset
 * Additional offset to subtract (e.g., paginator height, padding).
 * @returns {number}
 * Available height in pixels for content area (minimum 0).
 *
 * @example
 * ```typescript
 * // Basic usage - get available height without offset
 * const availableHeight = getAvailableContentHeight();
 *
 * // With paginator (Material paginator is ~56px) and padding (16px)
 * const tableHeight = getAvailableContentHeight(72);
 *
 * // With custom offset for toolbars and spacing
 * const contentHeight = getAvailableContentHeight(120);
 * ```
 */
export function getAvailableContentHeight(offset: number = 0): number
{
	const viewportHeight: number =
		window.innerHeight;
	const availableHeight: number =
		viewportHeight - LAYOUT_DIMENSIONS.TOTAL_FIXED_HEIGHT - offset;

	return Math.max(0, availableHeight);
}

/**
 * Gets individual layout dimension values.
 * Useful for component-specific calculations.
 *
 * @type {{ headerHeight: number; breadcrumbHeight: number; footerHeight: number; totalFixedHeight: number; }}
 *
 * @property {number} headerHeight
 * Header height in pixels (desktop default: 64px).
 *
 * @property {number} breadcrumbHeight
 * Breadcrumb / navigation height in pixels (approx. 52px).
 *
 * @property {number} footerHeight
 * Footer height in pixels (approx. 48px).
 *
 * @property {number} totalFixedHeight
 * Total of header, breadcrumb and footer heights in pixels.
 */
export const LayoutDimensions: {
	readonly headerHeight: number;
	readonly breadcrumbHeight: number;
	readonly footerHeight: number;
	readonly totalFixedHeight: number;
} =
	{
		headerHeight: LAYOUT_DIMENSIONS.HEADER_HEIGHT,
		breadcrumbHeight: LAYOUT_DIMENSIONS.BREADCRUMB_HEIGHT,
		footerHeight: LAYOUT_DIMENSIONS.FOOTER_HEIGHT,
		totalFixedHeight: LAYOUT_DIMENSIONS.TOTAL_FIXED_HEIGHT
	} as const;
