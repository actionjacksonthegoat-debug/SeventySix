import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { WeatherPreferencesService } from "@home/weather/services/weather-preferences.service";
import { Units } from "@home/weather/models";

@Component({
	selector: "app-unit-toggle",
	imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
	templateUrl: "./unit-toggle.component.html",
	styleUrl: "./unit-toggle.component.scss"
})
export class UnitToggleComponent
{
	private readonly preferencesService = inject(WeatherPreferencesService);

	readonly currentUnits = computed(() => this.preferencesService.units());
	readonly temperatureUnit = computed(() =>
		this.preferencesService.temperatureUnit()
	);
	readonly windSpeedUnit = computed(() =>
		this.preferencesService.windSpeedUnit()
	);

	readonly Units = Units;

	toggleUnits(): void
	{
		const newUnits =
			this.currentUnits() === Units.Metric
				? Units.Imperial
				: Units.Metric;
		this.preferencesService.setUnits(newUnits);
	}
}
