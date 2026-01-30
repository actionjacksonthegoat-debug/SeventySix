// <copyright file="request-permissions.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator, expect } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Request permissions page helper for role request operations.
 * Encapsulates common request permissions page interactions.
 */
export class RequestPermissionsPageHelper
{
	readonly page: Page;
	readonly roleCheckboxes: Locator;
	readonly messageTextarea: Locator;
	readonly submitButton: Locator;
	readonly noRolesMessage: Locator;

	/**
	 * Creates request permissions page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.roleCheckboxes = page.locator(SELECTORS.requestPermissions.roleCheckbox);
		this.messageTextarea = page.locator(SELECTORS.requestPermissions.messageTextarea);
		this.submitButton = page.locator(SELECTORS.requestPermissions.submitButton);
		this.noRolesMessage = page.locator(SELECTORS.requestPermissions.noRolesMessage);
	}

	/**
	 * Waits for the page to fully load.
	 */
	async waitForPageLoad(): Promise<void>
	{
		await this.page.waitForLoadState("load");
	}

	/**
	 * Gets the count of available role checkboxes.
	 * @returns
	 * Number of role checkboxes.
	 */
	async getRoleCount(): Promise<number>
	{
		return this.roleCheckboxes.count();
	}

	/**
	 * Checks if any roles are available for request.
	 * @returns
	 * True if roles are available.
	 */
	async hasAvailableRoles(): Promise<boolean>
	{
		const roleCount: number =
			await this.getRoleCount();
		return roleCount > 0;
	}

	/**
	 * Checks if the no roles message is displayed.
	 * @returns
	 * True if no roles message is visible.
	 */
	async hasNoRolesMessage(): Promise<boolean>
	{
		return this.noRolesMessage.isVisible();
	}

	/**
	 * Checks if the submit button is enabled.
	 * @returns
	 * True if submit button is enabled.
	 */
	async isSubmitEnabled(): Promise<boolean>
	{
		return this.submitButton.isEnabled();
	}

	/**
	 * Selects a role by clicking its checkbox.
	 * @param roleIndex
	 * Zero-based index of the role to select.
	 */
	async selectRole(roleIndex: number): Promise<void>
	{
		await this.roleCheckboxes.nth(roleIndex).click();
	}
}
