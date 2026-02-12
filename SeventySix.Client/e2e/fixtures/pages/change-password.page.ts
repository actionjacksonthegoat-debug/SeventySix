// <copyright file="change-password.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";

/**
 * Page helper for the Change Password page.
 * Encapsulates form interactions for password change tests.
 */
export class ChangePasswordPageHelper
{
	/** The Playwright page instance. */
	readonly page: Page;

	/** Current password input locator. */
	readonly currentPasswordInput: Locator;

	/** New password input locator. */
	readonly newPasswordInput: Locator;

	/** Confirm password input locator. */
	readonly confirmPasswordInput: Locator;

	/** Submit button locator. */
	readonly submitButton: Locator;

	/**
	 * Creates a ChangePasswordPageHelper.
	 *
	 * @param page
	 * The Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.currentPasswordInput = page.locator(SELECTORS.changePassword.currentPasswordInput);
		this.newPasswordInput = page.locator(SELECTORS.changePassword.newPasswordInput);
		this.confirmPasswordInput = page.locator(SELECTORS.changePassword.confirmPasswordInput);
		this.submitButton = page.locator(SELECTORS.changePassword.submitButton);
	}

	/**
	 * Fills the change password form and submits.
	 *
	 * @param currentPassword
	 * The current password value.
	 *
	 * @param updatedPassword
	 * The new password to set (fills both new and confirm fields).
	 */
	async fillAndSubmit(
		currentPassword: string,
		updatedPassword: string): Promise<void>
	{
		await this.currentPasswordInput.fill(currentPassword);
		await this.newPasswordInput.fill(updatedPassword);
		await this.confirmPasswordInput.fill(updatedPassword);
		await this.submitButton.click();
	}
}
