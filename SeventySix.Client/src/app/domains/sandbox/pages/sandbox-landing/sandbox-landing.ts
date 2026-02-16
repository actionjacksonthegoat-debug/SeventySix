import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * Sandbox Landing Page
 * Minimal placeholder for experimentation and feature prototyping
 */
@Component(
	{
		selector: "app-sandbox-landing",
		templateUrl: "./sandbox-landing.html",
		styleUrl: "./sandbox-landing.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SandboxLandingComponent
{
}
