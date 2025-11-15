import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerService } from "@core/services";
import { WeatherService } from "../../services";
import { WeatherDisplay } from "./weather-display";
import { createMockQueryResult } from "@core/testing";
import { WeatherForecast } from "@home/weather/models";

describe("WeatherDisplay", () =>
{
	let component: WeatherDisplay;
	let fixture: ComponentFixture<WeatherDisplay>;
	let weatherServiceSpy: jasmine.SpyObj<WeatherService>;
	let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

	const mockForecasts: WeatherForecast[] = [
		{
			date: "2025-11-10",
			temperatureC: 20,
			temperatureF: 68,
			summary: "Sunny"
		},
		{
			date: "2025-11-11",
			temperatureC: 15,
			temperatureF: 59,
			summary: "Cloudy"
		}
	];

	beforeEach(async () =>
	{
		// Create spy objects for services
		weatherServiceSpy = jasmine.createSpyObj("WeatherService", [
			"getAllForecasts"
		]);
		loggerServiceSpy = jasmine.createSpyObj("LoggerService", [
			"info",
			"error",
			"debug",
			"warning",
			"critical"
		]);

		// Default mock implementation - returns empty array to prevent errors
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult<WeatherForecast[]>([])
		);

		await TestBed.configureTestingModule({
			imports: [WeatherDisplay],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: WeatherService, useValue: weatherServiceSpy },
				{ provide: LoggerService, useValue: loggerServiceSpy }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
		expect(weatherServiceSpy.getAllForecasts).toHaveBeenCalled();
	});

	it("should display forecasts when data is loaded", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult(mockForecasts)
		);

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.forecasts().length).toBe(2);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
	});

	it("should handle load error", () =>
	{
		const errorResponse: Error = new Error("Server Error");
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult<WeatherForecast[]>(undefined, {
				isError: true,
				error: errorResponse
			})
		);

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.error()).toBe(
			"Failed to load weather forecasts. Please try again."
		);
		expect(component.isLoading()).toBe(false);
		expect(component.forecasts().length).toBe(0);
	});

	it("should compute hasForecasts correctly", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult<WeatherForecast[]>([])
		);
		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.hasForecasts()).toBe(false);

		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult(mockForecasts)
		);
		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.hasForecasts()).toBe(true);
	});

	it("should compute forecastCount correctly", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult(mockForecasts)
		);
		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.forecastCount()).toBe(2);
	});

	it("should show loading state", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(
			createMockQueryResult<WeatherForecast[]>(undefined, {
				isLoading: true
			})
		);

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		expect(component.isLoading()).toBe(true);
		expect(component.forecasts().length).toBe(0);
	});

	it("should retry loading forecasts", async () =>
	{
		const mockQueryResult: ReturnType<
			typeof createMockQueryResult<WeatherForecast[]>
		> = createMockQueryResult(mockForecasts);
		weatherServiceSpy.getAllForecasts.and.returnValue(mockQueryResult);

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;

		await component.retry();

		expect(mockQueryResult.refetch).toHaveBeenCalled();
	});

	it("should track forecasts by date", () =>
	{
		const forecast: WeatherForecast = {
			date: "2025-11-10",
			temperatureC: 20,
			temperatureF: 68,
			summary: "Sunny"
		};

		const result: string = component.trackByDate(0, forecast);

		expect(result).toBe(forecast.date.toString());
	});
});
