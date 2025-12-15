import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

/**
 * Sandbox Landing Page
 * Simple placeholder for experimentation and feature prototyping
 */
@Component(
	{
		selector: "app-sandbox-landing",
		imports: [MatCardModule, MatIconModule],
		templateUrl: "./sandbox-landing.html",
		styleUrl: "./sandbox-landing.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SandboxLandingComponent
{
}
