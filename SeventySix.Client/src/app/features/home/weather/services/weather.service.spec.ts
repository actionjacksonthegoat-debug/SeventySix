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
		spyOn(queryClient, "invalidateQueries").and.callThrough();

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
		it("should create query", () =>
		{
			const forecasts: WeatherForecast[] = [mockForecast];
			mockRepository.getAll.and.returnValue(of(forecasts));

			const query: ReturnType<typeof service.getAllForecasts> =
				TestBed.runInInjectionContext(() => service.getAllForecasts());

			expect(query).toBeTruthy();
		});

		it("should fetch forecasts from repository", async () =>
		{
			const forecasts: WeatherForecast[] = [mockForecast];
			mockRepository.getAll.and.returnValue(of(forecasts));

			const query: ReturnType<typeof service.getAllForecasts> =
				TestBed.runInInjectionContext(() => service.getAllForecasts());
			const result = await query.refetch();

			expect(mockRepository.getAll).toHaveBeenCalled();
			expect(result.data).toEqual(forecasts);
		});
	});

	describe("getForecastById", () =>
	{
		it("should create query", () =>
		{
			mockRepository.getById.and.returnValue(of(mockForecast));

			const query: ReturnType<typeof service.getForecastById> =
				TestBed.runInInjectionContext(() => service.getForecastById(1));

			expect(query).toBeTruthy();
		});

		it("should fetch forecast by id from repository", async () =>
		{
			mockRepository.getById.and.returnValue(of(mockForecast));

			const query: ReturnType<typeof service.getForecastById> =
				TestBed.runInInjectionContext(() => service.getForecastById(1));
			const result = await query.refetch();

			expect(mockRepository.getById).toHaveBeenCalledWith(1);
			expect(result.data).toEqual(mockForecast);
		});
	});

	describe("createForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.createForecast> =
				TestBed.runInInjectionContext(() => service.createForecast());

			expect(mutation).toBeTruthy();
		});

		it("should create forecast via mutation", async () =>
		{
			const newForecast: Partial<WeatherForecast> = {
				date: "2024-01-02",
				temperatureC: 25
			};
			mockRepository.create.and.returnValue(of(mockForecast));

			const mutation: ReturnType<typeof service.createForecast> =
				TestBed.runInInjectionContext(() => service.createForecast());
			await mutation.mutateAsync(newForecast);

			expect(mockRepository.create).toHaveBeenCalledWith(newForecast);
		});

		it("should invalidate forecasts query on success", async () =>
		{
			const newForecast: Partial<WeatherForecast> = {
				date: "2024-01-02",
				temperatureC: 25
			};
			mockRepository.create.and.returnValue(of(mockForecast));
			mockRepository.getAll.and.returnValue(of([mockForecast]));

			const mutation: ReturnType<typeof service.createForecast> =
				TestBed.runInInjectionContext(() => service.createForecast());

			await mutation.mutateAsync(newForecast);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["weather", "forecasts"]
			});
		});
	});

	describe("updateForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.updateForecast> =
				TestBed.runInInjectionContext(() => service.updateForecast());

			expect(mutation).toBeTruthy();
		});

		it("should update forecast via mutation", async () =>
		{
			const updates: Partial<WeatherForecast> = { temperatureC: 30 };
			mockRepository.update.and.returnValue(of(mockForecast));

			const mutation: ReturnType<typeof service.updateForecast> =
				TestBed.runInInjectionContext(() => service.updateForecast());
			await mutation.mutateAsync({ id: 1, forecast: updates });

			expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
		});

		it("should invalidate queries on success", async () =>
		{
			const updates: Partial<WeatherForecast> = { temperatureC: 30 };
			mockRepository.update.and.returnValue(of(mockForecast));

			const mutation: ReturnType<typeof service.updateForecast> =
				TestBed.runInInjectionContext(() => service.updateForecast());
			await mutation.mutateAsync({ id: 1, forecast: updates });

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["weather", "forecast", 1]
			});
			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["weather", "forecasts"]
			});
		});
	});

	describe("deleteForecast", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.deleteForecast> =
				TestBed.runInInjectionContext(() => service.deleteForecast());

			expect(mutation).toBeTruthy();
		});

		it("should delete forecast via mutation", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.deleteForecast> =
				TestBed.runInInjectionContext(() => service.deleteForecast());
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should invalidate forecasts query on success", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.deleteForecast> =
				TestBed.runInInjectionContext(() => service.deleteForecast());
			await mutation.mutateAsync(1);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["weather", "forecasts"]
			});
		});
	});
});
