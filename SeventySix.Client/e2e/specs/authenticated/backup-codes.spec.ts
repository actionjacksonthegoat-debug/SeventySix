// <copyright file="backup-codes.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	expect,
	unauthenticatedTest,
	loginAsUser,
	BACKUP_CODES_USER,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "@e2e-fixtures";
import type { Page } from "@playwright/test";

/**
 * E2E Tests for Backup Codes Page
 *
 * Priority: P1 (Recovery Code Management)
 * Tests the backup code generation and display flow:
 * - Warning step display
 * - Code generation
 * - Code display with copy actions
 *
 * Uses a dedicated `e2e_backup_codes` user so generating backup codes
 * doesn't mutate the shared `e2e_user` state.
 */
unauthenticatedTest.describe("Backup Codes",
	() =>
	{
		unauthenticatedTest.describe.configure({ timeout: 60_000 });

		unauthenticatedTest.beforeEach(
			async ({ unauthenticatedPage }) =>
			{
				await loginAsUser(unauthenticatedPage, BACKUP_CODES_USER);

				await unauthenticatedPage.goto(ROUTES.auth.backupCodes);
			});

		unauthenticatedTest("should display warning step heading",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.generateBackupCodes);
			});

		unauthenticatedTest("should display warning information",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const warningBox =
					unauthenticatedPage.locator(SELECTORS.backupCodes.warningBox);

				await expect(warningBox)
					.toBeVisible();
			});

		unauthenticatedTest("should have generate codes button",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const generateButton =
					unauthenticatedPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.generateCodes });

				await expect(generateButton)
					.toBeVisible();
				await expect(generateButton)
					.toBeEnabled();
			});

		unauthenticatedTest("should generate and display backup codes",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const generateButton =
					unauthenticatedPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.generateCodes });

				await generateButton.click();

				// Wait for codes to appear
				await expect(unauthenticatedPage
					.locator(SELECTORS.backupCodes.codesGrid))
					.toBeVisible({ timeout: TIMEOUTS.api });

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.saveYourBackupCodes);

				// Verify individual codes are shown
				const codeItems =
					unauthenticatedPage.locator(SELECTORS.backupCodes.codeItem);

				const codeCount: number =
					await codeItems.count();

				expect(codeCount)
					.toBeGreaterThan(0);
			});
	});
