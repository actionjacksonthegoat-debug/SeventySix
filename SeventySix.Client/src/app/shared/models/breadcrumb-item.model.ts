/**
 * Breadcrumb item interface.
 */
export interface BreadcrumbItem
{
	/**
	 * Display label for the breadcrumb segment.
	 * @type {string}
	 */
	label: string;

	/**
	 * Route or URL to navigate when the breadcrumb is clicked.
	 * @type {string}
	 */
	url: string;

	/**
	 * Whether this segment is the active/current page.
	 * @type {boolean}
	 */
	isActive: boolean;
}
