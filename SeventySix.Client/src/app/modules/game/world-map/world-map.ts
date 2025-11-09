import { Component } from "@angular/core";
import { WeatherDisplay } from "@shared/components/weather-display/weather-display";

@Component({
	selector: "app-world-map",
	imports: [WeatherDisplay],
	templateUrl: "./world-map.html",
	styleUrl: "./world-map.scss"
})
export class WorldMap
{}
