import { ComponentFixture } from "@angular/core/testing";
import { ChartComponent } from "./chart.component";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ComponentTestBed } from "@testing";

describe("ChartComponent", () =>
{
	let component: ChartComponent;
	let fixture: ComponentFixture<ChartComponent>;
	let builder: ComponentTestBed<ChartComponent>;

	const defaultChartData = {
		labels: ["January", "February", "March"],
		datasets: [
			{
				data: [10, 20, 30],
				label: "Test Data"
			}
		]
	};

	beforeEach(async () =>
	{
		builder = new ComponentTestBed<ChartComponent>().withProvider(
			provideNoopAnimations()
		);
		fixture = await builder.build(ChartComponent);
		component = fixture.componentInstance;
		builder.withInputs(fixture, { chartData: defaultChartData });
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display chart title", () =>
	{
		builder.withInputs(fixture, { title: "Test Chart" });

		const compiled = fixture.nativeElement as HTMLElement;
		const title = compiled.querySelector("mat-card-title");
		expect(title?.textContent).toContain("Test Chart");
	});

	it("should emit refresh event when refresh button clicked", () =>
	{
		const refreshSpy: jasmine.Spy = builder.withOutputSpy(
			fixture,
			"refresh"
		);
		component.onRefresh();
		expect(refreshSpy).toHaveBeenCalled();
	});

	it("should emit exportPng event when export PNG clicked", () =>
	{
		const exportPngSpy: jasmine.Spy = builder.withOutputSpy(
			fixture,
			"exportPng"
		);
		component.onExportPng();
		expect(exportPngSpy).toHaveBeenCalled();
	});

	it("should emit exportCsv event when export CSV clicked", () =>
	{
		const exportCsvSpy: jasmine.Spy = builder.withOutputSpy(
			fixture,
			"exportCsv"
		);
		component.onExportCsv();
		expect(exportCsvSpy).toHaveBeenCalled();
	});

	it("should not throw error when chart instance is undefined during layout change", () =>
	{
		// Ensure chart signal returns undefined
		expect(() => component.onLayoutChanged()).not.toThrow();
	});
});
