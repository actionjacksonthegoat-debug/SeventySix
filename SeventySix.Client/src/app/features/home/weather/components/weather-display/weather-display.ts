import {
	Component,
	inject,
	signal,
	computed,
	ChangeDetectionStrategy
} from "@angular/core";
import { WeatherService } from "@home/weather/services";
import { LoggerService } from "@core/services";
import { WeatherForecast } from "@home/weather/models";

/**
 * Weather display component.
 * Displays list of weather forecasts with loading and error states.
 * Follows OnPush change detection for performance.
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
	private readonly weatherService = inject(WeatherService);
	private readonly logger = inject(LoggerService);

	// State signals
	readonly forecasts = signal<WeatherForecast[]>([]);
	readonly isLoading = signal<boolean>(true);
	readonly error = signal<string | null>(null);

	// Computed signals for derived state
	readonly hasForecasts = computed(() => this.forecasts().length > 0);
	readonly forecastCount = computed(() => this.forecasts().length);

	constructor()
	{
		this.loadForecasts();
	}

	/**
	 * Loads weather forecasts from the service.
	 */
	loadForecasts(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.weatherService.getAllForecasts().subscribe({
			next: (data) =>
			{
				this.forecasts.set(data);
				this.isLoading.set(false);
				this.logger.info("Weather forecasts loaded successfully", {
					count: data.length
				});
			},
			error: (err) =>
			{
				this.error.set(
					"Failed to load weather forecasts. Please try again."
				);
				this.isLoading.set(false);
				this.logger.error("Failed to load weather forecasts", err);
			}
		});
	}

	/**
	 * Retries loading forecasts.
	 */
	retry(): void
	{
		this.loadForecasts();
	}

	/**
	 * TrackBy function for ngFor performance.
	 */
	trackByDate(_index: number, forecast: WeatherForecast): string
	{
		return forecast.date.toString();
	}
}
