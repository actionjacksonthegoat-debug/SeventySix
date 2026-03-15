import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SandboxLandingComponent } from "./sandbox-landing";

describe("SandboxLandingComponent",
	() =>
	{
		let component: SandboxLandingComponent;
		let fixture: ComponentFixture<SandboxLandingComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [SandboxLandingComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([])
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(SandboxLandingComponent);
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

		it("should display sandbox heading",
			() =>
			{
				const heading: HTMLElement | null =
					fixture.nativeElement.querySelector("h1");
				expect(heading?.textContent)
					.toContain("Sandbox");
			});

		it("should render car-a-lot game card",
			() =>
			{
				const card: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='game-card-car-a-lot']");
				expect(card)
					.toBeTruthy();
				expect(card?.textContent)
					.toContain("Car-a-Lot");
			});
	});