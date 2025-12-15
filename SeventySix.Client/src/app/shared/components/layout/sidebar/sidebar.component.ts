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
	label: string;
	icon: string;
	route: string;
	disabled?: boolean;
}

interface NavSection
{
	title: string;
	items: NavItem[];
	/** Roles required to see this section. Empty array means visible to all (including guests). */
	requiredRoles?: string[];
}

/**
 * Application sidebar component
 * Displays navigation menu with Material Design
 * Filters visible sections based on user roles
 */
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
export class SidebarComponent
{
	protected readonly layoutService: LayoutService =
		inject(LayoutService);
	private readonly authService: AuthService =
		inject(AuthService);

	/** All navigation sections with role requirements. */
	private readonly navSections: NavSection[] =
		[
			{
				title: "Main",
				items: [{ label: "Dashboard", icon: "dashboard", route: "/" }],
				requiredRoles: [] // Visible to all including guests
			},
			{
				title: "Developer",
				items: [
					{
						label: "Style Guide",
						icon: "palette",
						route: "/developer/style-guide"
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

	/** Computed signal that filters sections based on current user's roles. */
	protected readonly visibleNavSections: Signal<NavSection[]> =
		computed(
			() =>
				this.navSections.filter(
					(section: NavSection) =>
						this.hasAccess(section.requiredRoles)));

	/**
	 * Check if current user has access to a section.
	 * @param requiredRoles Roles required to access the section.
	 * @returns True if user has access (no roles required or user has any required role).
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
	 * Close sidebar (called from close button)
	 */
	closeSidebar(): void
	{
		this.layoutService.setSidebarExpanded(false);
	}

	/**
	 * Close sidebar on mobile when navigation item is clicked
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
