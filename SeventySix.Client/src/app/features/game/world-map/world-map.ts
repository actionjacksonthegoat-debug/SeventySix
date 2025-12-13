import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

/**
 * World map feature
 * Empty placeholder for game world map and future functionality
 */
@Component({
	selector: "app-world-map",
	imports: [MatCardModule, MatIconModule],
	templateUrl: "./world-map.html",
	styleUrl: "./world-map.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorldMap
{
	readonly title: string = "World Map";
	readonly description: string = "Interactive game world map and exploration features.";
}
