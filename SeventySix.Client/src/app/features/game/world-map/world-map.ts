import { Component, ChangeDetectionStrategy } from "@angular/core";
import { WeatherDisplay } from "@shared/components/weather-display/weather-display";

/**
 * World map container component.
 * Smart component that handles state and delegates display to presentational components.
 * Follows Smart/Presentational component pattern.
 */
@Component({
	selector: "app-world-map",
	imports: [WeatherDisplay],
	templateUrl: "./world-map.html",
	styleUrl: "./world-map.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorldMap
{}
