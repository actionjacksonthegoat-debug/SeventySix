// <copyright file="backup-codes.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

/**
 * E2E Tests for Backup Codes Page
 *
 * Priority: P1 (Recovery Code Management)
 * Tests the backup code generation and display flow:
 * - Warning step display
 * - Code generation
 * - Code display with copy actions
 */
test.describe("Backup Codes",
	() =>
	{
		test.beforeEach(
			async ({ userPage }) =>
			{
				await userPage.goto(ROUTES.auth.backupCodes);
				await userPage.waitForLoadState("load");
			});

		test("should display warning step heading",
			async ({ userPage }) =>
			{
				await expect(userPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.generateBackupCodes);
			});

		test("should display warning information",
			async ({ userPage }) =>
			{
				const warningBox =
					userPage.locator(SELECTORS.backupCodes.warningBox);

				await expect(warningBox)
					.toBeVisible();
			});

		test("should have generate codes button",
			async ({ userPage }) =>
			{
				const generateButton =
					userPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.generateCodes });

				await expect(generateButton)
					.toBeVisible();
				await expect(generateButton)
					.toBeEnabled();
			});

		test("should generate and display backup codes",
			async ({ userPage }) =>
			{
				const generateButton =
					userPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.generateCodes });

				await generateButton.click();

				// Wait for codes to appear
				await expect(userPage
					.locator(SELECTORS.backupCodes.codesGrid))
					.toBeVisible({ timeout: TIMEOUTS.api });

				await expect(userPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.saveYourBackupCodes);

				// Verify individual codes are shown
				const codeItems =
					userPage.locator(SELECTORS.backupCodes.codeItem);

				const codeCount: number =
					await codeItems.count();

				expect(codeCount)
					.toBeGreaterThan(0);
			});
	});
