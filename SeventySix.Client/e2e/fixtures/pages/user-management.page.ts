// <copyright file="user-management.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator, expect } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * User management page helper for admin user operations.
 * Encapsulates common user management page interactions.
 */
export class UserManagementPageHelper
{
	readonly page: Page;
	readonly pageHeader: Locator;
	readonly createUserButton: Locator;
	readonly userList: Locator;
	readonly dataTable: Locator;

	/**
	 * Creates user management page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.pageHeader = page.locator(SELECTORS.userManagement.pageHeader);
		this.createUserButton = page.locator(SELECTORS.userManagement.createUserButton);
		this.userList = page.locator(SELECTORS.userManagement.userList);
		this.dataTable = page.locator(SELECTORS.userManagement.dataTable);
	}

	/**
	 * Waits for the page to fully load including data table.
	 */
	async waitForPageLoad(): Promise<void>
	{
		await this.page.waitForLoadState("load");
		await expect(this.pageHeader)
			.toBeVisible();
	}

	/**
	 * Gets the page heading text.
	 * @returns
	 * Locator for the heading.
	 */
	getHeading(): Locator
	{
		return this.pageHeader.locator("h1");
	}

	/**
	 * Clicks the create user button to navigate to create page.
	 */
	async clickCreateUser(): Promise<void>
	{
		await this.createUserButton.click();
	}

	/**
	 * Checks if the data table is visible.
	 * @returns
	 * True if data table is displayed.
	 */
	async isDataTableVisible(): Promise<boolean>
	{
		return this.dataTable.isVisible();
	}
}
