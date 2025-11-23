import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { LayoutService } from "@core/services";

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
}

/**
 * Application sidebar component
 * Displays navigation menu with Material Design
 */
@Component({
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
	protected readonly layoutService: LayoutService = inject(LayoutService);

	protected readonly navSections: NavSection[] = [
		{
			title: "Main",
			items: [{ label: "Dashboard", icon: "dashboard", route: "/" }]
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
					label: "Logs",
					icon: "article",
					route: "/admin/logs"
				}
			]
		},
		{
			title: "Developer",
			items: [
				{
					label: "Style Guide",
					icon: "palette",
					route: "/developer/style-guide"
				}
			]
		}
	];

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
