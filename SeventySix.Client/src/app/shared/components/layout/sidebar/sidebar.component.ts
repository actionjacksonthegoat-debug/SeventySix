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
import {
	ROLE_ADMIN,
	ROLE_DEVELOPER
} from "@shared/constants/role.constants";
import { LayoutService } from "@shared/services";
import { AuthService } from "@shared/services/auth.service";

interface NavItem
{
	/**
	 * @type {string}
	 * Display label for the navigation item.
	 */
	label: string;

	/**
	 * @type {string}
	 * Material icon name to display next to the item.
	 */
	icon: string;

	/**
	 * @type {string}
	 * Route path for the navigation target.
	 */
	route: string;

	/**
	 * @type {boolean | undefined}
	 * When true the item is displayed disabled in the UI.
	 */
	disabled?: boolean;

	/**
	 * Roles required to see this item. Inherits from section if not specified.
	 * @type {string[] | undefined}
	 */
	requiredRoles?: string[];
}

interface NavSection
{
	/**
	 * @type {string}
	 * Section title displayed above the list of items.
	 */
	title: string;

	/**
	 * @type {NavItem[]}
	 * Array of navigation items belonging to the section.
	 */
	items: NavItem[];

	/**
	 * Roles required to see this section. Empty array means visible to all (including guests).
	 * @type {string[] | undefined}
	 */
	requiredRoles?: string[];
}

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
	 * All navigation sections with role requirements.
	 * @type {ReadonlyArray<NavSection>}
	 * @private
	 */
	private readonly navSections: NavSection[] =
		[
			{
				title: "Main",
				items: [
					{
						label: "Dashboard",
						icon: "dashboard",
						route: "/"
					},
					{
						label: "Sandbox",
						icon: "science",
						route: "/sandbox"
					}
				],
				requiredRoles: [] // Visible to all including guests
			},
			{
				title: "Developer",
				items: [
					{
						label: "Style Guide",
						icon: "palette",
						route: "/developer/style-guide"
					},
					{
						label: "Architecture Guide",
						icon: "architecture",
						route: "/developer/architecture-guide"
					}
				],
				requiredRoles: [ROLE_DEVELOPER, ROLE_ADMIN]
			},
			{
				title: "Management",
				items: [
					{
						label: "Admin Dashboard",
						icon: "admin_panel_settings",
						route: "/admin"
					},
					{
						label: "Users",
						icon: "people",
						route: "/admin/users"
					},
					{
						label: "Permission Requests",
						icon: "lock_open",
						route: "/admin/permission-requests"
					},
					{
						label: "Logs",
						icon: "article",
						route: "/admin/logs"
					}
				],
				requiredRoles: [ROLE_ADMIN]
			}
		];

	/**
	 * Computed signal that filters sections and items based on current user's roles.
	 * @type {Signal<NavSection[]>}
	 * @protected
	 */
	protected readonly visibleNavSections: Signal<NavSection[]> =
		computed(
			() =>
				this.navSections
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
		if (!requiredRoles || requiredRoles.length === 0)
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
