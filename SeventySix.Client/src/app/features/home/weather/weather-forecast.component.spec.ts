import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { WeatherForecastComponent } from "./weather-forecast.component";
import { WeatherService } from "@features/home/weather/services/weather.service";
import { createMockQueryResult } from "@core/testing";
import { WeatherForecast } from "@home/weather/models";

describe("WeatherForecastComponent", () =>
{
	let component: WeatherForecastComponent;
	let fixture: ComponentFixture<WeatherForecastComponent>;
	let mockWeatherService: jasmine.SpyObj<WeatherService>;

	beforeEach(async () =>
	{
		mockWeatherService = jasmine.createSpyObj("WeatherService", [
			"getAllForecasts"
		]);
		mockWeatherService.getAllForecasts.and.returnValue(
			createMockQueryResult<WeatherForecast[]>([])
		);

		await TestBed.configureTestingModule({
			imports: [WeatherForecastComponent],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: WeatherService, useValue: mockWeatherService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherForecastComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});
	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
