import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let analyticsModule: typeof import("../analytics");

/** Stub for document.createElement that captures script elements. */
function createDocumentStub(): { appendedScripts: HTMLScriptElement[]; }
{
	const appendedScripts: HTMLScriptElement[] = [];

	vi.stubGlobal("document",
		{
			createElement(tag: string): HTMLScriptElement
			{
				const element: Record<string, unknown> =
					{ tagName: tag, async: false, src: "" };

				return element as unknown as HTMLScriptElement;
			},
			head: {
				appendChild(script: HTMLScriptElement): void
				{
					appendedScripts.push(script);
				}
			},
			cookie: ""
		});

	return { appendedScripts };
}

describe("analytics",
	() =>
	{
		beforeEach(
			async () =>
			{
				vi.resetModules();
				vi.stubGlobal("window",
					{
						...globalThis.window,
						dataLayer: undefined,
						gtag: undefined
					});
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("initAnalytics",
			() =>
			{
				it("does nothing when measurement ID is empty",
					async () =>
					{
						const { appendedScripts }: { appendedScripts: HTMLScriptElement[]; } =
							createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("");

						expect(appendedScripts)
							.toHaveLength(0);
						expect(analyticsModule.isAnalyticsActive())
							.toBe(false);
					});

				it("does nothing when consent is not granted",
					async () =>
					{
						const { appendedScripts }: { appendedScripts: HTMLScriptElement[]; } =
							createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "pending" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST123");

						expect(appendedScripts)
							.toHaveLength(0);
						expect(analyticsModule.isAnalyticsActive())
							.toBe(false);
					});

				it("initializes GA4 when consent is granted",
					async () =>
					{
						const { appendedScripts }: { appendedScripts: HTMLScriptElement[]; } =
							createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST123");

						expect(appendedScripts)
							.toHaveLength(1);
						expect(appendedScripts[0].src)
							.toContain("G-TEST123");
						expect(analyticsModule.isAnalyticsActive())
							.toBe(true);
					});

				it("does not initialize twice",
					async () =>
					{
						const { appendedScripts }: { appendedScripts: HTMLScriptElement[]; } =
							createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST123");
						analyticsModule.initAnalytics("G-TEST123");

						expect(appendedScripts)
							.toHaveLength(1);
					});

				it("encodes measurement ID in script URL",
					async () =>
					{
						const { appendedScripts }: { appendedScripts: HTMLScriptElement[]; } =
							createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST 123");

						expect(appendedScripts[0].src)
							.toContain("G-TEST%20123");
					});
			});

		describe("trackPageView",
			() =>
			{
				it("sends page_view event when analytics is active",
					async () =>
					{
						createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST123");

						const gtagCalls: unknown[][] = [];
						window.gtag =
							(...args: unknown[]): void =>
							{
								gtagCalls.push(args);
							};

						analyticsModule.trackPageView("/shop", "Shop");

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][0])
							.toBe("event");
						expect(gtagCalls[0][1])
							.toBe("page_view");
					});

				it("does nothing when analytics is not active",
					async () =>
					{
						vi.doMock("../consent", () => ({ getConsentState: (): string => "denied" }));

						analyticsModule =
							await import("../analytics");

						const gtagSpy: ReturnType<typeof vi.fn> =
							vi.fn();

						vi.stubGlobal("window",
							{ gtag: gtagSpy });

						analyticsModule.trackPageView("/shop", "Shop");

						expect(gtagSpy)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("resetAnalytics",
			() =>
			{
				it("clears the initialized state",
					async () =>
					{
						createDocumentStub();

						vi.doMock("../consent", () => ({ getConsentState: (): string => "granted" }));

						analyticsModule =
							await import("../analytics");

						analyticsModule.initAnalytics("G-TEST123");

						expect(analyticsModule.isAnalyticsActive())
							.toBe(true);

						analyticsModule.resetAnalytics();

						expect(analyticsModule.isAnalyticsActive())
							.toBe(false);
					});
			});
	});