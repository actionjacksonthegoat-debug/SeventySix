import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

/**
 * 404 Not Found error page.
 * Displays when user navigates to non-existent route.
 * Uses Material Design components for consistent styling.
 */
@Component({
	selector: "app-not-found",
	imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
	templateUrl: "./not-found.html",
	styleUrls: ["./not-found.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage
{}
