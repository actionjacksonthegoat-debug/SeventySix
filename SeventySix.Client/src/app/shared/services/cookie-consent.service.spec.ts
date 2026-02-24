import { NavigationEnd, Router } from "@angular/router";
import { DateService } from "@shared/services/date.service";
import { setupSimpleServiceTest } from "@shared/testing";
import { Subject } from "rxjs";
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

		function createMockRouter(initialUrl: string = "/"): {
			router: Partial<Router>;
			navigate: (url: string) => void;
		}
		{
			const events$: Subject<NavigationEnd> =
				new Subject<NavigationEnd>();
			let currentUrl: string = initialUrl;
			const router: Partial<Router> =
				{
					get url()
					{
						return currentUrl;
					},
					events: events$.asObservable() as Router["events"]
				};
			return {
				router,
				navigate: (url: string) =>
				{
					currentUrl = url;
					events$.next(new NavigationEnd(0, url, url));
				}
			};
		}

		function createService(mockRouter?: Partial<Router>): CookieConsentService
		{
			const routerToUse: Partial<Router> =
				mockRouter ?? createMockRouter().router;
			return setupSimpleServiceTest(CookieConsentService,
				[
					{ provide: DateService, useValue: mockDateService },
					{ provide: Router, useValue: routerToUse }
				]);
		}

		it("should show banner when no consent cookie exists (pending state)",
			() =>
			{
				// Arrange — no cookie set (cleared in beforeEach)
				const { router } =
					createMockRouter("/auth/login");
				const service: CookieConsentService =
					createService(router);

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
				const { router } =
					createMockRouter("/auth/login");
				const service: CookieConsentService =
					createService(router);

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
				const { router } =
					createMockRouter("/auth/login");
				const service: CookieConsentService =
					createService(router);

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

		describe("auth-route banner — shown only on /auth/* entry points",
			() =>
			{
				// ── Routes where banner IS shown (auth entry points) ───────────

				it("showBanner() is true on /auth/login when pending",
					() =>
					{
						const { router } =
							createMockRouter("/auth/login");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(true);
					});

				it("showBanner() is true on /auth/register when pending",
					() =>
					{
						const { router } =
							createMockRouter("/auth/register");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(true);
					});

				it("showBanner() is true on /auth/forgot-password when pending",
					() =>
					{
						const { router } =
							createMockRouter("/auth/forgot-password");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(true);
					});

				it("showBanner() is true on /auth/change-password when pending",
					() =>
					{
						const { router } =
							createMockRouter("/auth/change-password");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(true);
					});

				// ── Routes where banner is suppressed (not /auth/*) ────────────

				it("showBanner() is false on home route when pending",
					() =>
					{
						const { router } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						expect(service.status())
							.toBe("pending");
						expect(service.showBanner())
							.toBe(false);
					});

				it("showBanner() is false on /privacy-policy when pending",
					() =>
					{
						const { router } =
							createMockRouter("/privacy-policy");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(false);
					});

				it("showBanner() is false on /sandbox when pending",
					() =>
					{
						const { router } =
							createMockRouter("/sandbox");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(false);
					});

				// ── Boundary: prefix must be exact — /authX is not /auth/ ──────

				it("showBanner() is false on /authtoken (similar prefix, not /auth/) when pending",
					() =>
					{
						const { router } =
							createMockRouter("/authtoken");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(false);
					});

				// ── Reactivity ─────────────────────────────────────────────────

				it("showBanner() updates reactively when navigating from non-auth to auth route",
					() =>
					{
						const { router, navigate } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(false);

						navigate("/auth/login");

						expect(service.showBanner())
							.toBe(true);
					});

				it("showBanner() updates reactively when navigating back from auth to non-auth route",
					() =>
					{
						const { router, navigate } =
							createMockRouter("/auth/login");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(true);

						navigate("/");

						expect(service.showBanner())
							.toBe(false);
					});

				// ── Manual trigger (footer "Cookie Settings") ──────────────────

				it("reopenBanner() shows banner even on a non-auth route (manual trigger)",
					() =>
					{
						const { router } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						expect(service.showBanner())
							.toBe(false);

						service.reopenBanner();

						expect(service.showBanner())
							.toBe(true);
					});

				it("acceptAll() on manually-triggered banner clears manual flag",
					() =>
					{
						const { router } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						service.reopenBanner();
						expect(service.showBanner())
							.toBe(true);

						service.acceptAll();

						expect(service.showBanner())
							.toBe(false);
						expect(service.status())
							.toBe("accepted");
					});

				it("rejectNonEssential() on manually-triggered banner clears manual flag",
					() =>
					{
						const { router } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						service.reopenBanner();
						service.rejectNonEssential();

						expect(service.showBanner())
							.toBe(false);
					});
			});

		describe("clearConsentForNextUser",
			() =>
			{
				it("clears the consent cookie and resets status to pending",
					() =>
					{
						const { router } =
							createMockRouter("/auth/login");
						const service: CookieConsentService =
							createService(router);

						service.acceptAll();
						expect(service.status())
							.toBe("accepted");

						service.clearConsentForNextUser();

						expect(service.status())
							.toBe("pending");
						expect(service.preferences())
							.toBeNull();
					});

				it("does NOT set _manuallyShown — banner only appears on /auth/* routes",
					() =>
					{
						// Start on a non-auth route (home)
						const { router } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						service.acceptAll();
						service.clearConsentForNextUser();

						// Status is pending but route is not /auth/* — banner must NOT show
						expect(service.status())
							.toBe("pending");
						expect(service.showBanner())
							.toBe(false);
					});

				it("banner naturally reappears when the next user navigates to an /auth/* route",
					() =>
					{
						const { router, navigate } =
							createMockRouter("/");
						const service: CookieConsentService =
							createService(router);

						service.acceptAll();
						service.clearConsentForNextUser();

						// Still on public route — no banner
						expect(service.showBanner())
							.toBe(false);

						// Next user navigates to auth route
						navigate("/auth/login");

						// Banner now visible
						expect(service.showBanner())
							.toBe(true);
					});
			});
	});