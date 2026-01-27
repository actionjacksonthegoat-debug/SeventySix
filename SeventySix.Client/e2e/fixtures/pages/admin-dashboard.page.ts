// <copyright file="admin-dashboard.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator, expect } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Admin dashboard page helper for tab navigation.
 * Encapsulates common admin dashboard operations.
 */
export class AdminDashboardPageHelper
{
	readonly page: Page;
	readonly tabs: Locator;
	readonly pageHeader: Locator;
	readonly toolbarHeading: Locator;
	readonly toolbarIcon: Locator;
	readonly grafanaEmbed: Locator;
	readonly apiStatsTable: Locator;
	readonly observabilityCard: Locator;
	readonly jaegerButton: Locator;
	readonly prometheusButton: Locator;
	readonly grafanaButton: Locator;

	/**
	 * Creates admin dashboard page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.tabs = page.locator(SELECTORS.adminDashboard.tab);
		this.pageHeader = page.locator(SELECTORS.adminDashboard.pageHeader);
		this.toolbarHeading = page.locator(SELECTORS.adminDashboard.toolbarHeading);
		this.toolbarIcon = page.locator(SELECTORS.adminDashboard.toolbarIcon);
		this.grafanaEmbed = page.locator(SELECTORS.adminDashboard.grafanaEmbed);
		this.apiStatsTable = page.locator(SELECTORS.adminDashboard.apiStatsTable);
		this.observabilityCard = page.locator(SELECTORS.adminDashboard.observabilityCard);
		this.jaegerButton = page.locator(SELECTORS.adminDashboard.jaegerButton);
		this.prometheusButton = page.locator(SELECTORS.adminDashboard.prometheusButton);
		this.grafanaButton = page.locator(SELECTORS.adminDashboard.grafanaButton);
	}

	/**
	 * Gets a tab by index.
	 * @param tabIndex
	 * Zero-based tab index.
	 * @returns
	 * Locator for the tab.
	 */
	getTab(tabIndex: number): Locator
	{
		return this.tabs.nth(tabIndex);
	}

	/**
	 * Clicks a tab by index.
	 * @param tabIndex
	 * Zero-based tab index.
	 */
	async selectTab(tabIndex: number): Promise<void>
	{
		await this.tabs.nth(tabIndex).click();
	}

	/**
	 * Gets Grafana embed by title attribute.
	 * @param title
	 * Expected title attribute value.
	 * @returns
	 * Locator for the embed component (not the iframe inside).
	 */
	getGrafanaByTitle(title: string): Locator
	{
		return this.page.locator(`app-grafana-dashboard-embed[title="${title}"]`);
	}

	/**
	 * Gets tab count.
	 * @returns
	 * Number of tabs visible.
	 */
	async getTabCount(): Promise<number>
	{
		return this.tabs.count();
	}

	/**
	 * Asserts that a tab is selected via aria-selected.
	 * @param tabIndex
	 * Zero-based tab index.
	 */
	async expectTabSelected(tabIndex: number): Promise<void>
	{
		await expect(this.tabs.nth(tabIndex))
			.toHaveAttribute(
				"aria-selected",
				"true");
	}

	/**
	 * Asserts that a tab is active via CSS class.
	 * @param tabIndex
	 * Zero-based tab index.
	 */
	async expectTabActive(tabIndex: number): Promise<void>
	{
		await expect(this.tabs.nth(tabIndex))
			.toHaveClass(/mdc-tab--active/);
	}
}
