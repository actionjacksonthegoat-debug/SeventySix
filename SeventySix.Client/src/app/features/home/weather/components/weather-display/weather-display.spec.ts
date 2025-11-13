import { provideHttpClient, withFetch } from "@angular/common/http";
import {
	provideHttpClientTesting,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { WeatherDisplay } from "./weather-display";
import { environment } from "@environments/environment";
import { WeatherService } from "@features/home/weather/services/weather.service";
import { LoggerService } from "@core/services/logger.service";

describe("WeatherDisplay", () =>
{
	let component: WeatherDisplay;
	let fixture: ComponentFixture<WeatherDisplay>;
	let weatherServiceSpy: jasmine.SpyObj<WeatherService>;
	let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

	const mockForecasts = [
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
		weatherServiceSpy.getAllForecasts.and.returnValue(of([]));

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

	it("should load forecasts on init", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(of(mockForecasts));

		component.loadForecasts();

		expect(component.forecasts().length).toBe(2);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
		expect(loggerServiceSpy.info).toHaveBeenCalledWith(
			"Weather forecasts loaded successfully",
			{ count: 2 }
		);
	});

	it("should handle load error", () =>
	{
		const errorResponse = new Error("Server Error");
		weatherServiceSpy.getAllForecasts.and.returnValue(
			throwError(() => errorResponse)
		);

		component.loadForecasts();

		expect(component.error()).toBe(
			"Failed to load weather forecasts. Please try again."
		);
		expect(component.isLoading()).toBe(false);
		expect(component.forecasts().length).toBe(0);
		expect(loggerServiceSpy.error).toHaveBeenCalledWith(
			"Failed to load weather forecasts",
			errorResponse
		);
	});

	it("should compute hasForecasts correctly", () =>
	{
		expect(component.hasForecasts()).toBe(false);

		weatherServiceSpy.getAllForecasts.and.returnValue(of(mockForecasts));
		component.loadForecasts();

		expect(component.hasForecasts()).toBe(true);
	});

	it("should compute forecastCount correctly", () =>
	{
		weatherServiceSpy.getAllForecasts.and.returnValue(of(mockForecasts));
		component.loadForecasts();

		expect(component.forecastCount()).toBe(2);
	});

	it("should retry loading forecasts", () =>
	{
		const errorResponse = new Error("Network error");
		weatherServiceSpy.getAllForecasts.and.returnValue(
			throwError(() => errorResponse)
		);

		component.loadForecasts();
		expect(component.error()).not.toBeNull();

		weatherServiceSpy.getAllForecasts.and.returnValue(of(mockForecasts));
		component.retry();

		expect(component.error()).toBeNull();
		expect(component.forecasts().length).toBe(2);
	});

	it("should track forecasts by date", () =>
	{
		const forecast = {
			date: "2025-11-10",
			temperatureC: 20,
			temperatureF: 68,
			summary: "Sunny"
		};

		const result = component.trackByDate(0, forecast);

		expect(result).toBe(forecast.date.toString());
	});
});
