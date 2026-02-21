/**
 * Navigation Configuration Constants
 * Centralized navigation structure for sidebar component.
 * Single source of truth for navigation sections and items.
 */

import {
	ROLE_ADMIN,
	ROLE_DEVELOPER
} from "@shared/constants/role.constants";
import { NavSection } from "@shared/models";

/**
 * Application navigation sections with role-based access control.
 * Each section contains items that may inherit or override the section's required roles.
 * @remarks
 * - Empty requiredRoles array means visible to all users including guests
 * - Items inherit section roles unless explicitly overridden
 * - Order in array determines display order in sidebar
 * @type {ReadonlyArray<NavSection>}
 */
export const NAV_SECTIONS: ReadonlyArray<NavSection> =
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
	] as const;