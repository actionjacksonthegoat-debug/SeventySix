import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FullscreenToggleComponent } from "./fullscreen-toggle";

/**
 * Fullscreen toggle component unit tests.
 */
describe("FullscreenToggleComponent",
	() =>
	{
		let component: FullscreenToggleComponent;
		let fixture: ComponentFixture<FullscreenToggleComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [FullscreenToggleComponent]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(FullscreenToggleComponent);
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

		it("should render expand icon when not fullscreen",
			() =>
			{
				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				expect(button?.textContent?.trim())
					.toBe("⛶");
			});

		it("should have aria-expanded false when not fullscreen",
			() =>
			{
				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				expect(button?.getAttribute("aria-expanded"))
					.toBe("false");
			});

		it("should have accessible aria-label",
			() =>
			{
				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				expect(button?.getAttribute("aria-label"))
					.toBe("Toggle fullscreen");
			});

		it("should call requestFullscreen when clicking and not fullscreen",
			() =>
			{
				const mockRequestFullscreen: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockResolvedValue(undefined);
				Object.defineProperty(document.documentElement, "requestFullscreen",
					{
						value: mockRequestFullscreen,
						configurable: true,
						writable: true
					});

				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				button?.click();

				expect(mockRequestFullscreen)
					.toHaveBeenCalled();
			});

		it("should call exitFullscreen when clicking and is fullscreen",
			() =>
			{
				Object.defineProperty(document, "fullscreenElement",
					{ value: document.documentElement, configurable: true });

				component.onFullscreenChange();
				fixture.detectChanges();

				const mockExitFullscreen: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockResolvedValue(undefined);
				Object.defineProperty(document, "exitFullscreen",
					{
						value: mockExitFullscreen,
						configurable: true,
						writable: true
					});

				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				button?.click();

				expect(mockExitFullscreen)
					.toHaveBeenCalled();

				Object.defineProperty(document, "fullscreenElement",
					{ value: null, configurable: true });
			});

		it("should render collapse icon when fullscreen",
			() =>
			{
				Object.defineProperty(document, "fullscreenElement",
					{ value: document.documentElement, configurable: true });

				component.onFullscreenChange();
				fixture.detectChanges();

				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				expect(button?.textContent?.trim())
					.toBe("⤡");

				Object.defineProperty(document, "fullscreenElement",
					{ value: null, configurable: true });
			});

		it("should have aria-expanded true when fullscreen",
			() =>
			{
				Object.defineProperty(document, "fullscreenElement",
					{ value: document.documentElement, configurable: true });

				component.onFullscreenChange();
				fixture.detectChanges();

				const button: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='fullscreen-toggle']");
				expect(button?.getAttribute("aria-expanded"))
					.toBe("true");

				Object.defineProperty(document, "fullscreenElement",
					{ value: null, configurable: true });
			});

		it("should emit fullscreenChange output on toggle",
			() =>
			{
				const emitted: boolean[] = [];
				component.fullscreenChange.subscribe(
					(value: boolean) => emitted.push(value));

				Object.defineProperty(document, "fullscreenElement",
					{ value: document.documentElement, configurable: true });
				component.onFullscreenChange();

				Object.defineProperty(document, "fullscreenElement",
					{ value: null, configurable: true });
				component.onFullscreenChange();

				expect(emitted)
					.toEqual(
						[true, false]);
			});

		it("should reflect initial fullscreen state from document",
			() =>
			{
				Object.defineProperty(document, "fullscreenElement",
					{ value: document.documentElement, configurable: true });

				const freshFixture: ComponentFixture<FullscreenToggleComponent> =
					TestBed.createComponent(
						FullscreenToggleComponent);
				const freshComponent: FullscreenToggleComponent =
					freshFixture.componentInstance;

				expect(freshComponent.isFullscreen())
					.toBe(true);

				Object.defineProperty(document, "fullscreenElement",
					{ value: null, configurable: true });
			});
	});