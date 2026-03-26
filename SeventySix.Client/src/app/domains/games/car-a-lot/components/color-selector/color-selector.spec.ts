/**
 * Color Selector component unit tests.
 * Tests color and character selection buttons, accessibility, and output emissions.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CharacterType, KartColor } from "@games/car-a-lot/models/car-a-lot.models";
import { ColorSelectorComponent } from "./color-selector";

describe("ColorSelectorComponent",
	() =>
	{
		let fixture: ComponentFixture<ColorSelectorComponent>;
		let component: ColorSelectorComponent;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [ColorSelectorComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ColorSelectorComponent);
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

		it("should render 3 color buttons",
			() =>
			{
				const buttons: NodeListOf<Element> =
					fixture.nativeElement.querySelectorAll(".color-btn");

				expect(buttons.length)
					.toBe(3);
			});

		it("should render 2 character buttons",
			() =>
			{
				const buttons: NodeListOf<Element> =
					fixture.nativeElement.querySelectorAll(".character-btn");

				expect(buttons.length)
					.toBe(2);
			});

		it("should have aria-label on color buttons",
			() =>
			{
				const pinkButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='color-btn-Pink']");

				expect(pinkButton?.getAttribute("aria-label"))
					.toBe("Select Pink kart");
			});

		it("should have aria-pressed on selected color",
			() =>
			{
				const pinkButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='color-btn-Pink']");

				expect(pinkButton?.getAttribute("aria-pressed"))
					.toBe("true");
			});

		it("should emit kartColorChange when color button clicked",
			() =>
			{
				const emitSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(component.kartColorChange, "emit");

				const redButton: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='color-btn-Red']");

				redButton?.click();

				expect(emitSpy)
					.toHaveBeenCalledWith(KartColor.Red);
			});

		it("should emit characterChange when character button clicked",
			() =>
			{
				const emitSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(component.characterChange, "emit");

				const princeButton: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='character-btn-Prince']");

				princeButton?.click();

				expect(emitSpy)
					.toHaveBeenCalledWith(CharacterType.Prince);
			});

		it("should have aria-label on character buttons",
			() =>
			{
				const princessButton: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='character-btn-Princess']");

				expect(princessButton?.getAttribute("aria-label"))
					.toBe("Switch to Princess");
			});
	});