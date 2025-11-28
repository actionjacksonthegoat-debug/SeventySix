import { test, expect, Page, Locator } from "@playwright/test";

/**
 * E2E Tests for Home Page
 *
 * The home page displays 3 feature panels:
 * 1. World Map - Routes to /game
 * 2. Physics - Routes to /physics
 * 3. RV Camper - Routes to /rv-camper
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

		test("should display three feature cards", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const cards: Locator = page.locator(".feature-card");
			await expect(cards).toHaveCount(3);
		});
	});

	test.describe("Panel 1: World Map", () =>
	{
		test("should display World Map card with correct title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator("mat-card-title")).toHaveText(
				"World Map"
			);
		});

		test("should display World Map description", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator("mat-card-content p")).toHaveText(
				"Interactive game world map and exploration features"
			);
		});

		test("should display public icon for World Map", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await expect(card.locator(".feature-icon")).toContainText("public");
		});

		test("should navigate to /game when World Map card is clicked", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").first();
			await card.click();
			await expect(page).toHaveURL(/\/game/);
		});
	});

	test.describe("Panel 2: Physics", () =>
	{
		test("should display Physics card with correct title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(1);
			await expect(card.locator("mat-card-title")).toHaveText("Physics");
		});

		test("should display Physics description", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(1);
			await expect(card.locator("mat-card-content p")).toHaveText(
				"Electricity generation from buoyancy and calculations"
			);
		});

		test("should display bolt icon for Physics", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(1);
			await expect(card.locator(".feature-icon")).toContainText("bolt");
		});

		test("should navigate to /physics when Physics card is clicked", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(1);
			await card.click();
			await expect(page).toHaveURL(/\/physics/);
		});
	});

	test.describe("Panel 3: RV Camper", () =>
	{
		test("should display RV Camper card with correct title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(2);
			await expect(card.locator("mat-card-title")).toHaveText(
				"RV Camper"
			);
		});

		test("should display RV Camper description", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(2);
			await expect(card.locator("mat-card-content p")).toHaveText(
				"Design and planning workspace for RV modifications"
			);
		});

		test("should display rv_hookup icon for RV Camper", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(2);
			await expect(card.locator(".feature-icon")).toContainText(
				"rv_hookup"
			);
		});

		test("should navigate to /rv-camper when RV Camper card is clicked", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const card: Locator = page.locator(".feature-card").nth(2);
			await card.click();
			await expect(page).toHaveURL(/\/rv-camper/);
		});
	});

	test.describe("Card Actions", () =>
	{
		test("should display Open button with arrow icon on each card", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const cards: Locator = page.locator(".feature-card");
			const cardCount: number = await cards.count();

			for (let i: number = 0; i < cardCount; i++)
			{
				const card = cards.nth(i);
				await expect(
					card.locator("mat-card-actions button")
				).toContainText("Open");
				await expect(
					card.locator("mat-card-actions mat-icon")
				).toContainText("arrow_forward");
			}
		});
	});
});
