// <copyright file="linked-accounts.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	expect,
	expectAccessible,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Linked Accounts Section (Profile Page)
 *
 * Priority: P2 (OAuth Account Linking UI)
 * Tests the linked accounts section on the profile page:
 * - Section visibility and content
 * - Connect button for unconfigured providers
 * - Accessibility compliance
 *
 * Note: Full OAuth link flow is NOT tested (requires mock provider).
 * These tests verify UI elements and states only.
 */
test.describe("Linked Accounts",
	() =>
	{
		test.beforeEach(
			async ({ userPage }: { userPage: Page; }) =>
			{
				await userPage.goto(ROUTES.account.root);
			});

		test("should display Linked Accounts section in profile settings",
			async ({ userPage }: { userPage: Page; }) =>
			{
				const section: Locator =
					userPage.locator(SELECTORS.profile.linkedAccountsSection);

				await expect(section)
					.toBeVisible();

				const heading: Locator =
					userPage.locator(SELECTORS.profile.linkedAccountsHeading);

				await expect(heading)
					.toHaveText(PAGE_TEXT.profile.linkedAccountsHeading);
			});

		test("should display Connect button for unconfigured providers",
			async ({ userPage }: { userPage: Page; }) =>
			{
				const connectButton: Locator =
					userPage.locator(SELECTORS.profile.connectButton);

				await expect(connectButton)
					.toBeVisible();
				await expect(connectButton)
					.toContainText(PAGE_TEXT.profile.connectButton);
			});

		// eslint-disable-next-line playwright/expect-expect -- expectAccessible uses expect internally
		test("should pass accessibility checks on linked accounts section",
			async ({ userPage }: { userPage: Page; }) =>
			{
				await expectAccessible(
					userPage,
					"Linked Accounts");
			});
	});