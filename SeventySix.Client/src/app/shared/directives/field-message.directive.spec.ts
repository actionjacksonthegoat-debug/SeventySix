import { Component, provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatTooltip } from "@angular/material/tooltip";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { vi } from "vitest";
import { FieldMessageDirective } from "./field-message.directive";

@Component(
	{
		template: `<span appFieldMessage>Short text</span>`,
		imports: [FieldMessageDirective]
	})
class TestHostComponent
{}

let resizeCallback: ResizeObserverCallback;
let mockResizeObserve: ReturnType<typeof vi.fn>;
let mockResizeDisconnect: ReturnType<typeof vi.fn>;

function setupMockResizeObserver(): void
{
	mockResizeObserve =
		vi.fn();
	mockResizeDisconnect =
		vi.fn();

	vi.stubGlobal(
		"ResizeObserver",
		class MockResizeObserver
		{
			constructor(callback: ResizeObserverCallback)
			{
				resizeCallback = callback;
			}

			observe: ReturnType<typeof vi.fn> = mockResizeObserve;
			disconnect: ReturnType<typeof vi.fn> =
				mockResizeDisconnect;
		});
}

describe("FieldMessageDirective",
	() =>
	{
		let fixture: ComponentFixture<TestHostComponent>;
		let hostElement: HTMLElement;
		let tooltip: MatTooltip;

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		async function createFixture(): Promise<void>
		{
			TestBed.configureTestingModule(
				{
					imports: [TestHostComponent, FieldMessageDirective],
					providers: [
						provideZonelessChangeDetection(),
						provideAnimations()
					]
				});

			fixture =
				TestBed.createComponent(TestHostComponent);
			fixture.detectChanges();
			TestBed.flushEffects();
			await Promise.resolve();
			hostElement =
				fixture.debugElement.query(By.directive(FieldMessageDirective)).nativeElement as HTMLElement;
			tooltip =
				fixture.debugElement.query(By.directive(FieldMessageDirective)).injector.get(MatTooltip);
		}

		it("should observe the host element on init",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				expect(mockResizeObserve)
					.toHaveBeenCalledWith(hostElement);
			});

		it("should set tooltip message from element text content",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				expect(tooltip.message)
					.toBe("Short text");
			});

		it("should enable touch gestures on the tooltip",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				expect(tooltip.touchGestures)
					.toBe("on");
			});

		it("should disable tooltip when text fits (scrollWidth <= clientWidth)",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				Object.defineProperty(
					hostElement,
					"scrollWidth",
					{ value: 80, configurable: true });
				Object.defineProperty(
					hostElement,
					"clientWidth",
					{ value: 100, configurable: true });

				resizeCallback(
					[] as unknown as ResizeObserverEntry[],
					{} as ResizeObserver);

				expect(tooltip.disabled)
					.toBe(true);
			});

		it("should enable tooltip when text overflows (scrollWidth > clientWidth)",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				Object.defineProperty(
					hostElement,
					"scrollWidth",
					{ value: 200, configurable: true });
				Object.defineProperty(
					hostElement,
					"clientWidth",
					{ value: 100, configurable: true });

				resizeCallback(
					[] as unknown as ResizeObserverEntry[],
					{} as ResizeObserver);

				expect(tooltip.disabled)
					.toBe(false);
			});

		it("should disconnect ResizeObserver on destroy",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				fixture.destroy();

				expect(mockResizeDisconnect)
					.toHaveBeenCalled();
			});

		it("should hide tooltip on mouseleave",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				const hideSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(tooltip, "hide");

				hostElement.dispatchEvent(new Event("mouseleave"));

				expect(hideSpy)
					.toHaveBeenCalledWith(0);
			});

		it("should hide tooltip on blur",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				const hideSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(tooltip, "hide");

				hostElement.dispatchEvent(new Event("blur"));

				expect(hideSpy)
					.toHaveBeenCalledWith(0);
			});

		it("should hide tooltip on touchend when tooltip is visible",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				vi
					.spyOn(tooltip, "_isTooltipVisible")
					.mockReturnValue(true);
				const hideSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(tooltip, "hide");

				hostElement.dispatchEvent(new Event("touchend"));

				expect(hideSpy)
					.toHaveBeenCalledWith(0);
			});

		it("should not hide tooltip on touchend when tooltip is not visible",
			async () =>
			{
				setupMockResizeObserver();
				await createFixture();

				vi
					.spyOn(tooltip, "_isTooltipVisible")
					.mockReturnValue(false);
				const hideSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(tooltip, "hide");

				hostElement.dispatchEvent(new Event("touchend"));

				expect(hideSpy)
					.not
					.toHaveBeenCalled();
			});
	});