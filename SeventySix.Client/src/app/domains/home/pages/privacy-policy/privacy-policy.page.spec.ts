import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
	provideZonelessChangeDetection,
	signal,
	WritableSignal
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { FeatureFlagsService } from "@shared/services/feature-flags.service";
import { PrivacyPolicyPage } from "./privacy-policy.page";

describe("PrivacyPolicyPage",
	() =>
	{
		const mockEmail: WritableSignal<string> =
			signal("test@example.com");

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [PrivacyPolicyPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideRouter([]),
								{
									provide: FeatureFlagsService,
									useValue: { siteEmail: mockEmail.asReadonly() }
								}
							]
						})
					.compileComponents();
			});

		it("should create",
			() =>
			{
				const fixture: ComponentFixture<PrivacyPolicyPage> =
					TestBed.createComponent(PrivacyPolicyPage);
				fixture.detectChanges();
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render the site email from FeatureFlagsService",
			() =>
			{
				mockEmail.set("contact@mysite.com");
				const fixture: ComponentFixture<PrivacyPolicyPage> =
					TestBed.createComponent(PrivacyPolicyPage);
				fixture.detectChanges();

				const el: HTMLElement =
					fixture.nativeElement as HTMLElement;
				const anchors: NodeListOf<HTMLAnchorElement> =
					el.querySelectorAll("a[href^='mailto:']");

				expect(anchors.length)
					.toBeGreaterThanOrEqual(3);
				anchors.forEach(
					(anchor) =>
					{
						expect(anchor.getAttribute("href"))
							.toBe("mailto:contact@mysite.com");
						expect(anchor.textContent?.trim())
							.toBe("contact@mysite.com");
					});
			});

		it("should update rendered email when signal changes",
			async () =>
			{
				mockEmail.set("first@example.com");
				const fixture: ComponentFixture<PrivacyPolicyPage> =
					TestBed.createComponent(PrivacyPolicyPage);
				fixture.detectChanges();
				await fixture.whenStable();

				mockEmail.set("second@example.com");
				fixture.detectChanges();
				await fixture.whenStable();

				const el: HTMLElement =
					fixture.nativeElement as HTMLElement;
				const anchor: HTMLAnchorElement | null =
					el.querySelector("a[href^='mailto:']");

				expect(anchor?.getAttribute("href"))
					.toBe("mailto:second@example.com");
			});
	});