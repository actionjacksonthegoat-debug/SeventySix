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

		it("should have 1 quick action",
			() =>
			{
				expect(component["quickActions"])
					.toBeDefined();
				expect(component["quickActions"].length)
					.toBe(1);
			});

		it("should have Sandbox action with primary theme",
			() =>
			{
				const sandboxAction: { title: string; themeClass: string; route: string; } | undefined =
					component["quickActions"].find(
						(action: { route: string; }) =>
							action.route === "/sandbox");
				expect(sandboxAction)
					.toBeDefined();
				expect(sandboxAction?.title)
					.toBe("Sandbox");
				expect(sandboxAction?.themeClass)
					.toBe("theme-primary");
			});

		it("should render the feature card",
			() =>
			{
				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement;
				const cards: NodeListOf<Element> =
					compiled.querySelectorAll(".feature-card");
				expect(cards.length)
					.toBe(1);
			});

		it("should apply primary theme class to card",
			() =>
			{
				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement;
				const primaryCard: Element | null =
					compiled.querySelector(".theme-primary");
				expect(primaryCard)
					.toBeTruthy();
			});
	});
