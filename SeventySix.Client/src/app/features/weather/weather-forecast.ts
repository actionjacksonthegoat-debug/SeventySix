import {
	Component,
	ChangeDetectionStrategy,
	signal,
	inject,
	OnInit,
	computed
} from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DatePipe } from "@angular/common";
import { WeatherService } from "@core/services";
import { WeatherForecast } from "@core/models/interfaces/weather-forecast";

/**
 * Weather Forecast feature page
 * Displays weather data in Material table and cards
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
	templateUrl: "./weather-forecast.html",
	styleUrl: "./weather-forecast.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherForecastPage implements OnInit
{
	private readonly weatherService = inject(WeatherService);

	protected readonly forecasts = signal<WeatherForecast[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal<string | null>(null);

	protected readonly displayedColumns: string[] = [
		"date",
		"temperatureC",
		"temperatureF",
		"summary",
		"actions"
	];

	// Computed values
	protected readonly averageTempC = computed(() =>
	{
		const temps = this.forecasts().map((f) => f.temperatureC);
		return temps.length > 0
			? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
			: 0;
	});

	protected readonly averageTempF = computed(() =>
	{
		const temps = this.forecasts()
			.filter((f) => f.temperatureF)
			.map((f) => f.temperatureF!);
		return temps.length > 0
			? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
			: 0;
	});

	protected readonly hottestDay = computed(() =>
	{
		const sorted = [...this.forecasts()].sort(
			(a, b) => b.temperatureC - a.temperatureC
		);
		return sorted[0] || null;
	});

	protected readonly coldestDay = computed(() =>
	{
		const sorted = [...this.forecasts()].sort(
			(a, b) => a.temperatureC - b.temperatureC
		);
		return sorted[0] || null;
	});

	ngOnInit(): void
	{
		this.loadForecasts();
	}

	private loadForecasts(): void
	{
		this.loading.set(true);
		this.error.set(null);

		this.weatherService.getAllForecasts().subscribe({
			next: (data) =>
			{
				this.forecasts.set(data);
				this.loading.set(false);
			},
			error: (err) =>
			{
				console.error("Failed to load weather forecasts:", err);
				this.error.set(
					"Failed to load weather data. Please try again."
				);
				this.loading.set(false);
			}
		});
	}

	protected refresh(): void
	{
		this.loadForecasts();
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
		const lower = summary.toLowerCase();
		if (lower.includes("hot") || lower.includes("scorching")) return "warn";
		if (lower.includes("warm") || lower.includes("balmy")) return "accent";
		if (lower.includes("cool") || lower.includes("chilly"))
			return "primary";
		if (lower.includes("freezing") || lower.includes("cold")) return "warn";
		return "";
	}
}
