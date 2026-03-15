import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Sandbox Landing Page.
 * Displays navigation cards for available sandbox games.
 */
@Component(
	{
		selector: "app-sandbox-landing",
		standalone: true,
		imports: [RouterLink],
		templateUrl: "./sandbox-landing.html",
		styleUrl: "./sandbox-landing.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SandboxLandingComponent
{
}