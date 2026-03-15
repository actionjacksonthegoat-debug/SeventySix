import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Games Landing Page.
 * Displays navigation cards for available games in the Games domain.
 */
@Component(
	{
		selector: "app-games-landing",
		standalone: true,
		imports: [RouterLink],
		templateUrl: "./games-landing.html",
		styleUrl: "./games-landing.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class GamesLandingComponent
{
}