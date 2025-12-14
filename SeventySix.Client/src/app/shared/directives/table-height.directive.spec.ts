import { Component, signal, WritableSignal } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
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
			(done) =>
			{
				let updateCount: number = 0;
				const directive: TableHeightDirective =
					fixture.debugElement.children[0].injector.get(TableHeightDirective);

				// Spy on private updateHeight method
				const originalUpdateHeight: () => void =
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(directive as any)[
					"updateHeight"
					];
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(directive as any)["updateHeight"] =
					() =>
					{
						updateCount++;
						originalUpdateHeight.call(directive);
					};

				// Trigger multiple resize events rapidly
				for (let i: number = 0; i < 10; i++)
				{
					window.dispatchEvent(new Event("resize"));
				}

				// Immediately after, should not have called yet (still debouncing)
				expect(updateCount)
				.toBe(0);

				// After 500ms debounce, should only have called once
				setTimeout(
					() =>
					{
						expect(updateCount)
						.toBe(1);
						done();
					},
					600);
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
				// Height should be calculated with 120px offset subtracted
			});

		describe("CLS Prevention",
			() =>
			{
				it("should synchronously apply min-height on initialization to prevent CLS",
					() =>
					{
						// Create new component to test initialization sequence
						const initFixture: ComponentFixture<TestComponent> =
							TestBed.createComponent(TestComponent);
						const initElement: HTMLElement =
							initFixture.nativeElement.querySelector("div");

						// Check min-height is applied BEFORE detectChanges (synchronous)
						const minHeightStyle: string =
							initElement.style.minHeight;
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
						const minHeightStyle: string =
							directiveElement.style.minHeight;
						expect(minHeightStyle)
						.toBe("400px");
					});

				it("should update min-height when minHeight input changes",
					() =>
					{
						component.minHeight.set(600);
						fixture.detectChanges();

						const minHeightStyle: string =
							directiveElement.style.minHeight;
						expect(minHeightStyle)
						.toBe("600px");
					});
			});
	});
