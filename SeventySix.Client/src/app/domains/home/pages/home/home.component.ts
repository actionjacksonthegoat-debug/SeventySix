import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

interface QuickAction
{
	/**
	 * Action title displayed in the card header.
	 * @type {string}
	 */
	title: string;

	/**
	 * Short description for the action.
	 * @type {string}
	 */
	description: string;

	/**
	 * Material icon name for visual identification.
	 * @type {string}
	 */
	icon: string;

	/**
	 * Route to navigate when action is triggered.
	 * @type {string}
	 */
	route: string;

	/**
	 * CSS theme class to apply to the card.
	 * @type {string}
	 */
	themeClass: string;
}

/**
 * Home page
 * Displays navigation to key features
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
	/**
	 * Quick actions displayed on the home page.
	 * @type {QuickAction[]}
	 * @protected
	 * @readonly
	 */
	protected readonly quickActions: QuickAction[] =
		[
			{
				title: "Sandbox",
				description: "Experimentation area for testing new features and ideas",
				icon: "science",
				route: "/sandbox",
				themeClass: "theme-primary"
			},
			{
				title: "Architecture Guide",
				description: "Documentation for project architecture patterns and guidelines",
				icon: "architecture",
				route: "/developer/architecture-guide",
				themeClass: "theme-secondary"
			}
		];
}
