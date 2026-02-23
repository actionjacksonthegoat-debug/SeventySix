// <copyright file="auth.page.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Locator, Page } from "@playwright/test";
import { solveAltchaChallenge } from "../helpers/altcha.helper";
import { SELECTORS } from "../selectors.constant";

/**
 * Auth page helper for login form interactions.
 * Encapsulates common authentication page operations.
 */
export class AuthPageHelper
{
	readonly page: Page;
	readonly submitButton: Locator;
	readonly usernameInput: Locator;
	readonly passwordInput: Locator;
	readonly emailInput: Locator;
	readonly snackbar: Locator;
	readonly pageHeading: Locator;
	readonly githubButton: Locator;
	readonly forgotPasswordLink: Locator;
	readonly signInLink: Locator;
	readonly rememberMeCheckbox: Locator;

	/**
	 * Creates auth page helper.
	 * @param page
	 * Playwright page instance.
	 */
	constructor(page: Page)
	{
		this.page = page;
		this.submitButton =
			page.locator(SELECTORS.form.submitButton);
		this.usernameInput =
			page.locator(SELECTORS.form.usernameInput);
		this.passwordInput =
			page.locator(SELECTORS.form.passwordInput);
		this.emailInput =
			page.locator(SELECTORS.form.emailInput);
		this.snackbar =
			page.locator(SELECTORS.notification.snackbar);
		this.pageHeading =
			page.locator(SELECTORS.layout.pageHeading);
		this.githubButton =
			page.locator(SELECTORS.auth.githubButton);
		this.forgotPasswordLink =
			page.locator(SELECTORS.auth.forgotPasswordLink);
		this.signInLink =
			page.locator(SELECTORS.auth.signInLink);
		this.rememberMeCheckbox =
			page.locator(SELECTORS.form.rememberMeCheckbox);
	}

	/**
	 * Fills and submits login form.
	 * @param username
	 * Username or email.
	 * @param password
	 * User password.
	 */
	async login(
		username: string,
		password: string): Promise<void>
	{
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
		await solveAltchaChallenge(this.page);
		await this.submitButton.click();
	}

	/**
	 * Fills email-only form (register, forgot password).
	 * @param email
	 * Email address.
	 */
	async submitEmail(email: string): Promise<void>
	{
		await this.emailInput.fill(email);
		await solveAltchaChallenge(this.page);
		await this.submitButton.click();
	}

	/**
	 * Submits form without filling fields (for validation testing).
	 */
	async submitEmpty(): Promise<void>
	{
		await this.submitButton.click();
	}

	/**
	 * Fills login form but does not submit (for validation testing).
	 * @param username
	 * Username or email.
	 * @param password
	 * User password.
	 */
	async fillLoginForm(
		username: string,
		password: string): Promise<void>
	{
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
	}

	/**
	 * Checks the Remember Me checkbox.
	 */
	async checkRememberMe(): Promise<void>
	{
		await this.rememberMeCheckbox.click();
	}
}