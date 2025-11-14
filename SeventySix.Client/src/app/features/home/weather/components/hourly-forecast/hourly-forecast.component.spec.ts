import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { HourlyForecast } from "@home/weather/models";
import { HourlyForecastComponent } from "./hourly-forecast.component";

describe("HourlyForecastComponent", () =>
{
	let component: HourlyForecastComponent;
	let fixture: ComponentFixture<HourlyForecastComponent>;

	const mockHourlyForecasts: HourlyForecast[] = [
		{
			dt: 1699750800, // Nov 11, 2025 14:00
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
			pop: 0.2,
			weather: [
				{
					id: 801,
					main: "Clouds",
					description: "few clouds",
					icon: "02d"
				}
			]
		},
		{
			dt: 1699754400, // Nov 11, 2025 15:00
			temp: 16.8,
			feels_like: 15.5,
			pressure: 1012,
			humidity: 62,
			dew_point: 8.5,
			clouds: 35,
			uvi: 2.0,
			visibility: 10000,
			wind_speed: 4.0,
			wind_deg: 190,
			pop: 0.15,
			weather: [
				{
					id: 800,
					main: "Clear",
					description: "clear sky",
					icon: "01d"
				}
			]
		},
		{
			dt: 1699758000, // Nov 11, 2025 16:00
			temp: 14.2,
			feels_like: 13.0,
			pressure: 1014,
			humidity: 70,
			dew_point: 9.5,
			clouds: 60,
			uvi: 1.5,
			visibility: 9000,
			wind_speed: 5.0,
			wind_deg: 200,
			pop: 0.45,
			weather: [
				{
					id: 500,
					main: "Rain",
					description: "light rain",
					icon: "10d"
				}
			]
		}
	];

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [HourlyForecastComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(HourlyForecastComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept hourly forecasts input", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		expect(component.hourlyForecasts()).toEqual(mockHourlyForecasts);
	});

	it("should display forecast items when data provided", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const forecastItems = compiled.querySelectorAll(".forecast-item");
		expect(forecastItems.length).toBe(3);
	});

	it("should display time for each forecast", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const timeElements = compiled.querySelectorAll(".forecast-time");
		expect(timeElements.length).toBe(3);
		// Check for HH:MM format instead of specific time (timezone dependent)
		expect(timeElements[0].textContent?.trim()).toMatch(/^\d{2}:\d{2}$/);
	});

	it("should display temperature for each forecast", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const tempElements = compiled.querySelectorAll(".forecast-temp");
		expect(tempElements.length).toBe(3);
		expect(tempElements[0].textContent).toContain("15.5");
	});

	it("should display weather icon for each forecast", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const iconElements = compiled.querySelectorAll(".forecast-icon");
		expect(iconElements.length).toBe(3);
	});

	it("should display precipitation probability when present", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const popElements = compiled.querySelectorAll(".forecast-pop");
		expect(popElements.length).toBeGreaterThan(0);
		expect(popElements[0].textContent).toContain("20%");
	});

	it("should format time correctly", () =>
	{
		const forecast = mockHourlyForecasts[0];
		const formattedTime = component.formatTime(forecast.dt);
		expect(formattedTime).toMatch(/^\d{2}:\d{2}$/); // HH:MM format
	});

	it("should format precipitation probability correctly", () =>
	{
		const forecast = mockHourlyForecasts[0];
		const formattedPop = component.formatPrecipitation(forecast.pop);
		expect(formattedPop).toBe("20%");
	});

	it("should get weather icon URL correctly", () =>
	{
		const forecast = mockHourlyForecasts[0];
		const iconUrl = component.getWeatherIconUrl(forecast);
		expect(iconUrl).toContain("02d@2x.png");
	});

	it("should show empty state when no forecasts provided", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", []);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const emptyState = compiled.querySelector(".empty-state");
		expect(emptyState).toBeTruthy();
	});

	it("should handle undefined forecasts gracefully", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", undefined);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const forecastItems = compiled.querySelectorAll(".forecast-item");
		expect(forecastItems.length).toBe(0);
	});

	it("should have horizontal scroll container", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const scrollContainer = compiled.querySelector(".forecast-scroll");
		expect(scrollContainer).toBeTruthy();
	});

	it("should show precipitation icon when pop > 0", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const popIcons = compiled.querySelectorAll(".forecast-pop mat-icon");
		expect(popIcons.length).toBeGreaterThan(0);
	});

	it("should format temperature with one decimal", () =>
	{
		fixture.componentRef.setInput("hourlyForecasts", mockHourlyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const tempElement = compiled.querySelector(".forecast-temp");
		expect(tempElement?.textContent).toMatch(/\d+\.\d°/);
	});
});
