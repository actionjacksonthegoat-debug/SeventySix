import {
	Component,
	ChangeDetectionStrategy,
	input,
	InputSignal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { DailyForecast, getWeatherIconUrl } from "@home/weather/models";

/**
 * Grid component for 8-day weather forecast
 * Shows day name, high/low temps, weather icon, and summary
 */
@Component({
	selector: "app-daily-forecast",
	imports: [CommonModule, MatCardModule, MatIconModule],
	templateUrl: "./daily-forecast.component.html",
	styleUrl: "./daily-forecast.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "daily-forecast-container"
	}
})
export class DailyForecastComponent
{
	// Inputs
	readonly dailyForecasts: InputSignal<DailyForecast[] | undefined> = input<
		DailyForecast[] | undefined
	>(undefined);

	/**
	 * Format Unix timestamp to day name (e.g., "Monday", "Tuesday")
	 */
	formatDayName(timestamp: number): string
	{
		const date: Date = new Date(timestamp * 1000);
		const days: string[] = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		];
		return days[date.getDay()];
	}

	/**
	 * Get weather icon URL for forecast
	 */
	getWeatherIconUrl(forecast: DailyForecast): string
	{
		const icon: string | undefined = forecast.weather?.[0]?.icon;
		return icon ? getWeatherIconUrl(icon) : "";
	}

	/**
	 * Format precipitation probability as percentage
	 */
	formatPrecipitation(pop: number | undefined): string
	{
		if (pop === undefined) return "0%";
		return `${Math.round(pop * 100)}%`;
	}
}
