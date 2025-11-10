import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of } from "rxjs";
import { WeatherForecastRepository } from "./weather-forecast.repository";
import { ApiService } from "@core/api-services/api.service";
import { WeatherForecast } from "@core/models/interfaces/weather-forecast";

describe("WeatherForecastRepository", () =>
{
	let repository: WeatherForecastRepository;
	let mockApiService: jasmine.SpyObj<ApiService>;

	const mockForecast: WeatherForecast = {
		date: "2024-01-01",
		temperatureC: 20,
		temperatureF: 68,
		summary: "Sunny"
	};

	beforeEach(() =>
	{
		mockApiService = jasmine.createSpyObj("ApiService", [
			"get",
			"post",
			"put",
			"delete"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				WeatherForecastRepository,
				{ provide: ApiService, useValue: mockApiService }
			]
		});

		repository = TestBed.inject(WeatherForecastRepository);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	describe("getAll", () =>
	{
		it("should get all forecasts", (done) =>
		{
			const forecasts = [mockForecast];
			mockApiService.get.and.returnValue(of(forecasts));

			repository.getAll().subscribe((result) =>
			{
				expect(result).toEqual(forecasts);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"WeatherForecast"
				);
				done();
			});
		});
	});

	describe("getById", () =>
	{
		it("should get forecast by id", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockForecast));

			repository.getById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"WeatherForecast/1"
				);
				done();
			});
		});
	});

	describe("create", () =>
	{
		it("should create forecast", (done) =>
		{
			const newForecast = { date: "2024-01-02", temperatureC: 25 };
			mockApiService.post.and.returnValue(of(mockForecast));

			repository.create(newForecast).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockApiService.post).toHaveBeenCalledWith(
					"WeatherForecast",
					newForecast
				);
				done();
			});
		});
	});

	describe("update", () =>
	{
		it("should update forecast", (done) =>
		{
			const updates = { temperatureC: 30 };
			mockApiService.put.and.returnValue(of(mockForecast));

			repository.update(1, updates).subscribe((result) =>
			{
				expect(result).toEqual(mockForecast);
				expect(mockApiService.put).toHaveBeenCalledWith(
					"WeatherForecast/1",
					updates
				);
				done();
			});
		});
	});

	describe("delete", () =>
	{
		it("should delete forecast", (done) =>
		{
			mockApiService.delete.and.returnValue(of(undefined));

			repository.delete(1).subscribe(() =>
			{
				expect(mockApiService.delete).toHaveBeenCalledWith(
					"WeatherForecast/1"
				);
				done();
			});
		});
	});
});
