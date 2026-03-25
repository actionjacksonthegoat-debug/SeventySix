import { provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InputService } from "@games/shared/services/input.service";
import { vi } from "vitest";
import { SpyMobileControlsComponent } from "./spy-mobile-controls";

describe("SpyMobileControlsComponent",
	() =>
	{
		let fixture: ComponentFixture<SpyMobileControlsComponent>;
		let component: SpyMobileControlsComponent;
		let mockInputService: {
			setKey: ReturnType<typeof vi.fn>;
			isTouchDevice: boolean;
			isMobilePreview: ReturnType<typeof signal<boolean>>;
			toggleMobilePreview: ReturnType<typeof vi.fn>;
			keys: Record<string, boolean>;
			isKeyPressed: ReturnType<typeof vi.fn>;
		};

		beforeEach(
			async () =>
			{
				mockInputService =
					{
						setKey: vi.fn(),
						isKeyPressed: vi.fn(),
						isTouchDevice: true,
						isMobilePreview: signal(false),
						toggleMobilePreview: vi.fn(),
						keys: {}
					};

				await TestBed
					.configureTestingModule(
						{
							providers: [
								provideZonelessChangeDetection(),
								{ provide: InputService, useValue: mockInputService }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(SpyMobileControlsComponent);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should hide overlay on non-touch devices",
			() =>
			{
				// Arrange
				mockInputService.isTouchDevice = false;
				(mockInputService.isMobilePreview as WritableSignal<boolean>)
					.set(false);

				fixture =
					TestBed.createComponent(SpyMobileControlsComponent);
				fixture.detectChanges();

				// Act
				const overlay: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']");

				// Assert
				expect(overlay)
					.toBeNull();
			});

		it("should show overlay on touch devices",
			() =>
			{
				// Arrange
				fixture.detectChanges();

				// Act
				const overlay: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']");

				// Assert
				expect(overlay)
					.not
					.toBeNull();
			});

		it("should show overlay when mobile preview is active on non-touch device",
			() =>
			{
				// Arrange
				mockInputService.isTouchDevice = false;
				(mockInputService.isMobilePreview as WritableSignal<boolean>)
					.set(true);

				fixture =
					TestBed.createComponent(SpyMobileControlsComponent);
				fixture.detectChanges();

				// Act
				const overlay: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']");

				// Assert
				expect(overlay)
					.not
					.toBeNull();
			});

		it("should set 'w' key on touch at top of screen",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — touch top-center (above center → w)
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 400,
										clientY: 100
									})
							]
						}));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"w",
						true);
			});

		it("should set 's' key on touch at bottom of screen",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — touch bottom-center
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 400,
										clientY: 700
									})
							]
						}));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"s",
						true);
			});

		it("should set 'a' key on touch at left of screen",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — touch left-center
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 50,
										clientY: 400
									})
							]
						}));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"a",
						true);
			});

		it("should set 'd' key on touch at right of screen",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — touch right-center
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 750,
										clientY: 400
									})
							]
						}));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"d",
						true);
			});

		it("should release all direction keys on touch end",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — first touch to set a key, then release
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 400,
										clientY: 100
									})
							]
						}));

				mockInputService.setKey.mockClear();

				overlay.dispatchEvent(
					new TouchEvent(
						"touchend",
						{
							bubbles: true,
							cancelable: true,
							changedTouches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 400,
										clientY: 100
									})
							]
						}));

				// Assert — all four direction keys released
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("w", false);
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("a", false);
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("s", false);
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("d", false);
			});

		it("should set two keys for diagonal touch (top-right → w + d)",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const overlay: HTMLElement =
					fixture.nativeElement.querySelector(
						"[data-testid='spy-mobile-controls']")!;

				// Act — touch top-right (angle ~315° / -45° → overlapping w + d zones)
				overlay.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{
							bubbles: true,
							cancelable: true,
							touches: [
								new Touch(
									{
										identifier: 0,
										target: overlay,
										clientX: 700,
										clientY: 100
									})
							]
						}));

				// Assert — both w and d should be set
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("w", true);
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith("d", true);
			});
	});