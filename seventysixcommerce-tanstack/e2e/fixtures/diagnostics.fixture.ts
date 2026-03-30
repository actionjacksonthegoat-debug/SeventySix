import { test as base } from "@playwright/test";

/** Extended test fixture with auto-failure diagnostics. */
export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		const consoleErrors: string[] = [];
		const networkErrors: string[] = [];

		page.on("console",
			(message) => {
				if (message.type() === "error") {
					consoleErrors.push(message.text());
				}
			});

		page.on("requestfailed",
			(request) => {
				networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
			});

		await use(page);

		if (testInfo.status !== testInfo.expectedStatus) {
			await testInfo.attach("failure-screenshot", {
				body: await page.screenshot({ fullPage: true }),
				contentType: "image/png"
			});
			await testInfo.attach("failure-url", {
				body: page.url(),
				contentType: "text/plain"
			});
			if (consoleErrors.length > 0) {
				await testInfo.attach("failure-console-errors", {
					body: consoleErrors.join("\n"),
					contentType: "text/plain"
				});
			}
			if (networkErrors.length > 0) {
				await testInfo.attach("failure-network-errors", {
					body: networkErrors.join("\n"),
					contentType: "text/plain"
				});
			}
		}
	}
});

export { expect } from "@playwright/test";
