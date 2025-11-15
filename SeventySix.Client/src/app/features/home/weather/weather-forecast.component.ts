import {
	Component,
	ChangeDetectionStrategy,
	inject,
	computed,
	Signal
} from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DatePipe } from "@angular/common";
import { WeatherService } from "@home/weather/services";
import { WeatherForecast } from "@home/weather/models";

/**
 * Weather Forecast feature page
 * Displays weather data in Material table and cards
 * Uses TanStack Query for data fetching and caching
 */
@Component({
	selector: "app-weather-forecast",
	imports: [
		MatTableModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatChipsModule,
		MatTooltipModule,
		DatePipe
	],
	templateUrl: "./weather-forecast.component.html",
	styleUrl: "./weather-forecast.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherForecastComponent
{
	private readonly weatherService: WeatherService = inject(WeatherService);

	// TanStack Query handles loading, error, and data states
	protected readonly forecastsQuery: ReturnType<
		typeof this.weatherService.getAllForecasts
	> = this.weatherService.getAllForecasts();

	// Computed signals for derived state
	protected readonly forecasts: Signal<WeatherForecast[]> = computed(
		() => this.forecastsQuery.data() ?? []
	);
	protected readonly loading: Signal<boolean> = computed(() =>
		this.forecastsQuery.isLoading()
	);
	protected readonly error: Signal<string | null> = computed(() =>
		this.forecastsQuery.error()
			? "Failed to load weather data. Please try again."
			: null
	);

	protected readonly displayedColumns: string[] = [
		"date",
		"temperatureC",
		"temperatureF",
		"summary",
		"actions"
	];

	// Computed values
	protected readonly averageTempC: Signal<number> = computed(() =>
	{
		const temps: number[] = this.forecasts().map((f) => f.temperatureC);
		return temps.length > 0
			? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
			: 0;
	});

	protected readonly averageTempF: Signal<number> = computed(() =>
	{
		const temps: number[] = this.forecasts()
			.filter((f) => f.temperatureF)
			.map((f) => f.temperatureF!);
		return temps.length > 0
			? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
			: 0;
	});

	protected readonly hottestDay: Signal<WeatherForecast | null> = computed(
		() =>
		{
			const sorted: WeatherForecast[] = [...this.forecasts()].sort(
				(a, b) => b.temperatureC - a.temperatureC
			);
			return sorted[0] || null;
		}
	);

	protected readonly coldestDay: Signal<WeatherForecast | null> = computed(
		() =>
		{
			const sorted: WeatherForecast[] = [...this.forecasts()].sort(
				(a, b) => a.temperatureC - b.temperatureC
			);
			return sorted[0] || null;
		}
	);

	protected refresh(): void
	{
		this.forecastsQuery.refetch();
	}

	protected getTemperatureClass(tempC: number): string
	{
		if (tempC >= 30) return "temp-hot";
		if (tempC >= 20) return "temp-warm";
		if (tempC >= 10) return "temp-mild";
		if (tempC >= 0) return "temp-cool";
		return "temp-cold";
	}

	protected getSummaryColor(summary?: string): string
	{
		if (!summary) return "";
		const lower: string = summary.toLowerCase();
		if (lower.includes("hot") || lower.includes("scorching")) return "warn";
		if (lower.includes("warm") || lower.includes("balmy")) return "accent";
		if (lower.includes("cool") || lower.includes("chilly"))
			return "primary";
		if (lower.includes("freezing") || lower.includes("cold")) return "warn";
		return "";
	}
}
