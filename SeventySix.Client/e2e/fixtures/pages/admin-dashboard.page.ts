// <copyright file="admin-dashboard.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { expect, Locator, Page } from "@playwright/test";
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
	readonly dataCard: Locator;
	readonly jaegerButton: Locator;
	readonly prometheusButton: Locator;
	readonly grafanaButton: Locator;
	readonly pgAdminButton: Locator;
	readonly redisInsightButton: Locator;

	/**
	 * Creates admin dashboard page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.tabs =
			page.locator(SELECTORS.adminDashboard.tab);
		this.pageHeader =
			page.locator(SELECTORS.adminDashboard.pageHeader);
		this.toolbarHeading =
			page.locator(SELECTORS.adminDashboard.toolbarHeading);
		this.toolbarIcon =
			page.locator(SELECTORS.adminDashboard.toolbarIcon);
		this.grafanaEmbed =
			page.locator(SELECTORS.adminDashboard.grafanaEmbed);
		this.apiStatsTable =
			page.locator(SELECTORS.adminDashboard.apiStatsTable);
		this.observabilityCard =
			page.locator(SELECTORS.adminDashboard.observabilityCard);
		this.dataCard =
			page.locator(SELECTORS.adminDashboard.dataCard);
		this.jaegerButton =
			page.locator(SELECTORS.adminDashboard.jaegerButton);
		this.prometheusButton =
			page.locator(SELECTORS.adminDashboard.prometheusButton);
		this.grafanaButton =
			page.locator(SELECTORS.adminDashboard.grafanaButton);
		this.pgAdminButton =
			page.locator(SELECTORS.adminDashboard.pgAdminButton);
		this.redisInsightButton =
			page.locator(SELECTORS.adminDashboard.redisInsightButton);
	}

	/**
	 * Gets a tab by its visible label text.
	 * @param tabLabel
	 * The tab's text label.
	 * @returns
	 * Locator for the tab.
	 */
	getTab(tabLabel: string): Locator
	{
		return this.tabs.filter(
			{ hasText: tabLabel });
	}

	/**
	 * Clicks a tab by its visible label text.
	 * @param tabLabel
	 * The tab's text label.
	 */
	async selectTab(tabLabel: string): Promise<void>
	{
		await this
			.tabs
			.filter(
				{ hasText: tabLabel })
			.click();
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
	 * @param tabLabel
	 * The tab's text label.
	 */
	async expectTabSelected(tabLabel: string): Promise<void>
	{
		await expect(
			this.tabs.filter(
				{ hasText: tabLabel }))
			.toHaveAttribute(
				"aria-selected",
				"true");
	}

	/**
	 * Asserts that a tab is active via CSS class.
	 * @param tabLabel
	 * The tab's text label.
	 */
	async expectTabActive(tabLabel: string): Promise<void>
	{
		await expect(
			this.tabs.filter(
				{ hasText: tabLabel }))
			.toHaveClass(/mdc-tab--active/);
	}
}