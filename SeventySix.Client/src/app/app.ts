import { DOCUMENT } from "@angular/common";
import { Component, effect, inject, Renderer2 } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { RouterOutlet } from "@angular/router";
import { NotificationToastComponent } from "@shared/components";
import {
	FooterComponent,
	HeaderComponent,
	SidebarComponent
} from "@shared/components/layout";
import {
	LayoutService,
	LoadingService
} from "@shared/services";

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
	/**
	 * Layout service for sidebar state and responsive helpers.
	 * @type {LayoutService}
	 * @protected
	 * @readonly
	 */
	protected readonly layoutService: LayoutService =
		inject(LayoutService);
	/**
	 * Loading service controlling the global progress indicator state.
	 * @type {LoadingService}
	 * @protected
	 * @readonly
	 */
	protected readonly loadingService: LoadingService =
		inject(LoadingService);
	/**
	 * Renderer used for DOM class manipulations (adds/removes body classes).
	 * @type {Renderer2}
	 * @private
	 * @readonly
	 */
	private readonly renderer: Renderer2 =
		inject(Renderer2);
	/**
	 * Document reference for direct DOM access where necessary.
	 * @type {Document}
	 * @private
	 * @readonly
	 */
	private readonly document: Document =
		inject(DOCUMENT);

	/**
	 * Initialize the application component and synchronize sidebar state to the document body
	 * for styling (adds/removes `sidebar-expanded` as needed).
	 * @returns {void}
	 */
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
	 * @returns {void}
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
	 * @returns {void}
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
	 * @returns {void}
	 */
	onBackdropClick(): void
	{
		this.layoutService.closeSidebar();
	}
}
