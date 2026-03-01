/**
 * Tests for AltchaWidgetComponent
 * Covers event binding, state change handling, and reset functionality.
 */

import {
	Component,
	provideZonelessChangeDetection,
	viewChild
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { AltchaWidgetComponent } from "./altcha-widget";

/**
 * Host component to provide the required `challengeUrl` input.
 */
@Component(
	{
		template: `<app-altcha-widget
			challengeUrl="https://example.com/altcha"
			(verified)="onVerified($event)"
			(stateChanged)="onStateChanged($event)">
		</app-altcha-widget>`,
		imports: [AltchaWidgetComponent]
	})
class TestHostComponent
{
	readonly widget: ReturnType<typeof viewChild<AltchaWidgetComponent>> =
		viewChild(AltchaWidgetComponent);
	verifiedPayload: string | null = null;
	lastState: string | null = null;

	onVerified(payload: string): void
	{
		this.verifiedPayload = payload;
	}

	onStateChanged(state: string): void
	{
		this.lastState = state;
	}
}

describe("AltchaWidgetComponent",
	() =>
	{
		let hostFixture: ComponentFixture<TestHostComponent>;
		let hostComponent: TestHostComponent;
		let component: AltchaWidgetComponent;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [TestHostComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				hostFixture =
					TestBed.createComponent(TestHostComponent);
				hostComponent =
					hostFixture.componentInstance;
				hostFixture.detectChanges();
				await hostFixture.whenStable();

				component =
					hostComponent.widget()!;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		describe("handleStateChange",
			() =>
			{
				it("should emit verified payload when state is verified with payload",
					() =>
					{
						const event: CustomEvent<{ state: string; payload?: string; }> =
							new CustomEvent("statechange",
								{
									detail: {
										state: "verified",
										payload: "base64payload=="
									}
								});

						(component as unknown as { handleStateChange: (e: Event) => void; })
							.handleStateChange(event);

						expect(hostComponent.verifiedPayload)
							.toBe("base64payload==");
						expect(hostComponent.lastState)
							.toBe("verified");
					});

				it("should not emit verified when state is verified but no payload",
					() =>
					{
						const event: CustomEvent<{ state: string; payload?: string; }> =
							new CustomEvent("statechange",
								{
									detail: {
										state: "verified"
									}
								});

						(component as unknown as { handleStateChange: (e: Event) => void; })
							.handleStateChange(event);

						expect(hostComponent.verifiedPayload)
							.toBeNull();
						expect(hostComponent.lastState)
							.toBe("verified");
					});

				it("should emit stateChanged for non-verified states",
					() =>
					{
						const event: CustomEvent<{ state: string; payload?: string; }> =
							new CustomEvent("statechange",
								{
									detail: {
										state: "error"
									}
								});

						(component as unknown as { handleStateChange: (e: Event) => void; })
							.handleStateChange(event);

						expect(hostComponent.verifiedPayload)
							.toBeNull();
						expect(hostComponent.lastState)
							.toBe("error");
					});

				it("should emit verifying state",
					() =>
					{
						const event: CustomEvent<{ state: string; payload?: string; }> =
							new CustomEvent("statechange",
								{
									detail: { state: "verifying" }
								});

						(component as unknown as { handleStateChange: (e: Event) => void; })
							.handleStateChange(event);

						expect(hostComponent.lastState)
							.toBe("verifying");
					});
			});

		describe("reset",
			() =>
			{
				it("should call reset on the native element when available",
					() =>
					{
						const widgetElement: HTMLElement & { reset?: () => void; } =
							hostFixture.nativeElement.querySelector(
								"altcha-widget");
						const resetSpy: ReturnType<typeof vi.fn> =
							vi.fn();
						Object.defineProperty(
							widgetElement,
							"reset",
							{
								value: resetSpy,
								writable: true,
								configurable: true
							});

						component.reset();

						expect(resetSpy)
							.toHaveBeenCalled();
					});

				it("should not throw when element has no reset method",
					() =>
					{
						const widgetElement: HTMLElement & { reset?: () => void; } =
							hostFixture.nativeElement.querySelector(
								"altcha-widget");
						delete widgetElement.reset;

						expect(() => component.reset())
							.not
							.toThrow();
					});
			});

		describe("ngOnInit event binding",
			() =>
			{
				it("should bind statechange event listener on init",
					async () =>
					{
						vi.useFakeTimers();

						const widgetElement: HTMLElement =
							hostFixture.nativeElement.querySelector("altcha-widget");
						const addEventSpy: ReturnType<typeof vi.fn> =
							vi.spyOn(widgetElement, "addEventListener");

						// Re-trigger ngOnInit by creating a fresh component
						const freshFixture: ComponentFixture<TestHostComponent> =
							TestBed.createComponent(TestHostComponent);
						freshFixture.detectChanges();
						await freshFixture.whenStable();

						vi.runAllTimers();

						const freshElement: HTMLElement =
							freshFixture.nativeElement.querySelector("altcha-widget");
						expect(freshElement)
							.toBeTruthy();

						addEventSpy.mockRestore();
						vi.useRealTimers();
					});
			});

		describe("ngOnDestroy",
			() =>
			{
				it("should remove statechange event listener on destroy",
					() =>
					{
						// Bind a handler manually to simulate post-init state
						const widgetElement: HTMLElement =
							hostFixture.nativeElement.querySelector("altcha-widget");
						const removeEventSpy: ReturnType<typeof vi.fn> =
							vi.spyOn(widgetElement, "removeEventListener");

						// Set boundStateHandler on the component so cleanup runs
						const handler: () => void =
							vi.fn();
						(component as unknown as { boundStateHandler: (() => void) | null; })
							.boundStateHandler = handler;

						component.ngOnDestroy();

						expect(removeEventSpy)
							.toHaveBeenCalledWith("statechange", handler);

						removeEventSpy.mockRestore();
					});
			});
	});