import { Component, inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ApiService } from "@core/api-services/api.service";
import { WeatherForecast } from "@core/models/interfaces/weather-forecast";

@Component({
	selector: "app-weather-display",
	imports: [],
	templateUrl: "./weather-display.html",
	styleUrls: ["./weather-display.scss"]
})
export class WeatherDisplay
{
	private readonly api = inject(ApiService);
	private readonly controller = "WeatherForecast";

	// Public Signal containing the array of forecasts; initialValue ensures strict typing
	public readonly WeatherForecasts: Signal<WeatherForecast[]> = toSignal(
		this.api.get<WeatherForecast[]>(`${this.controller}`),
		{
			initialValue: [] as WeatherForecast[]
		}
	);
}
