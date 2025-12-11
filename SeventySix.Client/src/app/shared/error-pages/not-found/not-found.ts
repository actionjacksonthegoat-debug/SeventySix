import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles";

/**
 * 404 Not Found error page.
 * Displays when user navigates to non-existent route.
 * Uses Material Design components for consistent styling.
 */
@Component({
	selector: "app-not-found",
	imports: [RouterLink, ...CARD_MATERIAL_MODULES],
	templateUrl: "./not-found.html",
	styleUrls: ["./not-found.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage
{}
