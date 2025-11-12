import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { DailyForecast } from "../../models";
import { DailyForecastComponent } from "./daily-forecast.component";

describe("DailyForecastComponent", () =>
{
	let component: DailyForecastComponent;
	let fixture: ComponentFixture<DailyForecastComponent>;

	const mockDailyForecasts: DailyForecast[] = [
		{
			dt: 1699747200, // Nov 11, 2025
			sunrise: 1699707600,
			sunset: 1699743600,
			moonrise: 1699720800,
			moonset: 1699757400,
			moon_phase: 0.25,
			summary: "Expect a day of partly cloudy with clear spells",
			temp: {
				day: 15.5,
				min: 10.2,
				max: 18.3,
				night: 12.0,
				eve: 14.5,
				morn: 11.0
			},
			feels_like: {
				day: 14.2,
				night: 10.8,
				eve: 13.2,
				morn: 9.7
			},
			pressure: 1013,
			humidity: 65,
			dew_point: 9.0,
			wind_speed: 3.5,
			wind_deg: 180,
			wind_gust: 5.2,
			clouds: 40,
			uvi: 2.5,
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
			dt: 1699833600, // Nov 12, 2025
			sunrise: 1699794000,
			sunset: 1699830000,
			moonrise: 1699807200,
			moonset: 1699843800,
			moon_phase: 0.3,
			summary: "Clear sky throughout the day",
			temp: {
				day: 17.8,
				min: 12.5,
				max: 20.0,
				night: 13.5,
				eve: 16.0,
				morn: 13.0
			},
			feels_like: {
				day: 16.5,
				night: 12.0,
				eve: 14.7,
				morn: 11.5
			},
			pressure: 1015,
			humidity: 60,
			dew_point: 8.5,
			wind_speed: 4.0,
			wind_deg: 190,
			wind_gust: 6.0,
			clouds: 10,
			uvi: 3.0,
			pop: 0.1,
			weather: [
				{
					id: 800,
					main: "Clear",
					description: "clear sky",
					icon: "01d"
				}
			]
		}
	];

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [DailyForecastComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(DailyForecastComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept daily forecasts input", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		expect(component.dailyForecasts()).toEqual(mockDailyForecasts);
	});

	it("should display forecast cards when data provided", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const forecastCards = compiled.querySelectorAll(".forecast-card");
		expect(forecastCards.length).toBe(2);
	});

	it("should display day name for each forecast", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const dayNames = compiled.querySelectorAll(".forecast-day");
		expect(dayNames.length).toBe(2);
		// Check for valid day name format
		expect(dayNames[0].textContent?.trim()).toMatch(
			/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/
		);
	});

	it("should display high temperature for each forecast", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const highTemps = compiled.querySelectorAll(".forecast-high");
		expect(highTemps.length).toBe(2);
		expect(highTemps[0].textContent).toContain("18.3");
	});

	it("should display low temperature for each forecast", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const lowTemps = compiled.querySelectorAll(".forecast-low");
		expect(lowTemps.length).toBe(2);
		expect(lowTemps[0].textContent).toContain("10.2");
	});

	it("should display weather icon for each forecast", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const icons = compiled.querySelectorAll(".forecast-icon");
		expect(icons.length).toBe(2);
	});

	it("should display weather summary", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const summaries = compiled.querySelectorAll(".forecast-summary");
		expect(summaries.length).toBe(2);
		expect(summaries[0].textContent).toContain("partly cloudy");
	});

	it("should format day name correctly", () =>
	{
		const forecast = mockDailyForecasts[0];
		const dayName = component.formatDayName(forecast.dt);
		expect(dayName).toMatch(
			/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/
		);
	});

	it("should get weather icon URL correctly", () =>
	{
		const forecast = mockDailyForecasts[0];
		const iconUrl = component.getWeatherIconUrl(forecast);
		expect(iconUrl).toContain("02d@2x.png");
	});

	it("should show empty state when no forecasts provided", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", []);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const emptyState = compiled.querySelector(".empty-state");
		expect(emptyState).toBeTruthy();
	});

	it("should handle undefined forecasts gracefully", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", undefined);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const forecastCards = compiled.querySelectorAll(".forecast-card");
		expect(forecastCards.length).toBe(0);
	});

	it("should use grid layout for cards", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const grid = compiled.querySelector(".forecast-grid");
		expect(grid).toBeTruthy();
	});

	it("should display precipitation probability when > 0", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const popElements = compiled.querySelectorAll(".forecast-pop");
		expect(popElements.length).toBeGreaterThan(0);
	});

	it("should format temperature with one decimal", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const highTemp = compiled.querySelector(".forecast-high");
		expect(highTemp?.textContent).toMatch(/\d+\.\d°/);
	});

	it("should show weather condition description", () =>
	{
		fixture.componentRef.setInput("dailyForecasts", mockDailyForecasts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const conditions = compiled.querySelectorAll(".forecast-condition");
		expect(conditions.length).toBe(2);
		expect(conditions[0].textContent).toContain("Clouds");
	});
});
