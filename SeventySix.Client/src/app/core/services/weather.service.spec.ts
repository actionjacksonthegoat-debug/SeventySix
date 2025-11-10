import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { of } from "rxjs";
import { WeatherService } from "./weather.service";
import { WeatherForecastRepository } from "@core/repositories/weather-forecast.repository";
import { WeatherForecast } from "@core/models/interfaces/weather-forecast";

describe("WeatherService", () =>
{
	let service: WeatherService;
	let mockRepository: jasmine.SpyObj<WeatherForecastRepository>;

	const mockForecast: WeatherForecast = {
		date: "2024-01-01",
		temperatureC: 20,
		temperatureF: 68,
		summary: "Sunny"
	};

	beforeEach(() =>
	{
		mockRepository = jasmine.createSpyObj("WeatherForecastRepository", [
			"getAll",
			"getById",
			"create",
			"update",
			"delete"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				WeatherService,
				{
					provide: WeatherForecastRepository,
					useValue: mockRepository
				}
			]
		});

		service = TestBed.inject(WeatherService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAllForecasts", () =>
	{
		it("should return forecasts from repository", (done) =>
		{
			const forecasts = [mockForecast];
			mockRepository.getAll.and.returnValue(of(forecasts));

			service.getAllForecasts().subscribe((result) =>
			{
				expect(result).toEqual(forecasts);
				expect(mockRepository.getAll).toHaveBeenCalled();
				done();
			});
		});
	});

	describe("getForecastById", () =>
	{
		it("should return forecast by id", (done) =>
		{
			mockRepository.getById.and.returnValue(of(mockForecast));

			service.getForecastById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockRepository.getById).toHaveBeenCalledWith(1);
				done();
			});
		});
	});

	describe("createForecast", () =>
	{
		it("should create forecast", (done) =>
		{
			const newForecast = { date: "2024-01-02", temperatureC: 25 };
			mockRepository.create.and.returnValue(of(mockForecast));

			service.createForecast(newForecast).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockRepository.create).toHaveBeenCalledWith(newForecast);
				done();
			});
		});
	});

	describe("updateForecast", () =>
	{
		it("should update forecast", (done) =>
		{
			const updates = { temperatureC: 30 };
			mockRepository.update.and.returnValue(of(mockForecast));

			service.updateForecast(1, updates).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
				done();
			});
		});
	});

	describe("deleteForecast", () =>
	{
		it("should delete forecast", (done) =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			service.deleteForecast(1).subscribe(() =>
			{
				expect(mockRepository.delete).toHaveBeenCalledWith(1);
				done();
			});
		});
	});
});
