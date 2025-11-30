import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { WindowUtilities } from "@shared/utilities";

/**
 * 500 Server Error page.
 * Displays when server encounters an internal error.
 * Uses Material Design components for consistent styling.
 */
@Component({
	selector: "app-server-error",
	imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
	templateUrl: "./server-error.html",
	styleUrls: ["./server-error.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerErrorPage
{
	private readonly windowUtilities: WindowUtilities = inject(WindowUtilities);

	/**
	 * Reloads the current page
	 */
	reloadPage(): void
	{
		this.windowUtilities.reload();
	}
}
