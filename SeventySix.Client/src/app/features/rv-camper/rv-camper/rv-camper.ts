import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "app-rv-camper",
	imports: [MatCardModule, MatIconModule],
	templateUrl: "./rv-camper.html",
	styleUrl: "./rv-camper.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RVCamper
{
	readonly title: string = "RV Camper Projects";
	readonly description: string = "Design and planning workspace for RV camper modifications and improvements.";
}
