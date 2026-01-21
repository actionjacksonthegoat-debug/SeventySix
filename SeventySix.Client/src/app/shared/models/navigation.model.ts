/**
 * Navigation item configuration for sidebar navigation.
 */
export interface NavItem
{
	/**
	 * Display label for the navigation item.
	 * @type {string}
	 */
	label: string;

	/**
	 * Material icon name to display next to the item.
	 * @type {string}
	 */
	icon: string;

	/**
	 * Route path for the navigation target.
	 * @type {string}
	 */
	route: string;

	/**
	 * When true the item is displayed disabled in the UI.
	 * @type {boolean | undefined}
	 */
	disabled?: boolean;

	/**
	 * Roles required to see this item. Inherits from section if not specified.
	 * @type {string[] | undefined}
	 */
	requiredRoles?: string[];
}

/**
 * Navigation section containing grouped navigation items.
 */
export interface NavSection
{
	/**
	 * Section title displayed above the list of items.
	 * @type {string}
	 */
	title: string;

	/**
	 * Array of navigation items belonging to the section.
	 * @type {NavItem[]}
	 */
	items: NavItem[];

	/**
	 * Roles required to see this section. Empty array means visible to all (including guests).
	 * @type {string[] | undefined}
	 */
	requiredRoles?: string[];
}
