import { ComponentFixture, TestBed } from "@angular/core/testing";
import { withComponentDefaults } from "@testing/provider-helpers";
import { vi } from "vitest";
import { HomeComponent } from "./home.component";

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

describe("HomeComponent",
	() =>
	{
		let component: HomeComponent;
		let fixture: ComponentFixture<HomeComponent>;

		beforeEach(
			async () =>
			{
				setupMockBrowserApis();

				await TestBed
					.configureTestingModule(
						{
							imports: [HomeComponent],
							providers: [...withComponentDefaults()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(HomeComponent);
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

		it("should render landing page component",
			() =>
			{
				const landingPage: Element | null =
					fixture.nativeElement.querySelector("app-landing-page");

				expect(landingPage)
					.toBeTruthy();
			});

		it("should have full-width-page host class",
			() =>
			{
				const hostElement: HTMLElement =
					fixture.nativeElement;

				expect(hostElement.classList.contains("full-width-page"))
					.toBe(true);
			});
	});
