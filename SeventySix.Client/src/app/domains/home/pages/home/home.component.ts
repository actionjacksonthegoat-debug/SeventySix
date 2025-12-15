import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
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
 * Displays navigation to Sandbox feature
 */
@Component(
	{
		selector: "app-home",
		imports: [MatCardModule, MatIconModule, RouterLink],
		templateUrl: "./home.component.html",
		styleUrl: "./home.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class HomeComponent
{
	protected readonly quickActions: QuickAction[] =
		[
			{
				title: "Sandbox",
				description: "Experimentation area for testing new features and ideas",
				icon: "science",
				route: "/sandbox",
				themeClass: "theme-primary"
			}
		];
}
