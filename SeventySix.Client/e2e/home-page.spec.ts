import { test, expect, Page, Locator } from "@playwright/test";

/**
 * E2E Tests for Home Page
 *
 * The home page displays 1 feature panel:
 * 1. Sandbox - Routes to /sandbox
 */
test.describe("Home Page", () =>
{
	test.beforeEach(async ({ page }: { page: Page }) =>
	{
		await page.goto("/");
	});

	test.describe("Page Structure", () =>
	{
		test("should display welcome heading", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await expect(page.locator("h1")).toHaveText(
				"Welcome to SeventySix"
			);
		});

		test("should display subtitle", async ({ page }: { page: Page }) =>
		{
			await expect(page.locator(".subtitle")).toHaveText(
				"Select a feature to get started"
			);
		});

		test("should display one feature card", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const cards: Locator = page.locator(".feature-card");
			await expect(cards).toHaveCount(1);
		});
	});

	test.describe("Panel 1: Sandbox", () =>
	{
		test("should display Sandbox card with correct title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator("mat-card-title")).toHaveText(
				"Sandbox"
			);
		});

		test("should display Sandbox description", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator("mat-card-content p")).toHaveText(
				"Experimentation area for testing new features and ideas"
			);
		});

		test("should display science icon for Sandbox", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator(".feature-icon")).toContainText("science");
		});

		test("should navigate to /sandbox when Sandbox card is clicked", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await card.click();
			await expect(page).toHaveURL(/\/sandbox/);
		});
	});

	test.describe("Card Actions", () =>
	{
		test("should display Open button with arrow icon on the card", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(
				card.locator(".card-action-text")
			).toContainText("Open");
			await expect(
				card.locator(".card-action-text mat-icon")
			).toContainText("arrow_forward");
		});
	});
});
