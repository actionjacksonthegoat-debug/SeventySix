import { provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { InputService } from "@games/shared/services/input.service";
import { vi } from "vitest";
import { MobileControlsComponent } from "./mobile-controls";

describe("MobileControlsComponent",
	() =>
	{
		let fixture: ComponentFixture<MobileControlsComponent>;
		let component: MobileControlsComponent;
		let mockInputService: {
			setKey: ReturnType<typeof vi.fn>;
			isTouchDevice: boolean;
			isMobilePreview: ReturnType<typeof signal<boolean>>;
			toggleMobilePreview: ReturnType<typeof vi.fn>;
			keys: Record<string, boolean>;
			mouseLeft: boolean;
			isKeyPressed: ReturnType<typeof vi.fn>;
		};
		let currentState: WritableSignal<RaceState>;

		beforeEach(
			async () =>
			{
				currentState =
					signal(RaceState.Racing);

				mockInputService =
					{
						setKey: vi.fn(),
						isKeyPressed: vi.fn(),
						isTouchDevice: true,
						isMobilePreview: signal(false),
						toggleMobilePreview: vi.fn(),
						keys: {},
						mouseLeft: false
					};

				const mockRaceStateService: Partial<RaceStateService> =
					{
						currentState: currentState
					};

				await TestBed
					.configureTestingModule(
						{
							providers: [
								provideZonelessChangeDetection(),
								{ provide: InputService, useValue: mockInputService },
								{ provide: RaceStateService, useValue: mockRaceStateService }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(MobileControlsComponent);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should call setKey with ArrowLeft on steer-left touchstart",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const steerLeft: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='touch-steer-left']");

				// Act
				steerLeft?.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{ cancelable: true }));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"ArrowLeft",
						true);
			});

		it("should call setKey with ArrowLeft false on steer-left touchend",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const steerLeft: HTMLButtonElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='touch-steer-left']");

				// Act
				steerLeft?.dispatchEvent(
					new TouchEvent(
						"touchend",
						{ cancelable: true }));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"ArrowLeft",
						false);
			});

		it("should call setKey with ArrowUp on gas touchstart",
			() =>
			{
				// Arrange
				fixture.detectChanges();
				const gasButton: HTMLButtonElement | null =
					fixture.nativeElement.querySelector("[data-testid='touch-gas']");

				// Act
				gasButton?.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{ cancelable: true }));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						"ArrowUp",
						true);
			});

		it("should show jump button only during OctopusPhase",
			() =>
			{
				// Arrange — Racing state
				fixture.detectChanges();
				let jumpButton: HTMLButtonElement | null =
					fixture.nativeElement.querySelector("[data-testid='touch-jump']");

				// Assert — not visible during Racing
				expect(jumpButton)
					.toBeNull();

				// Act — switch to OctopusPhase
				currentState.set(RaceState.OctopusPhase);
				fixture.detectChanges();
				jumpButton =
					fixture.nativeElement.querySelector("[data-testid='touch-jump']");

				// Assert — visible during OctopusPhase
				expect(jumpButton)
					.toBeTruthy();
			});

		it("should call setKey with space on jump touchstart",
			() =>
			{
				// Arrange — set to OctopusPhase so jump button appears
				currentState.set(RaceState.OctopusPhase);
				fixture.detectChanges();
				const jumpButton: HTMLButtonElement | null =
					fixture.nativeElement.querySelector("[data-testid='touch-jump']");

				// Act
				jumpButton?.dispatchEvent(
					new TouchEvent(
						"touchstart",
						{ cancelable: true }));

				// Assert
				expect(mockInputService.setKey)
					.toHaveBeenCalledWith(
						" ",
						true);
			});

		describe("Mobile preview mode visibility",
			() =>
			{
				it("should show controls when isMobilePreview is active even on non-touch device",
					() =>
					{
						mockInputService.isTouchDevice = false;
						(mockInputService.isMobilePreview as WritableSignal<boolean>)
							.set(true);

						fixture =
							TestBed.createComponent(MobileControlsComponent);
						fixture.detectChanges();

						const overlay: HTMLElement | null =
							fixture.nativeElement.querySelector(
								"[data-testid='mobile-controls']");

						expect(overlay)
							.not
							.toBeNull();
					});

				it("should hide controls when preview mode is inactive and not a touch device",
					() =>
					{
						mockInputService.isTouchDevice = false;
						(mockInputService.isMobilePreview as WritableSignal<boolean>)
							.set(false);

						fixture =
							TestBed.createComponent(MobileControlsComponent);
						fixture.detectChanges();

						const overlay: HTMLElement | null =
							fixture.nativeElement.querySelector(
								"[data-testid='mobile-controls']");

						expect(overlay)
							.toBeNull();
					});
			});
	});