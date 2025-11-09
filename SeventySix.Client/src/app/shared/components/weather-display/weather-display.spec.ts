import { provideHttpClient, withFetch } from "@angular/common/http";
import {
	provideHttpClientTesting,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherDisplay } from "./weather-display";
import { environment } from "@environments/environment";

describe("WeatherDisplay", () =>
{
	let component: WeatherDisplay;
	let fixture: ComponentFixture<WeatherDisplay>;
	let httpMock: HttpTestingController;

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
		await TestBed.configureTestingModule({
			imports: [WeatherDisplay],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	it("should create", () =>
	{
		// Don't call detectChanges yet to avoid triggering ngOnInit
		expect(component).toBeTruthy();

		// Now flush the request that was made in constructor
		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);
		req.flush([]);
	});

	it("should load forecasts on init", () =>
	{
		fixture.detectChanges();

		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);
		expect(req.request.method).toBe("GET");

		req.flush(mockForecasts);

		expect(component.forecasts().length).toBe(2);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
	});

	it("should handle load error", () =>
	{
		fixture.detectChanges();

		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);
		req.error(new ProgressEvent("error"), {
			status: 500,
			statusText: "Server Error"
		});

		expect(component.error()).toBe(
			"Failed to load weather forecasts. Please try again."
		);
		expect(component.isLoading()).toBe(false);
		expect(component.forecasts().length).toBe(0);
	});

	it("should compute hasForecasts correctly", () =>
	{
		fixture.detectChanges();

		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);

		expect(component.hasForecasts()).toBe(false);

		req.flush(mockForecasts);

		expect(component.hasForecasts()).toBe(true);
	});

	it("should compute forecastCount correctly", () =>
	{
		fixture.detectChanges();

		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);
		req.flush(mockForecasts);

		expect(component.forecastCount()).toBe(2);
	});

	it("should retry loading forecasts", () =>
	{
		fixture.detectChanges();

		const req1 = httpMock.expectOne(
			`${environment.apiUrl}/WeatherForecast`
		);
		req1.error(new ProgressEvent("error"));

		expect(component.error()).not.toBeNull();

		component.retry();

		const req2 = httpMock.expectOne(
			`${environment.apiUrl}/WeatherForecast`
		);
		req2.flush(mockForecasts);

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

		// Flush the constructor request
		const req = httpMock.expectOne(`${environment.apiUrl}/WeatherForecast`);
		req.flush([]);
	});
});
