import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let consentModule: typeof import("../consent");

/** Creates a mock document with readable/writable cookie tracking. */
function createMockDocument(initialCookie: string = ""): { getCookieWrites: () => string[]; }
{
	const cookieWrites: string[] = [];
	let currentCookie: string = initialCookie;

	vi.stubGlobal("document",
		{
			get cookie(): string
			{
				return currentCookie;
			},
			set cookie(value: string)
			{
				cookieWrites.push(value);
				currentCookie = value;
			}
		});

	return { getCookieWrites: (): string[] => cookieWrites };
}

describe("consent",
	() =>
	{
		beforeEach(
			async () =>
			{
				vi.resetModules();
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("getConsentState",
			() =>
			{
				it("returns 'pending' when no cookie is set",
					async () =>
					{
						createMockDocument("");

						consentModule =
							await import("../consent");

						expect(consentModule.getConsentState())
							.toBe("pending");
					});

				it("returns 'granted' when cookie is set to granted",
					async () =>
					{
						createMockDocument("analytics_consent=granted");

						consentModule =
							await import("../consent");

						expect(consentModule.getConsentState())
							.toBe("granted");
					});

				it("returns 'denied' when cookie is set to denied",
					async () =>
					{
						createMockDocument("analytics_consent=denied");

						consentModule =
							await import("../consent");

						expect(consentModule.getConsentState())
							.toBe("denied");
					});

				it("returns 'pending' for invalid cookie value",
					async () =>
					{
						createMockDocument("analytics_consent=invalid");

						consentModule =
							await import("../consent");

						expect(consentModule.getConsentState())
							.toBe("pending");
					});

				it("finds consent cookie among multiple cookies",
					async () =>
					{
						createMockDocument("theme=dark; analytics_consent=granted; lang=en");

						consentModule =
							await import("../consent");

						expect(consentModule.getConsentState())
							.toBe("granted");
					});
			});

		describe("setConsentState",
			() =>
			{
				it("sets cookie with correct attributes",
					async () =>
					{
						const { getCookieWrites }: { getCookieWrites: () => string[]; } =
							createMockDocument("");

						consentModule =
							await import("../consent");

						consentModule.setConsentState("granted");

						const writes: string[] =
							getCookieWrites();

						expect(writes)
							.toHaveLength(1);
						expect(writes[0])
							.toContain("analytics_consent=granted");
						expect(writes[0])
							.toContain("path=/");
						expect(writes[0])
							.toContain(`max-age=${consentModule.CONSENT_COOKIE_MAX_AGE}`);
						expect(writes[0])
							.toContain("SameSite=Lax");
						expect(writes[0])
							.toContain("Secure");
					});
			});

		describe("revokeConsent",
			() =>
			{
				it("sets consent to denied and removes GA cookies",
					async () =>
					{
						const { getCookieWrites }: { getCookieWrites: () => string[]; } =
							createMockDocument(
								"_ga=GA1.1.123; _ga_ABC=GS1.1.456");

						consentModule =
							await import("../consent");

						consentModule.revokeConsent();

						const writes: string[] =
							getCookieWrites();

						const hasConsentDenied: boolean =
							writes.some(
								(write: string) =>
									write.includes("analytics_consent=denied"));

						expect(hasConsentDenied)
							.toBe(true);
					});
			});

		describe("CONSENT_COOKIE_MAX_AGE",
			() =>
			{
				it("equals one year in seconds",
					async () =>
					{
						consentModule =
							await import("../consent");

						const oneYearInSeconds: number =
							365 * 24 * 60 * 60;

						expect(consentModule.CONSENT_COOKIE_MAX_AGE)
							.toBe(oneYearInSeconds);
					});
			});
	});