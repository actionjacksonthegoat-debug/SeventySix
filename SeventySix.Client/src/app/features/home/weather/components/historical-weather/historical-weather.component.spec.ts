import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { HistoricalWeatherComponent } from "./historical-weather.component";

describe("HistoricalWeatherComponent", () =>
{
	let component: HistoricalWeatherComponent;
	let fixture: ComponentFixture<HistoricalWeatherComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [HistoricalWeatherComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(HistoricalWeatherComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should start in collapsed state", () =>
	{
		expect(component.isExpanded()).toBe(false);
	});

	it("should toggle expanded state when toggleExpand called", () =>
	{
		component.toggleExpand();
		expect(component.isExpanded()).toBe(true);

		component.toggleExpand();
		expect(component.isExpanded()).toBe(false);
	});

	it("should show expansion icon when collapsed", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const icon = compiled.querySelector(".expand-icon");
		expect(icon?.textContent?.trim()).toBe("expand_more");
	});

	it("should show collapse icon when expanded", () =>
	{
		component.toggleExpand();
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const icon = compiled.querySelector(".expand-icon");
		expect(icon?.textContent?.trim()).toBe("expand_less");
	});

	it("should display panel header", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const header = compiled.querySelector(".panel-header");
		expect(header).toBeTruthy();
		expect(header?.textContent).toContain("Historical Weather");
	});

	it("should not show content when collapsed", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const content = compiled.querySelector(".panel-content");
		expect(content).toBeFalsy();
	});

	it("should show content when expanded", () =>
	{
		component.toggleExpand();
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const content = compiled.querySelector(".panel-content");
		expect(content).toBeTruthy();
	});

	it("should display info message in content", () =>
	{
		component.toggleExpand();
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const message = compiled.querySelector(".info-message");
		expect(message?.textContent).toContain("Historical weather data");
	});

	it("should apply transition class", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const panel = compiled.querySelector(".historical-panel");
		expect(panel?.classList.contains("smooth-transition")).toBe(true);
	});
});
