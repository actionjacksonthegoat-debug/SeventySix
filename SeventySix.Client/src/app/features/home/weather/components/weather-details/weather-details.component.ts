import {
	Component,
	ChangeDetectionStrategy,
	input,
	InputSignal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CurrentWeather } from "@home/weather/models";

/**
 * Grid component displaying detailed weather metrics
 * Shows UV index, humidity, wind, pressure, visibility, sunrise/sunset, dew point
 */
@Component({
	selector: "app-weather-details",
	imports: [CommonModule, MatCardModule, MatIconModule],
	templateUrl: "./weather-details.component.html",
	styleUrl: "./weather-details.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "weather-details-container"
	}
})
export class WeatherDetailsComponent
{
	// Inputs
	readonly currentWeather: InputSignal<CurrentWeather | undefined> = input<
		CurrentWeather | undefined
	>(undefined);

	/**
	 * Format wind direction degrees to compass direction
	 */
	formatWindDirection(degrees: number | undefined): string
	{
		if (degrees === undefined) return "N";

		const directions: string[] = [
			"N",
			"NE",
			"E",
			"SE",
			"S",
			"SW",
			"W",
			"NW"
		];
		const index: number = Math.round(degrees / 45) % 8;
		return directions[index];
	}

	/**
	 * Format Unix timestamp to 12-hour time string
	 */
	formatTime(timestamp: number): string
	{
		const date: Date = new Date(timestamp * 1000);
		let hours: number = date.getHours();
		const minutes: string = date.getMinutes().toString().padStart(2, "0");
		const ampm: string = hours >= 12 ? "PM" : "AM";
		hours = hours % 12 || 12;
		return `${hours}:${minutes} ${ampm}`;
	}

	/**
	 * Format visibility in kilometers
	 */
	formatVisibility(meters: number | undefined): string
	{
		if (meters === undefined) return "0 km";
		const km: number = meters / 1000;
		return `${km} km`;
	}
}
