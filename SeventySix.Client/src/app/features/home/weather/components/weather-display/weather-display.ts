import {
	Component,
	inject,
	computed,
	ChangeDetectionStrategy,
	Signal
} from "@angular/core";
import { WeatherService } from "@home/weather/services";
import { LoggerService } from "@core/services";
import { WeatherForecast } from "@home/weather/models";

/**
 * Weather display component.
 * Displays list of weather forecasts with loading and error states.
 * Follows OnPush change detection for performance.
 * Uses TanStack Query for data fetching and caching.
 */
@Component({
	selector: "app-weather-display",
	imports: [],
	templateUrl: "./weather-display.html",
	styleUrls: ["./weather-display.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherDisplay
{
	private readonly weatherService: WeatherService = inject(WeatherService);
	private readonly logger: LoggerService = inject(LoggerService);

	// TanStack Query handles loading, error, and data states
	readonly forecastsQuery: ReturnType<WeatherService["getAllForecasts"]> =
		this.weatherService.getAllForecasts();

	// Computed signals for derived state
	readonly forecasts: Signal<WeatherForecast[]> = computed(
		() => this.forecastsQuery.data() ?? []
	);
	readonly isLoading: Signal<boolean> = computed(() =>
		this.forecastsQuery.isLoading()
	);
	readonly error: Signal<string | null> = computed(() =>
		this.forecastsQuery.error()
			? "Failed to load weather forecasts. Please try again."
			: null
	);
	readonly hasForecasts: Signal<boolean> = computed(
		() => this.forecasts().length > 0
	);
	readonly forecastCount: Signal<number> = computed(
		() => this.forecasts().length
	);

	/**
	 * Retries loading forecasts.
	 */
	retry(): void
	{
		this.forecastsQuery.refetch();
	}

	/**
	 * TrackBy function for ngFor performance.
	 */
	trackByDate(_index: number, forecast: WeatherForecast): string
	{
		return forecast.date.toString();
	}
}
