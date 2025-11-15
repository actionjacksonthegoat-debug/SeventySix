import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { ThemeService, LayoutService } from "@core/services";
import { BreadcrumbComponent } from "@shared/components";

/**
 * Application header component
 * Displays logo, navigation, search, user menu, and theme toggles
 */
@Component({
	selector: "app-header",
	imports: [
		MatToolbarModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
		MatMenuModule,
		MatDividerModule,
		BreadcrumbComponent
	],
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent
{
	protected readonly themeService: ThemeService = inject(ThemeService);
	protected readonly layoutService: LayoutService = inject(LayoutService);

	toggleSidebar(): void
	{
		this.layoutService.toggleSidebar();
	}

	toggleBrightness(): void
	{
		this.themeService.toggleBrightness();
	}

	toggleColorScheme(): void
	{
		this.themeService.toggleColorScheme();
	}
}
