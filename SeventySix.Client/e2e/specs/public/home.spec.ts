import {
	test,
	expect,
	ROUTES,
	PAGE_TEXT,
	createRouteRegex
} from "../../fixtures";

/**
 * E2E Tests for Home Page
 *
 * The home page displays 1 feature panel:
 * 1. Sandbox - Routes to /sandbox
 */
test.describe("Home Page",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display welcome heading",
					async ({ homePage }) =>
					{
						await expect(homePage.pageHeading)
							.toHaveText(PAGE_TEXT.headings.welcome);
					});

				test("should display subtitle",
					async ({ homePage }) =>
					{
						await expect(homePage.subtitle)
							.toHaveText(PAGE_TEXT.descriptions.selectFeature);
					});

				test("should display feature cards",
					async ({ homePage }) =>
					{
						// Wait for at least one card to be visible before counting
						await homePage.featureCards.first().waitFor({ state: "visible" });

						const cardCount: number =
							await homePage.getCardCount();

						expect(cardCount)
							.toBeGreaterThanOrEqual(1);
					});
			});

		test.describe("Panel 1: Sandbox",
			() =>
			{
				test("should display Sandbox card with correct title",
					async ({ homePage }) =>
					{
						await expect(homePage.getCardTitle(0))
							.toHaveText(PAGE_TEXT.homeCards.sandbox.title);
					});

				test("should display Sandbox description",
					async ({ homePage }) =>
					{
						await expect(homePage.getCardContent(0))
							.toHaveText(PAGE_TEXT.homeCards.sandbox.description);
					});

				test("should display science icon for Sandbox",
					async ({ homePage }) =>
					{
						await expect(homePage.getCardIcon(0))
							.toContainText(PAGE_TEXT.homeCards.sandbox.icon);
					});

				test("should navigate to /sandbox when Sandbox card is clicked",
					async ({ page, homePage }) =>
					{
						await homePage.clickCard(0);

						await expect(page)
							.toHaveURL(createRouteRegex(ROUTES.sandbox.root));
					});
			});

		test.describe("Card Actions",
			() =>
			{
				test("should display Open button with arrow icon on the card",
					async ({ homePage }) =>
					{
						await expect(homePage.getCardAction(0))
							.toContainText(PAGE_TEXT.actions.open);
						await expect(homePage.getCardActionIcon(0))
							.toContainText(PAGE_TEXT.icons.arrowForward);
					});
			});
	});
