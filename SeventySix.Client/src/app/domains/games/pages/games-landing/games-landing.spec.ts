import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { GamesLandingComponent } from "./games-landing";

describe("GamesLandingComponent",
	() =>
	{
		let component: GamesLandingComponent;
		let fixture: ComponentFixture<GamesLandingComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [GamesLandingComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([])
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(GamesLandingComponent);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should display Games heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("h1");
				expect(heading?.textContent)
					.toContain("Games");
			});

		it("should display subtitle",
			() =>
			{
				const subtitle: HTMLElement | null =
					fixture.nativeElement.querySelector(".games-subtitle");
				expect(subtitle?.textContent)
					.toContain("Choose your adventure");
			});

		it("should render Car-a-Lot game card",
			() =>
			{
				const card: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='game-card-car-a-lot']");
				expect(card)
					.toBeTruthy();
				expect(card?.textContent)
					.toContain("Car-a-Lot");
			});

		it("should have routerLink to car-a-lot",
			() =>
			{
				const card: HTMLAnchorElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='game-card-car-a-lot']");
				expect(card?.getAttribute("href"))
					.toBe("/car-a-lot");
			});

		it("should render Spy And Fly game card",
			() =>
			{
				const card: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='game-card-spy-vs-spy']");
				expect(card)
					.toBeTruthy();
				expect(card?.textContent)
					.toContain("Spy And Fly");
			});

		it("should have routerLink to spy-vs-spy",
			() =>
			{
				const card: HTMLAnchorElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='game-card-spy-vs-spy']");
				expect(card?.getAttribute("href"))
					.toBe("/spy-vs-spy");
			});
	});