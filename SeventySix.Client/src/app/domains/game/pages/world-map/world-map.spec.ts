import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WorldMap } from "./world-map";

describe("WorldMap",
	() =>
	{
		let component: WorldMap;
		let fixture: ComponentFixture<WorldMap>;

		beforeEach(
			async () =>
			{
				await TestBed
				.configureTestingModule(
					{
						imports: [WorldMap],
						providers: [provideZonelessChangeDetection()]
					})
				.compileComponents();

				fixture =
					TestBed.createComponent(WorldMap);
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

		it("should have title property",
			() =>
			{
				expect(component.title)
				.toBe("World Map");
			});

		it("should have description property",
			() =>
			{
				expect(component.description)
				.toContain("world map");
			});

		it("should render title in template",
			() =>
			{
				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement;
				const titleElement: HTMLElement | null =
					compiled.querySelector("mat-card-title");
				expect(titleElement?.textContent?.trim())
				.toBe("World Map");
			});

		it("should render description in template",
			() =>
			{
				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement;
				const descriptionElement: HTMLElement | null =
					compiled.querySelector("p");
				expect(descriptionElement?.textContent?.trim())
				.toContain("world map");
			});

		it("should apply primary color theme class",
			() =>
			{
				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement;
				const card: HTMLElement | null =
					compiled.querySelector(".world-map-card");
				expect(card)
				.toBeTruthy();
			});
	});
