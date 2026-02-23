import { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { CookieConsentService } from "@shared/services/cookie-consent.service";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { vi } from "vitest";
import { CookieConsentBannerComponent } from "./cookie-consent-banner.component";

function createMockConsentService(showBanner: boolean): Partial<CookieConsentService>
{
	return {
		showBanner: vi
			.fn()
			.mockReturnValue(showBanner) as unknown as CookieConsentService["showBanner"],
		acceptAll: vi.fn(),
		rejectNonEssential: vi.fn()
	};
}

describe("CookieConsentBannerComponent",
	() =>
	{
		let component: CookieConsentBannerComponent;
		let fixture: ComponentFixture<CookieConsentBannerComponent>;
		let mockConsentService: Partial<CookieConsentService>;

		async function buildComponent(showBanner: boolean): Promise<ComponentFixture<CookieConsentBannerComponent>>
		{
			mockConsentService =
				createMockConsentService(showBanner);

			return new ComponentTestBed<CookieConsentBannerComponent>()
				.withProvider(
					{ provide: CookieConsentService, useValue: mockConsentService })
				.withProvider(provideRouter([]))
				.build(CookieConsentBannerComponent);
		}

		it("banner is visible when showBanner() = true",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const banner: HTMLElement | null =
					fixture.nativeElement.querySelector(".cookie-banner");
				expect(banner)
					.not
					.toBeNull();
			});

		it("banner is not visible when showBanner() = false (already consented)",
			async () =>
			{
				fixture =
					await buildComponent(false);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const banner: HTMLElement | null =
					fixture.nativeElement.querySelector(".cookie-banner");
				expect(banner)
					.toBeNull();
			});

		it("clicking Accept All calls consentService.acceptAll()",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const acceptBtn: HTMLButtonElement =
					fixture.nativeElement.querySelector(".cookie-banner__btn--accept");
				acceptBtn.click();

				expect(mockConsentService.acceptAll)
					.toHaveBeenCalledTimes(1);
			});

		it("clicking Reject Non-Essential calls consentService.rejectNonEssential()",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const rejectBtn: HTMLButtonElement =
					fixture.nativeElement.querySelector(".cookie-banner__btn--reject");
				rejectBtn.click();

				expect(mockConsentService.rejectNonEssential)
					.toHaveBeenCalledTimes(1);
			});

		it("clicking Cookie Settings emits openPreferences event",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const openPreferencesSpy: ReturnType<typeof vi.fn> =
					vi.fn();
				component.openPreferences.subscribe(openPreferencesSpy);

				const settingsBtn: HTMLButtonElement =
					fixture.nativeElement.querySelector(".cookie-banner__btn--settings");
				settingsBtn.click();

				expect(openPreferencesSpy)
					.toHaveBeenCalledTimes(1);
			});

		it("cookie-banner div has role='region' and aria-label='Cookie consent' when visible",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const bannerDiv: HTMLElement | null =
					fixture.nativeElement.querySelector(".cookie-banner") as
			| HTMLElement
			| null;
				expect(bannerDiv)
					.not
					.toBeNull();
				expect(bannerDiv?.getAttribute("role"))
					.toBe("region");
				expect(bannerDiv?.getAttribute("aria-label"))
					.toBe("Cookie consent");
			});

		it("cookie-banner div has no aria-live attribute (avoids axe conflict with role=region)",
			async () =>
			{
				fixture =
					await buildComponent(true);
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const bannerDiv: HTMLElement | null =
					fixture.nativeElement.querySelector(".cookie-banner") as
			| HTMLElement
			| null;
				expect(bannerDiv)
					.not
					.toBeNull();
				// aria-live must not be present on a role="region" element (axe rule: aria-prohibited-attr)
				expect(bannerDiv?.hasAttribute("aria-live"))
					.toBe(false);
			});
	});