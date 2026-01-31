// <copyright file="profile.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, Locator, expect } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Profile page helper for account management operations.
 * Encapsulates common profile page interactions.
 */
export class ProfilePageHelper
{
	readonly page: Page;
	readonly profileCard: Locator;
	readonly emailInput: Locator;
	readonly fullNameInput: Locator;
	readonly saveButton: Locator;
	readonly requestPermissionsLink: Locator;

	/**
	 * Creates profile page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.profileCard = page.locator(SELECTORS.profile.profileCard).first();
		this.emailInput = page.locator(SELECTORS.profile.emailInput);
		this.fullNameInput = page.locator(SELECTORS.profile.fullNameInput);
		this.saveButton = page.locator(SELECTORS.profile.saveButton);
		this.requestPermissionsLink = page.locator(SELECTORS.profile.requestPermissionsLink);
	}

	/**
	 * Waits for the profile page to fully load.
	 */
	async waitForPageLoad(): Promise<void>
	{
		await this.page.waitForLoadState("load");
		await expect(this.profileCard)
			.toBeVisible();
	}

	/**
	 * Gets the username displayed in the card title.
	 * @returns
	 * Locator for the username.
	 */
	getUsername(): Locator
	{
		return this.profileCard.locator("mat-card-title");
	}

	/**
	 * Fills the profile form fields.
	 * @param email
	 * Email address to set.
	 * @param fullName
	 * Full name to set.
	 */
	async fillForm(
		email: string,
		fullName: string): Promise<void>
	{
		await this.emailInput.fill(email);
		await this.fullNameInput.fill(fullName);
	}

	/**
	 * Checks if the save button is enabled.
	 * @returns
	 * True if save button is enabled.
	 */
	async isSaveEnabled(): Promise<boolean>
	{
		return this.saveButton.isEnabled();
	}

	/**
	 * Checks if the request permissions link is visible.
	 * @returns
	 * True if link is visible.
	 */
	async hasRequestPermissionsLink(): Promise<boolean>
	{
		return this.requestPermissionsLink.isVisible();
	}
}
