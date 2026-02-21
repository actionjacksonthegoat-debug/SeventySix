import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";

/**
 * 401 Unauthorized error page.
 * Displays when user attempts to access a resource without valid authentication.
 * Uses Material Design components for consistent styling.
 */
@Component(
	{
		selector: "app-unauthorized",
		imports: [RouterLink, ...CARD_MATERIAL_MODULES],
		templateUrl: "./unauthorized.html",
		styleUrls: ["./unauthorized.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class UnauthorizedPage
{}