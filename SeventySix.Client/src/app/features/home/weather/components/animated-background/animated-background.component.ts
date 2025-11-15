import {
	Component,
	ChangeDetectionStrategy,
	input,
	computed,
	inject,
	InputSignal,
	Signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { WeatherPreferencesService } from "@home/weather/services/weather-preferences.service";

/**
 * Animated background component that changes based on weather conditions
 * Supports reduced motion preferences and smooth transitions
 */
@Component({
	selector: "app-animated-background",
	imports: [CommonModule],
	templateUrl: "./animated-background.component.html",
	styleUrl: "./animated-background.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "animated-background-container"
	}
})
export class AnimatedBackgroundComponent
{
	private readonly preferencesService: WeatherPreferencesService = inject(
		WeatherPreferencesService
	);

	// Inputs
	readonly weatherCondition: InputSignal<string | undefined> = input<
		string | undefined
	>(undefined);

	// Computed
	readonly backgroundClass: Signal<string> = computed(() =>
	{
		const condition: string = this.weatherCondition()?.toLowerCase() || "";

		switch (condition)
		{
			case "clear":
				return "bg-clear";
			case "clouds":
				return "bg-clouds";
			case "rain":
				return "bg-rain";
			case "drizzle":
				return "bg-drizzle";
			case "snow":
				return "bg-snow";
			case "thunderstorm":
				return "bg-thunderstorm";
			case "mist":
			case "fog":
			case "haze":
			case "smoke":
			case "dust":
				return "bg-mist";
			default:
				return "bg-clear";
		}
	});

	readonly animationsEnabled: Signal<boolean> = computed(() =>
	{
		return this.preferencesService.animationsEnabled();
	});
}
