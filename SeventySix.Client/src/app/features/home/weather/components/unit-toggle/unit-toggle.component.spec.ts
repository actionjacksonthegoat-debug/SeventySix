import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { WeatherPreferencesService } from "../../services/weather-preferences.service";
import { Units, TemperatureUnit, WindSpeedUnit } from "../../models";
import { UnitToggleComponent } from "./unit-toggle.component";

describe("UnitToggleComponent", () =>
{
	let component: UnitToggleComponent;
	let fixture: ComponentFixture<UnitToggleComponent>;
	let preferencesService: WeatherPreferencesService;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [UnitToggleComponent],
			providers: [
				provideZonelessChangeDetection(),
				WeatherPreferencesService
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UnitToggleComponent);
		component = fixture.componentInstance;
		preferencesService = TestBed.inject(WeatherPreferencesService);
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should get current units from preferences service", () =>
	{
		preferencesService.setUnits(Units.Imperial);
		expect(component.currentUnits()).toBe(Units.Imperial);
	});

	it("should get temperature unit from preferences service", () =>
	{
		preferencesService.setTemperatureUnit(TemperatureUnit.Fahrenheit);
		expect(component.temperatureUnit()).toBe(TemperatureUnit.Fahrenheit);
	});

	it("should get wind speed unit from preferences service", () =>
	{
		preferencesService.setWindSpeedUnit(WindSpeedUnit.MilesPerHour);
		expect(component.windSpeedUnit()).toBe(WindSpeedUnit.MilesPerHour);
	});

	it("should toggle from metric to imperial", () =>
	{
		preferencesService.setUnits(Units.Metric);
		component.toggleUnits();
		expect(component.currentUnits()).toBe(Units.Imperial);
	});

	it("should toggle from imperial to metric", () =>
	{
		preferencesService.setUnits(Units.Imperial);
		component.toggleUnits();
		expect(component.currentUnits()).toBe(Units.Metric);
	});

	it("should display metric temperature symbol when metric", () =>
	{
		preferencesService.setUnits(Units.Metric);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const metricTempUnit = compiled.querySelector(
			".unit-label.metric .temp-unit"
		);
		expect(metricTempUnit?.textContent).toContain("°C");
	});

	it("should display imperial temperature symbol when imperial", () =>
	{
		preferencesService.setUnits(Units.Imperial);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const imperialTempUnit = compiled.querySelector(
			".unit-label.imperial .temp-unit"
		);
		expect(imperialTempUnit?.textContent).toContain("°F");
	});

	it("should display metric wind speed unit when metric", () =>
	{
		preferencesService.setUnits(Units.Metric);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const metricWindUnit = compiled.querySelector(
			".unit-label.metric .wind-unit"
		);
		expect(metricWindUnit?.textContent).toContain("m/s");
	});

	it("should display imperial wind speed unit when imperial", () =>
	{
		preferencesService.setUnits(Units.Imperial);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const imperialWindUnit = compiled.querySelector(
			".unit-label.imperial .wind-unit"
		);
		expect(imperialWindUnit?.textContent).toContain("mph");
	});

	it("should call toggleUnits when toggle button clicked", () =>
	{
		spyOn(component, "toggleUnits");
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const toggleButton = compiled.querySelector(
			".toggle-button"
		) as HTMLButtonElement;
		toggleButton?.click();

		expect(component.toggleUnits).toHaveBeenCalled();
	});

	it("should persist preference change to localStorage", () =>
	{
		preferencesService.setUnits(Units.Metric);
		component.toggleUnits();

		const stored = localStorage.getItem("weatherPreferences");
		expect(stored).toBeTruthy();

		const parsed = JSON.parse(stored!);
		expect(parsed.preferredUnits).toBe("imperial"); // Use preferredUnits key
	});

	it("should have toggle switch element", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const toggle = compiled.querySelector(".unit-toggle");
		expect(toggle).toBeTruthy();
	});

	it("should display both unit options", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const labels = compiled.querySelectorAll(".unit-label");
		expect(labels.length).toBe(2);
	});

	it("should highlight active unit", () =>
	{
		preferencesService.setUnits(Units.Metric);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const metricLabel = compiled.querySelector(
			".unit-label.metric"
		) as HTMLElement;
		expect(metricLabel?.classList.contains("active")).toBe(true);
	});

	it("should not highlight inactive unit", () =>
	{
		preferencesService.setUnits(Units.Metric);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const imperialLabel = compiled.querySelector(
			".unit-label.imperial"
		) as HTMLElement;
		expect(imperialLabel?.classList.contains("active")).toBe(false);
	});

	it("should have accessible labels", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const toggleButton = compiled.querySelector(
			".toggle-button"
		) as HTMLButtonElement;
		expect(toggleButton?.getAttribute("aria-label")).toBeTruthy();
	});
});
