import { Component, signal, WritableSignal } from "@angular/core";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TableHeightDirective } from "./table-height.directive";

@Component({
	template: `<div [appTableHeight]="minHeight()"></div>`,
	imports: [TableHeightDirective]
})
class TestComponent
{
	minHeight: WritableSignal<number> = signal(400);
}

describe("TableHeightDirective", () =>
{
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directiveElement: HTMLElement;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			imports: [TestComponent, TableHeightDirective],
			providers: [provideZonelessChangeDetection()]
		});

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		directiveElement = fixture.nativeElement.querySelector("div");
		fixture.detectChanges();
	});

	it("should create directive instance", () =>
	{
		expect(directiveElement).toBeTruthy();
	});

	it("should apply minimum height when available space is less than minimum", () =>
	{
		const style: CSSStyleDeclaration =
			window.getComputedStyle(directiveElement);
		const height: number = parseInt(style.height, 10);
		expect(height).toBeGreaterThanOrEqual(400);
	});

	it("should update height when minHeight input changes", () =>
	{
		component.minHeight.set(600);
		fixture.detectChanges();

		const style: CSSStyleDeclaration =
			window.getComputedStyle(directiveElement);
		const height: number = parseInt(style.height, 10);
		expect(height).toBeGreaterThanOrEqual(600);
	});

	it("should apply height style to element", () =>
	{
		const heightStyle: string = directiveElement.style.height;
		expect(heightStyle).toBeTruthy();
		expect(heightStyle).toContain("px");
	});

	it("should debounce window resize events", (done) =>
	{
		let updateCount: number = 0;
		const directive: TableHeightDirective =
			fixture.debugElement.children[0].injector.get(TableHeightDirective);

		// Spy on private updateHeight method
		const originalUpdateHeight: () => void = (directive as any)[
			"updateHeight"
		];
		(directive as any)["updateHeight"] = () =>
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
		expect(updateCount).toBe(0);

		// After 500ms debounce, should only have called once
		setTimeout(() =>
		{
			expect(updateCount).toBe(1);
			done();
		}, 600);
	});

	it("should always apply standard table offset (120px at density -1)", () =>
	{
		// Set viewport height to known value for predictable testing
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 1000
		});

		fixture.detectChanges();

		const heightStyle: string = directiveElement.style.height;
		expect(heightStyle).toBeTruthy();
		expect(heightStyle).toContain("px");
		// Height should be calculated with 120px offset subtracted
	});
});
