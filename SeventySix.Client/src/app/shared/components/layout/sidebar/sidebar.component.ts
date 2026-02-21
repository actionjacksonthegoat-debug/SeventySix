import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { NAV_SECTIONS } from "@shared/constants";
import { NavItem, NavSection } from "@shared/models";
import { LayoutService } from "@shared/services";
import { AuthService } from "@shared/services/auth.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

@Component(
	{
		selector: "app-sidebar",
		imports: [
			MatListModule,
			MatIconModule,
			MatDividerModule,
			MatButtonModule,
			MatTooltipModule,
			RouterLink,
			RouterLinkActive
		],
		templateUrl: "./sidebar.component.html",
		styleUrl: "./sidebar.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Application sidebar component.
 *
 * Renders the navigation menu and filters visible sections based on the
 * current user's roles. Sections and items may declare role requirements.
 */
export class SidebarComponent
{
	/**
	 * Layout service for controlling sidebar state.
	 * @type {LayoutService}
	 * @protected
	 * @readonly
	 */
	protected readonly layoutService: LayoutService =
		inject(LayoutService);

	/**
	 * Authentication service for role checks and user state.
	 * @type {AuthService}
	 * @private
	 * @readonly
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Computed signal that filters sections and items based on current user's roles.
	 * @type {Signal<NavSection[]>}
	 * @protected
	 */
	protected readonly visibleNavSections: Signal<NavSection[]> =
		computed(
			() =>
				NAV_SECTIONS
					.filter(
						(section: NavSection) =>
							this.hasAccess(section.requiredRoles))
					.map(
						(section: NavSection) => ({
							...section,
							items: section.items.filter(
								(navItem: NavItem) =>
									this.hasAccess(navItem.requiredRoles ?? section.requiredRoles))
						}))
					.filter(
						(section: NavSection) =>
							section.items.length > 0));

	/**
	 * Check if current user has access to a section.
	 * @param {string[] | undefined} requiredRoles
	 * Roles required to access the section.
	 * @returns {boolean}
	 * True if user has access (no roles required or user has any required role).
	 */
	private hasAccess(requiredRoles?: string[]): boolean
	{
		// No roles required - visible to all (including guests)
		if (isNullOrUndefined(requiredRoles) || requiredRoles.length === 0)
		{
			return true;
		}

		return this.authService.hasAnyRole(...requiredRoles);
	}

	/**
	 * Close the sidebar (invoked by the close button).
	 * @returns {void}
	 */
	closeSidebar(): void
	{
		this.layoutService.setSidebarExpanded(false);
	}

	/**
	 * Close the sidebar on mobile when a navigation item is clicked.
	 * If the sidebar is rendered in 'over' mode this will toggle it closed.
	 * @returns {void}
	 */
	closeSidebarOnMobile(): void
	{
		// Close sidebar on mobile when nav item clicked
		if (this.layoutService.sidebarMode() === "over")
		{
			this.layoutService.toggleSidebar();
		}
	}
}