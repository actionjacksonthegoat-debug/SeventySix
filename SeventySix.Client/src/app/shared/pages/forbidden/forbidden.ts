import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";

/**
 * 403 Forbidden error page.
 * Displays when authenticated user lacks permission for a resource.
 * Uses Material Design components for consistent styling.
 */
@Component(
	{
		selector: "app-forbidden",
		imports: [RouterLink, ...CARD_MATERIAL_MODULES],
		templateUrl: "./forbidden.html",
		styleUrls: ["./forbidden.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ForbiddenPage
{}
