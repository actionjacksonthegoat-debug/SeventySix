import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Physics } from "./physics";

describe("Physics",
	() =>
	{
		let component: Physics;
		let fixture: ComponentFixture<Physics>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [Physics],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(Physics);
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

		it("should have title property",
			() =>
			{
				expect(component.title)
					.toBe("Physics Calculations");
			});

		it("should have description property",
			() =>
			{
				expect(component.description)
					.toBe(
						"Electricity generation from buoyancy and future calculations");
			});

		it("should render title in template",
			async () =>
			{
				const compiled: HTMLElement =
					fixture.nativeElement;
				const title: HTMLElement | null =
					compiled.querySelector("h1");
				expect(title?.textContent)
					.toContain("Physics Calculations");
			});

		it("should render coming soon message",
			async () =>
			{
				const compiled: HTMLElement =
					fixture.nativeElement;
				const comingSoon: HTMLElement | null =
					compiled.querySelector(".coming-soon");
				expect(comingSoon?.textContent)
					.toContain("Coming Soon");
			});

		it("should have physics-theme class",
			async () =>
			{
				const compiled: HTMLElement =
					fixture.nativeElement;
				const card: HTMLElement | null =
					compiled.querySelector(".physics-theme");
				expect(card)
					.toBeTruthy();
			});
	});
