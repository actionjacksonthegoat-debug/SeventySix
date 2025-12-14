import { DOCUMENT } from "@angular/common";
import { Component, effect, inject, Renderer2 } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { RouterOutlet } from "@angular/router";
import {
	FooterComponent,
	HeaderComponent,
	SidebarComponent
} from "@infrastructure/layout";
import {
	LayoutService,
	LoadingService,
	ThemeService
} from "@infrastructure/services";
import { NotificationToastComponent } from "@shared/components";

/**
 * Root application component.
 * Main entry point for the Angular application.
 */
@Component(
	{
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
	protected readonly themeService: ThemeService =
		inject(ThemeService);
	protected readonly layoutService: LayoutService =
		inject(LayoutService);
	protected readonly loadingService: LoadingService =
		inject(LoadingService);
	private readonly renderer: Renderer2 =
		inject(Renderer2);
	private readonly document: Document =
		inject(DOCUMENT);

	constructor()
	{
		// Sync sidebar state to body class for CSS targeting (dialogs, overlays)
		effect(
			() =>
			{
				const isExpanded: boolean =
					this.layoutService.sidebarExpanded();
				const isSideMode: boolean =
					this.layoutService.sidebarMode() === "side";

				if (isExpanded && isSideMode)
				{
					this.renderer.addClass(this.document.body, "sidebar-expanded");
				}
				else
				{
					this.renderer.removeClass(
						this.document.body,
						"sidebar-expanded");
				}
			});
	}

	/**
	 * Handle swipe left gesture (close sidebar on mobile)
	 */
	onSwipeLeft(): void
	{
		// Only handle swipe on mobile/tablet (overlay mode)
		if (
			this.layoutService.sidebarMode() === "over"
				&& this.layoutService.sidebarExpanded())
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
			this.layoutService.sidebarMode() === "over"
				&& !this.layoutService.sidebarExpanded())
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
