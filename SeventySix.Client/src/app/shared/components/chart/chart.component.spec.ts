import { ComponentFixture } from "@angular/core/testing";
import { ChartComponent } from "./chart.component";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ComponentTestBed } from "@testing";

describe("ChartComponent", () =>
{
	let component: ChartComponent;
	let fixture: ComponentFixture<ChartComponent>;

	beforeEach(async () =>
	{
		fixture = await new ComponentTestBed<ChartComponent>()
			.withProvider(provideNoopAnimations())
			.build(ChartComponent);

		component = fixture.componentInstance;
		fixture.componentRef.setInput("chartData", {
			labels: ["January", "February", "March"],
			datasets: [
				{
					data: [10, 20, 30],
					label: "Test Data"
				}
			]
		});
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display chart title", () =>
	{
		fixture.componentRef.setInput("title", "Test Chart");
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const title = compiled.querySelector("mat-card-title");
		expect(title?.textContent).toContain("Test Chart");
	});

	it("should emit refresh event when refresh button clicked", () =>
	{
		spyOn(component.refresh, "emit");
		component.onRefresh();
		expect(component.refresh.emit).toHaveBeenCalled();
	});

	it("should emit exportPng event when export PNG clicked", () =>
	{
		spyOn(component.exportPng, "emit");
		component.onExportPng();
		expect(component.exportPng.emit).toHaveBeenCalled();
	});

	it("should emit exportCsv event when export CSV clicked", () =>
	{
		spyOn(component.exportCsv, "emit");
		component.onExportCsv();
		expect(component.exportCsv.emit).toHaveBeenCalled();
	});

	it("should not throw error when chart instance is undefined during layout change", () =>
	{
		// Ensure chart signal returns undefined
		expect(() => component.onLayoutChanged()).not.toThrow();
	});
});
