import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	computed,
	Signal,
	InputSignal,
	OutputEmitterRef
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CurrentWeather, getWeatherIconUrl } from "@home/weather/models";

/**
 * Hero component displaying current weather with large temperature and condition
 * Shows location, feels like temp, weather icon, and refresh button
 */
@Component({
	selector: "app-weather-hero",
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./weather-hero.component.html",
	styleUrl: "./weather-hero.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "weather-hero-container"
	}
})
export class WeatherHeroComponent
{
	// Inputs
	readonly currentWeather: InputSignal<CurrentWeather | undefined> = input<
		CurrentWeather | undefined
	>(undefined);
	readonly location: InputSignal<string> = input<string>("");
	readonly loading: InputSignal<boolean> = input<boolean>(false);

	// Outputs
	readonly refresh: OutputEmitterRef<void> = output<void>();

	// Computed values
	readonly primaryCondition: Signal<string> = computed(() =>
	{
		const weather: CurrentWeather | undefined = this.currentWeather();
		return weather?.weather?.[0]?.main ?? "";
	});

	readonly weatherDescription: Signal<string> = computed(() =>
	{
		const weather: CurrentWeather | undefined = this.currentWeather();
		return weather?.weather?.[0]?.description ?? "";
	});

	readonly weatherIconUrl: Signal<string> = computed(() =>
	{
		const weather: CurrentWeather | undefined = this.currentWeather();
		const icon: string | undefined = weather?.weather?.[0]?.icon;
		return icon ? getWeatherIconUrl(icon) : "";
	});

	readonly temperature: Signal<number> = computed(() =>
	{
		const weather: CurrentWeather | undefined = this.currentWeather();
		return weather?.temp ?? 0;
	});

	readonly feelsLike: Signal<number> = computed(() =>
	{
		const weather: CurrentWeather | undefined = this.currentWeather();
		return weather?.feels_like ?? 0;
	});

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.refresh.emit();
	}
}
