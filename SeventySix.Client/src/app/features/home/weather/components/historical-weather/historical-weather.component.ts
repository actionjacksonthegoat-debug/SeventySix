import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

/**
 * Collapsible panel component for historical weather information
 * Shows placeholder content for yesterday's weather summary
 */
@Component({
	selector: "app-historical-weather",
	imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
	templateUrl: "./historical-weather.component.html",
	styleUrl: "./historical-weather.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "historical-weather-container"
	}
})
export class HistoricalWeatherComponent
{
	// State
	readonly isExpanded = signal<boolean>(false);

	/**
	 * Toggle expansion state
	 */
	toggleExpand(): void
	{
		this.isExpanded.update((value) => !value);
	}
}
