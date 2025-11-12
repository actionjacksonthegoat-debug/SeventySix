import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { HourlyForecast, getWeatherIconUrl } from "../../models";

/**
 * Horizontal scrollable carousel component for 48-hour weather forecast
 * Shows time, temperature, weather icon, and precipitation probability
 */
@Component({
	selector: "app-hourly-forecast",
	imports: [CommonModule, MatCardModule, MatIconModule],
	templateUrl: "./hourly-forecast.component.html",
	styleUrl: "./hourly-forecast.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "hourly-forecast-container"
	}
})
export class HourlyForecastComponent
{
	// Inputs
	readonly hourlyForecasts = input<HourlyForecast[] | undefined>(undefined);

	/**
	 * Format Unix timestamp to HH:MM time string
	 */
	formatTime(timestamp: number): string
	{
		const date = new Date(timestamp * 1000);
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}

	/**
	 * Format precipitation probability as percentage
	 */
	formatPrecipitation(pop: number | undefined): string
	{
		if (pop === undefined) return "0%";
		return `${Math.round(pop * 100)}%`;
	}

	/**
	 * Get weather icon URL for forecast
	 */
	getWeatherIconUrl(forecast: HourlyForecast): string
	{
		const icon = forecast.weather?.[0]?.icon;
		return icon ? getWeatherIconUrl(icon) : "";
	}
}
