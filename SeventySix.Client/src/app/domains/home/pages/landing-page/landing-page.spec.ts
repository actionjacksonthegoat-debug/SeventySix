import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	ComponentFixture,
	DeferBlockFixture,
	DeferBlockState,
	TestBed
} from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TECH_STACK_CATEGORIES } from "@home/constants/landing-page.constants";
import { TechStackCategory, TechStackItem } from "@home/models";
import { LandingPageSeoService } from "@home/services";
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
								provideHttpClientTesting(),
								{
									provide: LandingPageSeoService,
									useValue: { setup: vi.fn() }
								}
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
			async () =>
			{
				const deferBlocks: DeferBlockFixture[] =
					await fixture.getDeferBlocks();
				await deferBlocks[0].render(DeferBlockState.Complete);
				fixture.detectChanges();

				const techSection: Element | null =
					fixture.nativeElement.querySelector("app-tech-stack-section");
				expect(techSection)
					.toBeTruthy();
			});

		it("should contain stats section",
			async () =>
			{
				const deferBlocks: DeferBlockFixture[] =
					await fixture.getDeferBlocks();
				await deferBlocks[1].render(DeferBlockState.Complete);
				fixture.detectChanges();

				const statsSection: Element | null =
					fixture.nativeElement.querySelector("app-stats-section");
				expect(statsSection)
					.toBeTruthy();
			});

		it("should include Have I Been Pwned in server tech stack",
			() =>
			{
				const serverCategory: TechStackCategory | undefined =
					TECH_STACK_CATEGORIES.find(
						(category) =>
							category.title === "Server");
				const hibpEntry: TechStackItem | undefined =
					serverCategory?.items.find(
						(item) =>
							item.name === "Have I Been Pwned");
				expect(hibpEntry)
					.toBeTruthy();
				expect(hibpEntry?.useMaterialIcon)
					.toBe(true);
				expect(hibpEntry?.materialIcon)
					.toBe("security");
			});
	});