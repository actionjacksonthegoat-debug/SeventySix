import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
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
		RouterLink,
		RouterLinkActive
	],
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent
{
	protected readonly layoutService = inject(LayoutService);

	protected readonly navSections: NavSection[] = [
		{
			title: "Main",
			items: [
				{ label: "Dashboard", icon: "dashboard", route: "/" },
				{ label: "Weather", icon: "cloud", route: "/weather-forecast" }
			]
		},
		{
			title: "Management",
			items: [
				{
					label: "Users",
					icon: "people",
					route: "/users",
					disabled: true
				},
				{
					label: "Settings",
					icon: "settings",
					route: "/settings",
					disabled: true
				}
			]
		},
		{
			title: "Developer",
			items: [
				{
					label: "Style Guide",
					icon: "palette",
					route: "/style-guide"
				}
			]
		}
	];

	closeSidebarOnMobile(): void
	{
		// Close sidebar on mobile when nav item clicked
		if (this.layoutService.sidebarMode() === "over")
		{
			this.layoutService.toggleSidebar();
		}
	}
}
