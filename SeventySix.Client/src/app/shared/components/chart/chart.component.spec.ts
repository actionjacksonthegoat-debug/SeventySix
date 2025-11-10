import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChartComponent } from "./chart.component";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideZonelessChangeDetection } from "@angular/core";

describe("ChartComponent", () =>
{
	let component: ChartComponent;
	let fixture: ComponentFixture<ChartComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [ChartComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations()
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ChartComponent);
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
});
