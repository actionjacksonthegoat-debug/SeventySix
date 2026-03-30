import { test, expect, ROUTES } from "../fixtures";

test.describe("Health Check",
	() =>
	{
		test("should return healthy status",
			async ({ page }) =>
			{
				const response = await page.goto(ROUTES.healthz);
				expect(response?.status()).toBe(200);
			});
	});
