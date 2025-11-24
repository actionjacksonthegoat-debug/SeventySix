import { Component, ChangeDetectionStrategy } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

/**
 * Physics calculations
 * Empty placeholder for electricity generation from buoyancy and future calculations
 */
@Component({
	selector: "app-physics",
	imports: [MatCardModule, MatIconModule],
	templateUrl: "./physics.html",
	styleUrl: "./physics.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Physics
{
	readonly title: string = "Physics Calculations";
	readonly description: string =
		"Electricity generation from buoyancy and future calculations";
}
