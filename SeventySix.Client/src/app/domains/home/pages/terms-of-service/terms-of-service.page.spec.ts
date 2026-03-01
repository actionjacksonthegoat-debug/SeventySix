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
import { TermsOfServicePage } from "./terms-of-service.page";

describe("TermsOfServicePage",
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
							imports: [TermsOfServicePage],
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
				const fixture: ComponentFixture<TermsOfServicePage> =
					TestBed.createComponent(TermsOfServicePage);
				fixture.detectChanges();
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render the site email from FeatureFlagsService",
			() =>
			{
				mockEmail.set("contact@mysite.com");
				const fixture: ComponentFixture<TermsOfServicePage> =
					TestBed.createComponent(TermsOfServicePage);
				fixture.detectChanges();

				const el: HTMLElement =
					fixture.nativeElement as HTMLElement;
				const anchors: NodeListOf<HTMLAnchorElement> =
					el.querySelectorAll("a[href^='mailto:']");

				// Two occurrences: section 8 (termination) + section 11 (contact)
				expect(anchors.length)
					.toBeGreaterThanOrEqual(2);
				anchors.forEach(
					(anchor) =>
					{
						expect(anchor.getAttribute("href"))
							.toBe("mailto:contact@mysite.com");
						expect(anchor.textContent?.trim())
							.toBe("contact@mysite.com");
					});
			});
	});