import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ThemeService, LayoutService, LoadingService } from "@core/services";
import {
	HeaderComponent,
	SidebarComponent,
	FooterComponent
} from "@core/layout";
import { NotificationToastComponent } from "@shared/components";

/**
 * Root application component.
 * Main entry point for the Angular application.
 */
@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		MatSidenavModule,
		MatProgressBarModule,
		HeaderComponent,
		SidebarComponent,
		FooterComponent,
		NotificationToastComponent
	],
	templateUrl: "./app.html",
	styleUrl: "./app.scss"
})
export class App
{
	protected readonly themeService: ThemeService = inject(ThemeService);
	protected readonly layoutService: LayoutService = inject(LayoutService);
	protected readonly loadingService: LoadingService = inject(LoadingService);

	/**
	 * Handle swipe left gesture (close sidebar on mobile)
	 */
	onSwipeLeft(): void
	{
		// Only handle swipe on mobile/tablet (overlay mode)
		if (
			this.layoutService.sidebarMode() === "over" &&
			this.layoutService.sidebarExpanded()
		)
		{
			this.layoutService.closeSidebar();
		}
	}

	/**
	 * Handle swipe right gesture (open sidebar on mobile)
	 */
	onSwipeRight(): void
	{
		// Only handle swipe on mobile/tablet (overlay mode)
		if (
			this.layoutService.sidebarMode() === "over" &&
			!this.layoutService.sidebarExpanded()
		)
		{
			this.layoutService.openSidebar();
		}
	}

	/**
	 * Handle backdrop click (close sidebar)
	 */
	onBackdropClick(): void
	{
		this.layoutService.closeSidebar();
	}
}
