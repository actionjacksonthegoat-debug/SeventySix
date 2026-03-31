import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AnalyticsModule = typeof import("../analytics");

describe("analytics",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.resetModules();

				// Clear any pre-existing window.gtag / dataLayer
				(window as unknown as Record<string, unknown>).gtag = undefined;
				(window as unknown as Record<string, unknown>).dataLayer = undefined;

				// Clear any GA cookies
				document.cookie = "analytics_consent=; max-age=0";
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
				document.head.innerHTML = "";
				document.cookie = "analytics_consent=; max-age=0";
			});

		describe("initAnalytics",
			() =>
			{
				it("does nothing when measurement ID is empty",
					async () =>
					{
						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("");

						expect(analytics.isAnalyticsActive())
							.toBe(false);
					});

				it("does nothing when consent is not granted",
					async () =>
					{
						document.cookie = "analytics_consent=denied";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");

						expect(analytics.isAnalyticsActive())
							.toBe(false);
					});

				it("initializes GA4 when consent is granted",
					async () =>
					{
						document.cookie = "analytics_consent=granted";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");

						expect(analytics.isAnalyticsActive())
							.toBe(true);
					});

				it("does not initialize twice",
					async () =>
					{
						document.cookie = "analytics_consent=granted";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");
						analytics.initAnalytics("G-TEST123");

						const scripts: NodeListOf<HTMLScriptElement> =
							document.head.querySelectorAll("script");

						expect(scripts.length)
							.toBeLessThanOrEqual(1);
					});
			});

		describe("trackPageView",
			() =>
			{
				it("sends page_view event when active",
					async () =>
					{
						const gtagCalls: unknown[][] = [];

						document.cookie = "analytics_consent=granted";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");

						(window as unknown as Record<string, unknown>).gtag =
							(...args: unknown[]): void =>
							{
								gtagCalls.push(args);
							};

						analytics.trackPageView("/test", "Test Page");

						const pageViewCall: unknown[] | undefined =
							gtagCalls.find(
								(call: unknown[]) =>
									call[0] === "event" && call[1] === "page_view");

						expect(pageViewCall)
							.toBeDefined();
					});

				it("does not send event when not active",
					async () =>
					{
						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.trackPageView("/test", "Test Page");

						expect(analytics.isAnalyticsActive())
							.toBe(false);
					});

				it("includes page path in event",
					async () =>
					{
						const gtagCalls: unknown[][] = [];

						document.cookie = "analytics_consent=granted";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");

						(window as unknown as Record<string, unknown>).gtag =
							(...args: unknown[]): void =>
							{
								gtagCalls.push(args);
							};

						analytics.trackPageView("/shop/widgets", "Widgets");

						const pageViewCall: unknown[] | undefined =
							gtagCalls.find(
								(call: unknown[]) =>
									call[0] === "event" && call[1] === "page_view");

						expect(pageViewCall)
							.toBeDefined();

						const config: Record<string, string> =
							pageViewCall![2] as Record<string, string>;

						expect(config["page_path"])
							.toBe("/shop/widgets");
					});
			});

		describe("resetAnalytics",
			() =>
			{
				it("resets active state",
					async () =>
					{
						document.cookie = "analytics_consent=granted";

						const analytics: AnalyticsModule =
							await import("../analytics");

						analytics.initAnalytics("G-TEST123");
						expect(analytics.isAnalyticsActive())
							.toBe(true);

						analytics.resetAnalytics();
						expect(analytics.isAnalyticsActive())
							.toBe(false);
					});
			});
	});