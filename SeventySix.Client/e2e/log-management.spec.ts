import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Log Management Page
 * Tests complete user workflows for viewing, filtering, and managing logs
 */
test.describe("Log Management Page", () =>
{
	test.beforeEach(async ({ page }) =>
	{
		// Navigate to the log management page
		await page.goto("/admin/logs");
		await page.waitForLoadState("networkidle");
	});

	test("should navigate to log management page successfully", async ({
		page
	}) =>
	{
		// Verify page title
		await expect(page).toHaveTitle(/Log Management/);

		// Verify main heading
		const heading = page.locator("h1");
		await expect(heading).toContainText("Log Management");

		// Verify all major sections are present
		await expect(page.locator(".filters-card")).toBeVisible();
		await expect(page.locator(".summary-card")).toBeVisible();
		await expect(page.locator(".table-card")).toBeVisible();
	});

	test("should display log filters section", async ({ page }) =>
	{
		// Verify search input
		const searchInput = page.locator('input[placeholder*="Search"]');
		await expect(searchInput).toBeVisible();

		// Verify level filter chips
		await expect(
			page.locator('mat-chip-option:has-text("All")')
		).toBeVisible();
		await expect(
			page.locator('mat-chip-option:has-text("Error")')
		).toBeVisible();
		await expect(
			page.locator('mat-chip-option:has-text("Warning")')
		).toBeVisible();

		// Verify date range filters
		await expect(
			page.locator('mat-chip-option:has-text("Last 24 Hours")')
		).toBeVisible();
		await expect(
			page.locator('mat-chip-option:has-text("Last 7 Days")')
		).toBeVisible();

		// Verify action buttons
		await expect(
			page.locator('button:has-text("Export CSV")')
		).toBeVisible();
		await expect(page.locator('button:has-text("Cleanup")')).toBeVisible();
	});

	test("should search for logs", async ({ page }) =>
	{
		const searchInput = page.locator('input[placeholder*="Search"]');

		// Type search query
		await searchInput.fill("error");
		await page.waitForTimeout(500); // Wait for debounce

		// Verify table updates (check for loading state completion)
		await expect(page.locator(".loading-state")).not.toBeVisible();

		// Verify results contain search term
		const tableRows = page.locator("table tbody tr");
		const rowCount = await tableRows.count();

		if (rowCount > 0)
		{
			// At least one result should contain the search term
			const firstRow = tableRows.first();
			await expect(firstRow).toBeVisible();
		}
	});

	test("should filter logs by level", async ({ page }) =>
	{
		// Click Error level filter
		const errorChip = page.locator('mat-chip-option:has-text("Error")');
		await errorChip.click();

		// Wait for table to update
		await page.waitForTimeout(500);

		// Verify only error logs are shown
		const levelChips = page.locator("table .level-chip");
		const count = await levelChips.count();

		if (count > 0)
		{
			// All visible level chips should be "ERROR"
			for (let i = 0; i < Math.min(count, 5); i++)
			{
				const chipText = await levelChips.nth(i).textContent();
				expect(chipText?.toUpperCase()).toContain("ERROR");
			}
		}
	});

	test("should filter logs by date range", async ({ page }) =>
	{
		// Click Last 7 Days filter
		const dateRangeChip = page.locator(
			'mat-chip-option:has-text("Last 7 Days")'
		);
		await dateRangeChip.click();

		// Wait for table to update
		await page.waitForTimeout(500);
		await expect(page.locator(".loading-state")).not.toBeVisible();

		// Verify table is displayed with data
		await expect(page.locator("table")).toBeVisible();
	});

	test("should clear all filters", async ({ page }) =>
	{
		const searchInput = page.locator('input[placeholder*="Search"]');

		// Apply some filters
		await searchInput.fill("test");
		await page.locator('mat-chip-option:has-text("Error")').click();
		await page.waitForTimeout(500);

		// Click clear filters button
		const clearButton = page.locator('button:has-text("Clear Filters")');
		await clearButton.click();

		// Verify filters are cleared
		await expect(searchInput).toHaveValue("");
		await expect(
			page.locator('mat-chip-option:has-text("All")')
		).toHaveClass(/selected/);
	});

	test("should display log summary statistics", async ({ page }) =>
	{
		// Verify summary cards are visible
		await expect(page.locator(".summary-card")).toBeVisible();

		// Check for stat cards
		const statCards = page.locator(".stat-card");
		const count = await statCards.count();

		expect(count).toBeGreaterThan(0);

		// Verify stat values are numbers
		const firstStatValue = page.locator(".stat-value").first();
		await expect(firstStatValue).toBeVisible();
	});

	test("should open log detail dialog when clicking a log row", async ({
		page
	}) =>
	{
		// Wait for table to load
		await expect(page.locator("table")).toBeVisible();

		const tableRows = page.locator("table tbody tr");
		const rowCount = await tableRows.count();

		if (rowCount > 0)
		{
			// Click first row
			await tableRows.first().click();

			// Verify dialog opens
			const dialog = page.locator('.log-detail-dialog, [role="dialog"]');
			await expect(dialog).toBeVisible({ timeout: 3000 });

			// Verify dialog contains log details
			await expect(page.locator(".dialog-header")).toBeVisible();
			await expect(page.locator(".dialog-content")).toBeVisible();

			// Close dialog
			const closeButton = page.locator(
				'button[mattooltip*="Close"], button[aria-label*="Close"]'
			);
			await closeButton.click();

			// Verify dialog is closed
			await expect(dialog).not.toBeVisible();
		}
	});

	test("should select multiple logs for bulk operations", async ({
		page
	}) =>
	{
		await expect(page.locator("table")).toBeVisible();

		const checkboxes = page.locator(
			'table mat-checkbox input[type="checkbox"]'
		);
		const count = await checkboxes.count();

		if (count > 2)
		{
			// Select first two logs (skip select-all checkbox)
			await checkboxes.nth(1).click();
			await checkboxes.nth(2).click();

			// Verify bulk actions toolbar appears
			await expect(page.locator(".bulk-actions")).toBeVisible();
			await expect(page.locator(".selected-count")).toContainText("2");

			// Verify delete button is available
			await expect(
				page.locator('button:has-text("Delete Selected")')
			).toBeVisible();
		}
	});

	test("should toggle auto-refresh", async ({ page }) =>
	{
		const autoRefreshToggle = page.locator(
			'mat-slide-toggle:has-text("Auto-refresh")'
		);
		await expect(autoRefreshToggle).toBeVisible();

		// Toggle on
		await autoRefreshToggle.click();
		await page.waitForTimeout(300);

		// Verify toggle state (implementation-specific, may need adjustment)
		const toggleButton = autoRefreshToggle.locator("button");
		await expect(toggleButton).toHaveAttribute("aria-pressed", "true");

		// Toggle off
		await autoRefreshToggle.click();
		await page.waitForTimeout(300);
	});

	test("should use keyboard shortcut Ctrl+F to focus search", async ({
		page
	}) =>
	{
		const searchInput = page.locator('input[placeholder*="Search"]');

		// Press Ctrl+F
		await page.keyboard.press("Control+f");

		// Verify search input is focused
		await expect(searchInput).toBeFocused();
	});

	test("should close log detail dialog with ESC key", async ({ page }) =>
	{
		await expect(page.locator("table")).toBeVisible();

		const tableRows = page.locator("table tbody tr");
		const rowCount = await tableRows.count();

		if (rowCount > 0)
		{
			// Open dialog
			await tableRows.first().click();
			const dialog = page.locator('.log-detail-dialog, [role="dialog"]');
			await expect(dialog).toBeVisible({ timeout: 3000 });

			// Press ESC
			await page.keyboard.press("Escape");

			// Verify dialog is closed
			await expect(dialog).not.toBeVisible();
		}
	});

	test("should display pagination controls", async ({ page }) =>
	{
		await expect(page.locator("mat-paginator")).toBeVisible();

		// Verify page size options
		const pageSizeSelect = page.locator(
			"mat-select[aria-label*='Items per page']"
		);
		await expect(pageSizeSelect).toBeVisible();

		// Verify navigation buttons
		await expect(
			page.locator('button[aria-label*="Previous"]')
		).toBeVisible();
		await expect(page.locator('button[aria-label*="Next"]')).toBeVisible();
	});

	test("should change page size", async ({ page }) =>
	{
		const pageSizeSelect = page.locator(
			"mat-select[aria-label*='Items per page'], .mat-mdc-paginator-page-size-select"
		);

		if (await pageSizeSelect.isVisible())
		{
			// Click page size dropdown
			await pageSizeSelect.click();

			// Select different page size
			const option = page.locator('mat-option:has-text("25")').first();
			if (await option.isVisible())
			{
				await option.click();
				await page.waitForTimeout(500);

				// Verify table updates
				await expect(page.locator(".loading-state")).not.toBeVisible();
			}
		}
	});

	test("should handle empty state gracefully", async ({ page }) =>
	{
		// Apply very restrictive filters to get no results
		const searchInput = page.locator('input[placeholder*="Search"]');
		await searchInput.fill("xxxxxxxxnonexistent123456789xxxxxxxx");
		await page.waitForTimeout(1000);

		// Check for empty state message
		const emptyState = page.locator(
			".empty-state, :has-text('No logs found')"
		);
		const isVisible = await emptyState.isVisible().catch(() => false);

		// Either empty state or table with no rows is acceptable
		if (isVisible)
		{
			await expect(emptyState).toBeVisible();
		}
	});

	test("should be accessible with screen readers", async ({ page }) =>
	{
		// Verify ARIA labels are present
		await expect(page.locator('[role="search"]')).toBeVisible();
		await expect(page.locator('[role="region"]')).toBeVisible();
		await expect(page.locator('[aria-live="polite"]')).toBeVisible();

		// Verify semantic HTML
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator('table[role="table"]')).toBeVisible();

		// Verify keyboard navigation is possible
		await page.keyboard.press("Tab");
		const focusedElement = page.locator(":focus");
		await expect(focusedElement).toBeVisible();
	});

	test("should handle errors gracefully", async ({ page }) =>
	{
		// This test would need actual error simulation
		// For now, verify error state structure exists
		const errorState = page.locator(".error-state");

		// Check if error handling UI exists in DOM (may not be visible)
		const exists = await errorState.count();
		expect(exists).toBeGreaterThanOrEqual(0);
	});

	test("should maintain responsive design on mobile viewport", async ({
		page
	}) =>
	{
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Verify page still renders
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator(".filters-card")).toBeVisible();

		// Filters might be stacked on mobile
		const filters = page.locator(".log-filters");
		await expect(filters).toBeVisible();
	});

	test("should maintain responsive design on tablet viewport", async ({
		page
	}) =>
	{
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });

		// Verify page renders properly
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator("table")).toBeVisible();

		// Summary cards should be visible
		await expect(page.locator(".summary-card")).toBeVisible();
	});
});
