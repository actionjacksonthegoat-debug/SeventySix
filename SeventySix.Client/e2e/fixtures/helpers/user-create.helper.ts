// <copyright file="user-create.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";
import { TIMEOUTS } from "../timeouts.constant";
import { PAGE_TEXT } from "../page-text.constant";

/**
 * Data for creating a new user via the admin wizard.
 */
export interface CreateUserOptions
{
	/**
	 * Username for the new user.
	 */
	username: string;

	/**
	 * Email address for the new user.
	 */
	email: string;

	/**
	 * Full name for the new user.
	 */
	fullName: string;
}

/**
 * Navigates the 4-step user-create stepper and lands on the Review step
 * with the Create button visible. The caller performs the final submission.
 *
 * Step 1 — Credentials: username + email  (awaits async username validator)
 * Step 2 — Profile:     fullName
 * Step 3 — Roles:       skipped (optional, waits for listbox before advancing)
 * Step 4 — Review:      Create button visible — caller submits
 *
 * @param page
 * The Playwright page instance (must be authenticated as admin).
 *
 * @param options
 * User data to fill into the stepper form.
 */
export async function fillUserCreateStepper(
	page: Page,
	options: CreateUserOptions): Promise<void>
{
	// Set up response listener BEFORE filling username to avoid validator race
	const usernameCheckResponse =
		page.waitForResponse(
			(response) =>
				response.url().includes("/check/username/"));

	// Step 1: Credentials
	await page.locator(SELECTORS.userCreate.usernameInput)
		.fill(options.username);
	await page.locator(SELECTORS.userCreate.emailInput)
		.fill(options.email);

	// Wait for async username availability validator to complete
	await usernameCheckResponse;

	// Ensure Angular has processed the validator result (PENDING → VALID)
	await expect(page.locator(SELECTORS.userCreate.usernameInput))
		.toHaveClass(/ng-valid/, { timeout: TIMEOUTS.api });

	// getByRole excludes hidden step buttons (avoids strict mode violation)
	const nextButton =
		() => page.getByRole("button", { name: PAGE_TEXT.buttons.next });

	await nextButton().click();

	// Step 2: Profile — wait with extended timeout for stepper transition
	const fullNameInput =
		page.locator(SELECTORS.userCreate.fullNameInput);
	await fullNameInput.waitFor({ state: "visible", timeout: TIMEOUTS.api });
	await fullNameInput.fill(options.fullName);
	await nextButton().click();

	// Step 3: Roles (skip — optional)
	// Wait for the Roles panel to render before advancing
	await expect(page.getByRole("listbox", { name: PAGE_TEXT.labels.roleSelection }))
		.toBeVisible({ timeout: TIMEOUTS.api });
	await nextButton().click();

	// Step 4: Review — caller performs the final submit/assertion
	await expect(page.locator(SELECTORS.userCreate.createUserButton))
		.toBeVisible({ timeout: TIMEOUTS.navigation });
}
