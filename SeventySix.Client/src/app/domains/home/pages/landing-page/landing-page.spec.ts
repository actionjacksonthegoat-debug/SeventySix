import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { vi } from "vitest";
import { LandingPageComponent } from "./landing-page";

function setupMockBrowserApis(): void
{
	vi.stubGlobal(
		"IntersectionObserver",
		class MockIntersectionObserver
		{
			observe: ReturnType<typeof vi.fn> =
				vi.fn();
			unobserve: ReturnType<typeof vi.fn> =
				vi.fn();
			disconnect: ReturnType<typeof vi.fn> =
				vi.fn();
		});

	vi.stubGlobal(
		"matchMedia",
		vi.fn(
			() => ({ matches: true })));
}

describe("LandingPageComponent",
	() =>
	{
		let component: LandingPageComponent;
		let fixture: ComponentFixture<LandingPageComponent>;

		beforeEach(
			async () =>
			{
				setupMockBrowserApis();

				await TestBed
					.configureTestingModule(
						{
							imports: [LandingPageComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideAnimations(),
								provideHttpClient(),
								provideHttpClientTesting()
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(LandingPageComponent);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should display hero heading with SeventySix",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("h1");
				expect(heading?.textContent)
					.toContain("SeventySix");
			});

		it("should contain hero section",
			() =>
			{
				const heroSection: Element | null =
					fixture.nativeElement.querySelector("app-hero-section");
				expect(heroSection)
					.toBeTruthy();
			});

		it("should contain tech stack section",
			() =>
			{
				const techSection: Element | null =
					fixture.nativeElement.querySelector("app-tech-stack-section");
				expect(techSection)
					.toBeTruthy();
			});

		it("should contain stats section",
			() =>
			{
				const statsSection: Element | null =
					fixture.nativeElement.querySelector("app-stats-section");
				expect(statsSection)
					.toBeTruthy();
			});
	});