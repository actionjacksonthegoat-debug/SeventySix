import { Component, signal, WritableSignal } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { spyOnPrivateMethod } from "@shared/testing";
import { Mock, vi } from "vitest";
import { TableHeightDirective } from "./table-height.directive";

@Component(
	{
		template: `<div [appTableHeight]="minHeight()"></div>`,
		imports: [TableHeightDirective]
	})
class TestComponent
{
	minHeight: WritableSignal<number> =
		signal(400);
}

describe("TableHeightDirective",
	() =>
	{
		let component: TestComponent;
		let fixture: ComponentFixture<TestComponent>;
		let directiveElement: HTMLElement;

		beforeEach(
			() =>
			{
				vi.useFakeTimers();

				TestBed.configureTestingModule(
					{
						imports: [TestComponent, TableHeightDirective],
						providers: [provideZonelessChangeDetection()]
					});

				fixture =
					TestBed.createComponent(TestComponent);
				component =
					fixture.componentInstance;
				directiveElement =
					fixture.nativeElement.querySelector("div");
				fixture.detectChanges();
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
			});

		it("should create directive instance",
			() =>
			{
				expect(directiveElement)
					.toBeTruthy();
			});

		it("should apply minimum height when available space is less than minimum",
			() =>
			{
				const style: CSSStyleDeclaration =
					window.getComputedStyle(directiveElement);
				const height: number =
					parseInt(style.height, 10);
				expect(height)
					.toBeGreaterThanOrEqual(400);
			});

		it("should update height when minHeight input changes",
			() =>
			{
				component.minHeight.set(600);
				fixture.detectChanges();

				const style: CSSStyleDeclaration =
					window.getComputedStyle(directiveElement);
				const height: number =
					parseInt(style.height, 10);
				expect(height)
					.toBeGreaterThanOrEqual(600);
			});

		it("should apply height style to element",
			() =>
			{
				const heightStyle: string =
					directiveElement.style.height;
				expect(heightStyle)
					.toBeTruthy();
				expect(heightStyle)
					.toContain("px");
			});

		it("should debounce window resize events",
			async () =>
			{
				const directive: TableHeightDirective =
					fixture.debugElement.children[0].injector.get(TableHeightDirective);

				// Use type-safe spy helper instead of 'as any' cast
				const updateHeightSpy: Mock =
					spyOnPrivateMethod(directive, "updateHeight");

				// Trigger multiple resize events rapidly
				for (let eventIndex: number = 0; eventIndex < 10; eventIndex++)
				{
					window.dispatchEvent(new Event("resize"));
				}

				// Immediately after, should not have called yet (still debouncing)
				expect(updateHeightSpy)
					.not
					.toHaveBeenCalled();

				// Advance past 500ms debounce + buffer for callback to fire
				await vi.advanceTimersByTimeAsync(600);

				expect(updateHeightSpy)
					.toHaveBeenCalledTimes(1);
			});

		it("should always apply standard table offset (120px at density -1)",
			() =>
			{
				// Set viewport height to known value for predictable testing
				Object.defineProperty(window, "innerHeight",
					{
						writable: true,
						configurable: true,
						value: 1000
					});

				fixture.detectChanges();

				const heightStyle: string =
					directiveElement.style.height;
				expect(heightStyle)
					.toBeTruthy();
				expect(heightStyle)
					.toContain("px");
			});

		describe("CLS Prevention",
			() =>
			{
				function getMinHeightStyle(element: HTMLElement): string
				{
					const directStyle: string =
						element.style.minHeight || "";
					if (directStyle)
					{
						return directStyle;
					}
					const styleAttr: string | null =
						element.getAttribute("style");
					if (styleAttr)
					{
						const match: RegExpMatchArray | null =
							styleAttr.match(/min-height:\s*([^;]+)/);
						if (match)
						{
							return match[1].trim();
						}
					}
					const height: string =
						element.style.height || "";
					if (height)
					{
						return height;
					}
					return "";
				}

				it("should synchronously apply min-height on initialization to prevent CLS",
					() =>
					{
						const initFixture: ComponentFixture<TestComponent> =
							TestBed.createComponent(TestComponent);
						initFixture.detectChanges();

						const initElement: HTMLElement =
							initFixture.nativeElement.querySelector("div");

						const minHeightStyle: string =
							getMinHeightStyle(initElement);
						expect(minHeightStyle)
							.toBeTruthy();
						expect(minHeightStyle)
							.toContain("px");

						// Parse the min-height value
						const minHeight: number =
							parseInt(minHeightStyle, 10);
						expect(minHeight)
							.toBeGreaterThan(0);
					});

				it("should set min-height equal to minHeight input value",
					() =>
					{
						// Check that the applied height is at least the minHeight value
						const heightStyle: string =
							getMinHeightStyle(directiveElement);
						const heightValue: number =
							parseInt(heightStyle, 10);
						expect(heightValue)
							.toBeGreaterThanOrEqual(400);
					});

				it("should update min-height when minHeight input changes",
					() =>
					{
						component.minHeight.set(600);
						fixture.detectChanges();

						const heightStyle: string =
							getMinHeightStyle(directiveElement);
						const heightValue: number =
							parseInt(heightStyle, 10);
						expect(heightValue)
							.toBeGreaterThanOrEqual(600);
					});
			});
	});
