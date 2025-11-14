import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { WeatherService } from "./weather.service";
import { WeatherForecastRepository } from "@home/weather/repositories";
import { WeatherForecast } from "@home/weather/models";

describe("WeatherService", () =>
{
	let service: WeatherService;
	let mockRepository: jasmine.SpyObj<WeatherForecastRepository>;
	let queryClient: QueryClient;

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

		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideAngularQuery(queryClient),
				WeatherService,
				{
					provide: WeatherForecastRepository,
					useValue: mockRepository
				}
			]
		});

		service = TestBed.inject(WeatherService);
	});

	afterEach(() =>
	{
		queryClient.clear();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAllForecasts", () =>
	{
		it("should create query with correct configuration", () =>
		{
			const forecasts = [mockForecast];
			mockRepository.getAll.and.returnValue(of(forecasts));

			const query = service.getAllForecasts();

			expect(query.queryKey()).toEqual(["weather", "forecasts"]);
		});

		it("should fetch forecasts from repository", async () =>
		{
			const forecasts = [mockForecast];
			mockRepository.getAll.and.returnValue(of(forecasts));

			const query = service.getAllForecasts();
			await query.refetch();

			expect(mockRepository.getAll).toHaveBeenCalled();
			expect(query.data()).toEqual(forecasts);
		});
	});

	describe("getForecastById", () =>
	{
		it("should create query with correct key", () =>
		{
			mockRepository.getById.and.returnValue(of(mockForecast));

			const query = service.getForecastById(1);

			expect(query.queryKey()).toEqual(["weather", "forecast", 1]);
		});

		it("should fetch forecast by id from repository", async () =>
		{
			mockRepository.getById.and.returnValue(of(mockForecast));

			const query = service.getForecastById(1);
			await query.refetch();

			expect(mockRepository.getById).toHaveBeenCalledWith(1);
			expect(query.data()).toEqual(mockForecast);
		});
	});

	describe("createForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.createForecast();

			expect(mutation).toBeTruthy();
		});

		it("should create forecast via mutation", async () =>
		{
			const newForecast = { date: "2024-01-02", temperatureC: 25 };
			mockRepository.create.and.returnValue(of(mockForecast));

			const mutation = service.createForecast();
			await mutation.mutateAsync(newForecast);

			expect(mockRepository.create).toHaveBeenCalledWith(newForecast);
		});

		it("should invalidate forecasts query on success", async () =>
		{
			const newForecast = { date: "2024-01-02", temperatureC: 25 };
			mockRepository.create.and.returnValue(of(mockForecast));
			mockRepository.getAll.and.returnValue(of([mockForecast]));

			const query = service.getAllForecasts();
			const mutation = service.createForecast();

			await mutation.mutateAsync(newForecast);

			expect(
				queryClient.isFetching({ queryKey: ["weather", "forecasts"] })
			).toBeGreaterThan(0);
		});
	});

	describe("updateForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.updateForecast();

			expect(mutation).toBeTruthy();
		});

		it("should update forecast via mutation", async () =>
		{
			const updates = { temperatureC: 30 };
			mockRepository.update.and.returnValue(of(mockForecast));

			const mutation = service.updateForecast();
			await mutation.mutateAsync({ id: 1, forecast: updates });

			expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
		});

		it("should invalidate queries on success", async () =>
		{
			const updates = { temperatureC: 30 };
			mockRepository.update.and.returnValue(of(mockForecast));

			const mutation = service.updateForecast();
			await mutation.mutateAsync({ id: 1, forecast: updates });

			expect(
				queryClient.isFetching({ queryKey: ["weather", "forecast", 1] })
			).toBeGreaterThan(0);
			expect(
				queryClient.isFetching({ queryKey: ["weather", "forecasts"] })
			).toBeGreaterThan(0);
		});
	});

	describe("deleteForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.deleteForecast();

			expect(mutation).toBeTruthy();
		});

		it("should delete forecast via mutation", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation = service.deleteForecast();
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should invalidate forecasts query on success", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation = service.deleteForecast();
			await mutation.mutateAsync(1);

			expect(
				queryClient.isFetching({ queryKey: ["weather", "forecasts"] })
			).toBeGreaterThan(0);
		});
	});
});
