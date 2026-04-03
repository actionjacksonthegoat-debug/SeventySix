/**
 * Game Loading Component.
 * Displays a clean loading screen with the game's icon and name
 * while the Babylon.js scene initializes.
 */

import { ChangeDetectionStrategy, Component, input, type InputSignal } from "@angular/core";

/** Loading overlay shown during game scene initialization. */
@Component(
	{
		selector: "app-game-loading",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./game-loading.html",
		styleUrl: "./game-loading.scss"
	})
export class GameLoadingComponent
{
	/** The display name of the game being loaded. */
	public readonly gameName: InputSignal<string> =
		input.required<string>();

	/** The emoji icon representing the game. */
	public readonly gameIcon: InputSignal<string> =
		input.required<string>();
}