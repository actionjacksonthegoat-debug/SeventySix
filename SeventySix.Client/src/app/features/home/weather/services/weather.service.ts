/**
 * Weather Service
 * Business logic layer for weather forecast operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	injectMutation,
	injectQueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { WeatherForecast } from "@home/weather/models";
import { WeatherForecastRepository } from "@home/weather/repositories";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for weather forecast business logic
 * All methods use TanStack Query for automatic caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class WeatherService
{
	private readonly weatherRepository = inject(WeatherForecastRepository);
	private readonly queryClient = injectQueryClient();
	private readonly queryConfig = getQueryConfig("weather");

	/**
	 * Query for all weather forecasts
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getAllForecasts()
	{
		return injectQuery(() => ({
			queryKey: ["weather", "forecasts"],
			queryFn: () => lastValueFrom(this.weatherRepository.getAll()),
			...this.queryConfig
		}));
	}

	/**
	 * Query for weather forecast by ID
	 * @param id The forecast identifier
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getForecastById(id: number | string)
	{
		return injectQuery(() => ({
			queryKey: ["weather", "forecast", id],
			queryFn: () => lastValueFrom(this.weatherRepository.getById(id)),
			...this.queryConfig
		}));
	}

	/**
	 * Mutation for creating weather forecast
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	createForecast()
	{
		return injectMutation(() => ({
			mutationFn: (forecast: Partial<WeatherForecast>) =>
				lastValueFrom(this.weatherRepository.create(forecast)),
			onSuccess: () =>
			{
				// Invalidate and refetch all forecasts
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"]
				});
			}
		}));
	}

	/**
	 * Mutation for updating weather forecast
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	updateForecast()
	{
		return injectMutation(() => ({
			mutationFn: ({
				id,
				forecast
			}: {
				id: number | string;
				forecast: Partial<WeatherForecast>;
			}) => lastValueFrom(this.weatherRepository.update(id, forecast)),
			onSuccess: (_, variables) =>
			{
				// Invalidate specific forecast and list
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecast", variables.id]
				});
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"]
				});
			}
		}));
	}

	/**
	 * Mutation for deleting weather forecast
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteForecast()
	{
		return injectMutation(() => ({
			mutationFn: (id: number | string) =>
				lastValueFrom(this.weatherRepository.delete(id)),
			onSuccess: () =>
			{
				// Invalidate all forecasts
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"]
				});
			}
		}));
	}
}
