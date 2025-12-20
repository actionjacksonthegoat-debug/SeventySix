import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { HomeComponent } from "./home.component";

describe("HomeComponent",
	() =>
	{
		let component: HomeComponent;
		let fixture: ComponentFixture<HomeComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [HomeComponent],
							providers: [provideZonelessChangeDetection(), provideRouter([])]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(HomeComponent);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				fixture.detectChanges();
				expect(component)
					.toBeTruthy();
			});

		describe("quick actions",
			() =>
			{
				it("should have two quick actions",
					() =>
					{
						expect(component["quickActions"])
							.toBeDefined();
						expect(component["quickActions"].length)
							.toBe(2);
					});

				it("should have Sandbox action with correct properties",
					() =>
					{
						const sandboxAction: {
							title: string;
							description: string;
							icon: string;
							route: string;
							themeClass: string;
						} | undefined =
							component["quickActions"].find(
								(action: { route: string; }) =>
									action.route === "/sandbox");

						expect(sandboxAction)
							.toBeDefined();
						expect(sandboxAction?.title)
							.toBe("Sandbox");
						expect(sandboxAction?.description)
							.toBe("Experimentation area for testing new features and ideas");
						expect(sandboxAction?.icon)
							.toBe("science");
						expect(sandboxAction?.route)
							.toBe("/sandbox");
						expect(sandboxAction?.themeClass)
							.toBe("theme-primary");
					});

				it("should have Architecture Guide action with correct properties",
					() =>
					{
						const architectureAction: {
							title: string;
							description: string;
							icon: string;
							route: string;
							themeClass: string;
						} | undefined =
							component["quickActions"].find(
								(action: { route: string; }) =>
									action.route === "/developer/architecture-guide");

						expect(architectureAction)
							.toBeDefined();
						expect(architectureAction?.title)
							.toBe("Architecture Guide");
						expect(architectureAction?.description)
							.toBe("Documentation for project architecture patterns and guidelines");
						expect(architectureAction?.icon)
							.toBe("architecture");
						expect(architectureAction?.route)
							.toBe("/developer/architecture-guide");
						expect(architectureAction?.themeClass)
							.toBe("theme-secondary");
					});
			});

		describe("template rendering",
			() =>
			{
				it("should render all quick action cards",
					() =>
					{
						fixture.detectChanges();
						const compiled: HTMLElement =
							fixture.nativeElement;
						const cards: NodeListOf<Element> =
							compiled.querySelectorAll(".feature-card");

						expect(cards.length)
							.toBe(2);
					});

				it("should apply theme classes correctly",
					() =>
					{
						fixture.detectChanges();
						const compiled: HTMLElement =
							fixture.nativeElement;
						const primaryCard: Element | null =
							compiled.querySelector(".theme-primary");
						const secondaryCard: Element | null =
							compiled.querySelector(".theme-secondary");

						expect(primaryCard)
							.toBeTruthy();
						expect(secondaryCard)
							.toBeTruthy();
					});

				it("should render RouterLinks for all actions",
					() =>
					{
						fixture.detectChanges();
						const compiled: HTMLElement =
							fixture.nativeElement;
						const links: NodeListOf<HTMLAnchorElement> =
							compiled.querySelectorAll("a.feature-card-link");

						expect(links.length)
							.toBe(2);
					});
			});
	});
