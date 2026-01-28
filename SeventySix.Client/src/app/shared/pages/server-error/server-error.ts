import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles";
import { WindowService } from "@shared/services";

/**
 * 500 Server Error page.
 * Displays when server encounters an internal error.
 * Uses Material Design components for consistent styling.
 */
@Component(
	{
		selector: "app-server-error",
		imports: [RouterLink, ...CARD_MATERIAL_MODULES],
		templateUrl: "./server-error.html",
		styleUrls: ["./server-error.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ServerErrorPage
{
	private readonly windowService: WindowService =
		inject(WindowService);

	/**
	 * Reloads the current page
	 */
	reloadPage(): void
	{
		this.windowService.reload();
	}
}
