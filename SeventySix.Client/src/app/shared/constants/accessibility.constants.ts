// <copyright file="accessibility.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Accessibility constants for WCAG AA compliance.
 * Provides reusable ARIA attributes and screen reader announcements.
 */

/**
 * Common ARIA labels for standard UI actions.
 */
export const ARIA_LABELS: Readonly<{
	closeMenu: "Close navigation menu";
	toggleMenu: "Toggle navigation menu";
	mainNavigation: "Main navigation";
	dismiss: "Dismiss";
	close: "Close";
	save: "Save";
	submit: "Submit";
	cancel: "Cancel";
	delete: "Delete";
	edit: "Edit";
	refresh: "Refresh";
	search: "Search";
	copy: "Copy to clipboard";
	expand: "Expand";
	collapse: "Collapse";
	expandSection: (section: string) => string;
	collapseSection: (section: string) => string;
	loading: "Loading";
	saving: "Saving";
	submitting: "Submitting";
	rowActions: "Row actions";
	columnVisibility: "Toggle column visibility";
	refreshTable: "Refresh table data";
	executeSearch: "Execute search";
	userMenu: "User menu";
	accountOptions: "Account options";
	toggleBrightness: "Toggle brightness";
	toggleColorScheme: "Toggle color scheme";
}> =
	{
	// Navigation
		closeMenu: "Close navigation menu",
		toggleMenu: "Toggle navigation menu",
		mainNavigation: "Main navigation",

		// Actions
		dismiss: "Dismiss",
		close: "Close",
		save: "Save",
		submit: "Submit",
		cancel: "Cancel",
		delete: "Delete",
		edit: "Edit",
		refresh: "Refresh",
		search: "Search",
		copy: "Copy to clipboard",

		// Toggle states
		expand: "Expand",
		collapse: "Collapse",
		expandSection: (section: string) => `Expand ${section}`,
		collapseSection: (section: string) =>
			`Collapse ${section}`,

		// Loading states
		loading: "Loading",
		saving: "Saving",
		submitting: "Submitting",

		// Table actions
		rowActions: "Row actions",
		columnVisibility: "Toggle column visibility",
		refreshTable: "Refresh table data",
		executeSearch: "Execute search",

		// User menu
		userMenu: "User menu",
		accountOptions: "Account options",

		// Theme
		toggleBrightness: "Toggle brightness",
		toggleColorScheme: "Toggle color scheme"
	} as const;

/**
 * ARIA roles for semantic structure.
 */
export const ARIA_ROLES: Readonly<{
	landmarks: {
		banner: "banner";
		main: "main";
		navigation: "navigation";
		contentinfo: "contentinfo";
		complementary: "complementary";
		region: "region";
	};
	widgets: {
		alert: "alert";
		dialog: "dialog";
		progressbar: "progressbar";
		tabpanel: "tabpanel";
		tablist: "tablist";
		tab: "tab";
	};
	liveRegions: {
		polite: "polite";
		assertive: "assertive";
		off: "off";
	};
}> =
	{
		landmarks: {
			banner: "banner",
			main: "main",
			navigation: "navigation",
			contentinfo: "contentinfo",
			complementary: "complementary",
			region: "region"
		},

		widgets: {
			alert: "alert",
			dialog: "dialog",
			progressbar: "progressbar",
			tabpanel: "tabpanel",
			tablist: "tablist",
			tab: "tab"
		},

		liveRegions: {
			polite: "polite",
			assertive: "assertive",
			off: "off"
		}
	} as const;

/**
 * Screen reader announcement messages.
 */
export const SCREEN_READER_MESSAGES: Readonly<{
	formSuccess: (action: string) => string;
	formError: (action: string) => string;
	itemDeleted: (item: string) => string;
	copiedToClipboard: "Copied to clipboard";
	loadingComplete: "Content loaded";
}> =
	{
		formSuccess: (action: string) =>
			`${action} completed successfully`,
		formError: (action: string) =>
			`${action} failed, please check the form for errors`,
		itemDeleted: (item: string) =>
			`${item} has been deleted`,
		copiedToClipboard: "Copied to clipboard",
		loadingComplete: "Content loaded"
	} as const;