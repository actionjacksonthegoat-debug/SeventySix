import { TestBed } from "@angular/core/testing";
import { DateService } from "@shared/services/date.service";
import { setupSimpleServiceTest } from "@shared/testing";
import { vi } from "vitest";
import { CookieConsentService } from "./cookie-consent.service";

const CONSENT_COOKIE_NAME: string = "seventysix_consent";

function buildConsentCookie(overrides: Record<string, unknown> = {}): string
{
	const prefs: Record<string, unknown> =
		{
			strictlyNecessary: true,
			functional: true,
			analytics: true,
			consentDate: "2026-01-01T00:00:00.000Z",
			version: "1.0",
			...overrides
		};
	return encodeURIComponent(JSON.stringify(prefs));
}

function setConsentCookie(value: string): void
{
	document.cookie =
		`${CONSENT_COOKIE_NAME}=${value}; path=/`;
}

function clearConsentCookie(): void
{
	document.cookie =
		`${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

describe("CookieConsentService",
	() =>
	{
		let mockDateService: Partial<DateService>;

		beforeEach(
			() =>
			{
				clearConsentCookie();
				const realDateService: DateService =
					new DateService();
				mockDateService =
					{
						now: vi
							.fn()
							.mockReturnValue("2026-02-22T00:00:00.000Z"),
						nowTimestamp: vi
							.fn()
							.mockReturnValue(1_745_270_400_000),
						fromMillis: vi
							.fn()
							.mockImplementation(
								(ms: number): Date =>
									realDateService.fromMillis(ms))
					};
			});

		afterEach(
			() =>
			{
				clearConsentCookie();
			});

		function createService(): CookieConsentService
		{
			return setupSimpleServiceTest(CookieConsentService,
				[
					{ provide: DateService, useValue: mockDateService }
				]);
		}

		it("should show banner when no consent cookie exists (pending state)",
			() =>
			{
				// Arrange — no cookie set (cleared in beforeEach)
				const service: CookieConsentService =
					createService();

				// Assert
				expect(service.showBanner())
					.toBe(true);
				expect(service.status())
					.toBe("pending");
				expect(service.preferences())
					.toBeNull();
			});

		it("acceptAll should set status to accepted and all prefs to true",
			() =>
			{
				const service: CookieConsentService =
					createService();

				// Act
				service.acceptAll();

				// Assert
				expect(service.status())
					.toBe("accepted");
				expect(service.preferences()?.functional)
					.toBe(true);
				expect(service.preferences()?.analytics)
					.toBe(true);
				expect(service.showBanner())
					.toBe(false);
			});

		it("rejectNonEssential should set status to rejected and non-essential prefs to false",
			() =>
			{
				const service: CookieConsentService =
					createService();

				// Act
				service.rejectNonEssential();

				// Assert
				expect(service.status())
					.toBe("rejected");
				expect(service.preferences()?.functional)
					.toBe(false);
				expect(service.preferences()?.analytics)
					.toBe(false);
				expect(service.showBanner())
					.toBe(false);
			});

		it("saveCustomPreferences(true, false) should set status to customized",
			() =>
			{
				const service: CookieConsentService =
					createService();

				// Act
				service.saveCustomPreferences(true, false);

				// Assert
				expect(service.status())
					.toBe("customized");
				expect(service.hasFunctional())
					.toBe(true);
				expect(service.hasAnalytics())
					.toBe(false);
			});

		it("reopenBanner should clear consent and set status back to pending",
			() =>
			{
				const service: CookieConsentService =
					createService();
				service.acceptAll();
				expect(service.status())
					.toBe("accepted");

				// Act
				service.reopenBanner();

				// Assert
				expect(service.status())
					.toBe("pending");
				expect(service.showBanner())
					.toBe(true);
				expect(service.preferences())
					.toBeNull();
			});

		it("version mismatch in cookie should return null and re-prompt",
			() =>
			{
				// Arrange — set a cookie with old version
				setConsentCookie(buildConsentCookie(
					{ version: "0.9" }));
				const service: CookieConsentService =
					createService();

				// Assert — stale version clears consent
				expect(service.showBanner())
					.toBe(true);
				expect(service.status())
					.toBe("pending");
			});

		it("strictlyNecessary is always true after any action",
			() =>
			{
				const service: CookieConsentService =
					createService();

				service.acceptAll();
				expect(service.preferences()?.strictlyNecessary)
					.toBe(true);

				service.rejectNonEssential();
				expect(service.preferences()?.strictlyNecessary)
					.toBe(true);

				service.saveCustomPreferences(false, false);
				expect(service.preferences()?.strictlyNecessary)
					.toBe(true);
			});

		it("malformed cookie value returns null without throwing",
			() =>
			{
				// Arrange — set a cookie with malformed JSON
				document.cookie =
					`${CONSENT_COOKIE_NAME}=NOT_VALID_JSON; path=/`;
				const service: CookieConsentService =
					createService();

				// Assert — no throw, falls back to pending
				expect(service.status())
					.toBe("pending");
				expect(service.showBanner())
					.toBe(true);
			});

		it("should load existing valid consent from cookie on init",
			() =>
			{
				// Arrange — pre-set a valid consent cookie
				setConsentCookie(buildConsentCookie(
					{ functional: false, analytics: false }));
				const service: CookieConsentService =
					createService();

				// Assert
				expect(service.status())
					.toBe("rejected");
				expect(service.showBanner())
					.toBe(false);
			});

		TestBed.resetTestingModule();
		vi.restoreAllMocks();
	});