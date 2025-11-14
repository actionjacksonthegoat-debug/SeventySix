import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { CurrentWeather } from "@home/weather/models";
import { WeatherHeroComponent } from "./weather-hero.component";

describe("WeatherHeroComponent", () =>
{
	let component: WeatherHeroComponent;
	let fixture: ComponentFixture<WeatherHeroComponent>;

	const mockCurrentWeather: CurrentWeather = {
		dt: 1699747200,
		sunrise: 1699707600,
		sunset: 1699743600,
		temp: 15.5,
		feels_like: 14.2,
		pressure: 1013,
		humidity: 65,
		dew_point: 9.0,
		clouds: 40,
		uvi: 2.5,
		visibility: 10000,
		wind_speed: 3.5,
		wind_deg: 180,
		weather: [
			{
				id: 801,
				main: "Clouds",
				description: "few clouds",
				icon: "02d"
			}
		]
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [WeatherHeroComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherHeroComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept current weather input", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		expect(component.currentWeather()).toEqual(mockCurrentWeather);
	});

	it("should accept location input", () =>
	{
		fixture.componentRef.setInput("location", "New York, NY");
		expect(component.location()).toBe("New York, NY");
	});

	it("should accept loading state input", () =>
	{
		fixture.componentRef.setInput("loading", true);
		expect(component.loading()).toBe(true);
	});

	it("should display temperature when weather data provided", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const tempElement = compiled.querySelector(".temperature");
		expect(tempElement?.textContent).toContain("15.5");
	});

	it("should display feels like temperature", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const feelsLikeElement = compiled.querySelector(".feels-like");
		expect(feelsLikeElement?.textContent).toContain("14.2");
	});

	it("should display weather condition", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const conditionElement = compiled.querySelector(".condition");
		expect(conditionElement?.textContent).toContain("few clouds");
	});

	it("should display location when provided", () =>
	{
		fixture.componentRef.setInput("location", "New York, NY");
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const locationElement = compiled.querySelector(".location");
		expect(locationElement?.textContent).toContain("New York, NY");
	});

	it("should emit refresh event when refresh button clicked", () =>
	{
		let refreshEmitted = false;
		component.refresh.subscribe(() => (refreshEmitted = true));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const refreshButton = compiled.querySelector(
			".refresh-button"
		) as HTMLButtonElement;
		refreshButton?.click();

		expect(refreshEmitted).toBe(true);
	});

	it("should show loading spinner when loading is true", () =>
	{
		fixture.componentRef.setInput("loading", true);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const spinner = compiled.querySelector(".loading-spinner");
		expect(spinner).toBeTruthy();
	});

	it("should hide weather data when loading is true", () =>
	{
		fixture.componentRef.setInput("loading", true);
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const weatherContent = compiled.querySelector(".weather-content");
		expect(weatherContent).toBeFalsy();
	});

	it("should compute primary weather condition", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		expect(component.primaryCondition()).toBe("Clouds");
	});

	it("should compute weather icon URL", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		const iconUrl = component.weatherIconUrl();
		expect(iconUrl).toContain("02d@2x.png");
	});

	it("should handle missing weather data gracefully", () =>
	{
		fixture.componentRef.setInput("currentWeather", undefined);
		fixture.detectChanges();

		expect(component.primaryCondition()).toBe("");
		expect(component.weatherIconUrl()).toBe("");
	});

	it("should format temperature with one decimal place", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const tempElement = compiled.querySelector(".temperature");
		expect(tempElement?.textContent).toMatch(/15\.5/);
	});
});
