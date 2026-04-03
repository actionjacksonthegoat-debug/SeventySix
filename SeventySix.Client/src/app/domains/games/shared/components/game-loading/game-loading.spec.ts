import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GameLoadingComponent } from "./game-loading";

describe("GameLoadingComponent",
	() =>
	{
		let fixture: ComponentFixture<GameLoadingComponent>;
		let component: GameLoadingComponent;
		let element: HTMLElement;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [GameLoadingComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(GameLoadingComponent);

				fixture.componentRef.setInput("gameName", "Car-a-Lot");
				fixture.componentRef.setInput("gameIcon", "🏎️");

				component =
					fixture.componentInstance;
				fixture.detectChanges();
				element =
					fixture.nativeElement;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should render the provided gameName",
			() =>
			{
				const title: HTMLElement | null =
					element.querySelector(".game-loading-title");

				expect(title?.textContent?.trim())
					.toBe("Car-a-Lot");
			});

		it("should render the provided gameIcon",
			() =>
			{
				const icon: HTMLElement | null =
					element.querySelector(".game-loading-icon");

				expect(icon?.textContent?.trim())
					.toBe("🏎️");
			});

		it("should show a loading spinner",
			() =>
			{
				const spinner: HTMLElement | null =
					element.querySelector(".game-loading-spinner");

				expect(spinner)
					.not
					.toBeNull();
			});

		it("should have role=status for accessibility",
			() =>
			{
				const container: HTMLElement | null =
					element.querySelector("[role='status']");

				expect(container)
					.not
					.toBeNull();
			});

		it("should have aria-busy=true",
			() =>
			{
				const container: HTMLElement | null =
					element.querySelector("[aria-busy='true']");

				expect(container)
					.not
					.toBeNull();
			});

		it("should have aria-live=polite for screen reader announcements",
			() =>
			{
				const container: HTMLElement | null =
					element.querySelector("[aria-live='polite']");

				expect(container)
					.not
					.toBeNull();
			});

		it("should display loading text",
			() =>
			{
				const text: HTMLElement | null =
					element.querySelector(".game-loading-text");

				expect(text?.textContent?.trim())
					.toBe("Loading...");
			});
	});