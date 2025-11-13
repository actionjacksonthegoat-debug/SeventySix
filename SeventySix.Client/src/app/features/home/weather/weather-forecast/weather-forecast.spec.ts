import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { WeatherForecastPage } from "./weather-forecast";
import { WeatherService } from "@features/home/weather/services/weather.service";

describe("WeatherForecastPage", () =>
{
	let component: WeatherForecastPage;
	let fixture: ComponentFixture<WeatherForecastPage>;
	let mockWeatherService: jasmine.SpyObj<WeatherService>;

	beforeEach(async () =>
	{
		mockWeatherService = jasmine.createSpyObj("WeatherService", [
			"getAllForecasts"
		]);
		mockWeatherService.getAllForecasts.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [WeatherForecastPage],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: WeatherService, useValue: mockWeatherService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherForecastPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
