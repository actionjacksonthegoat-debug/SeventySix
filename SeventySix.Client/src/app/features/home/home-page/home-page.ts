import { Component, ChangeDetectionStrategy } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

interface QuickAction
{
	title: string;
	description: string;
	icon: string;
	route: string;
	themeClass: string;
}

/**
 * Home page
 * Displays navigation to 3 main features: WorldMap, Physics, RVCamper
 */
@Component({
	selector: "app-home-page",
	imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage
{
	protected readonly quickActions: QuickAction[] = [
		{
			title: "World Map",
			description: "Interactive game world map and exploration features",
			icon: "public",
			route: "/game",
			themeClass: "theme-primary"
		},
		{
			title: "Physics",
			description:
				"Electricity generation from buoyancy and calculations",
			icon: "bolt",
			route: "/physics",
			themeClass: "theme-secondary"
		},
		{
			title: "RV Camper",
			description: "Design and planning workspace for RV modifications",
			icon: "rv_hookup",
			route: "/rv-camper",
			themeClass: "theme-tertiary"
		}
	];
}
