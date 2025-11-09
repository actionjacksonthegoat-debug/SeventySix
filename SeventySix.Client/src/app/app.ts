import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";

/**
 * Root application component.
 * Main entry point for the Angular application.
 */
@Component({
	selector: "app-root",
	imports: [RouterOutlet],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class App
{
	protected readonly title = signal("SeventySix.Client");
}
