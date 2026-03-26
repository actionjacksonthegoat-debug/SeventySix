import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * Sandbox Landing Page.
 * Simple Hello World experimentation page.
 */
@Component(
	{
		selector: "app-sandbox-landing",
		standalone: true,
		imports: [],
		templateUrl: "./sandbox-landing.html",
		styleUrl: "./sandbox-landing.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SandboxLandingComponent
{
}