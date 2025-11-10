import {
	Component,
	ChangeDetectionStrategy,
	signal,
	inject
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { ThemeService } from "@core/services";

interface QuickStat
{
	label: string;
	value: string;
	icon: string;
	trend?: "up" | "down";
	trendValue?: string;
	color?: "primary" | "accent" | "warn";
}

interface QuickAction
{
	title: string;
	description: string;
	icon: string;
	route: string;
	color?: string;
}

/**
 * Home/Dashboard page
 * Displays overview, quick stats, and navigation to key features
 */
@Component({
	selector: "app-home-page",
	imports: [
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatChipsModule,
		MatDividerModule,
		RouterLink
	],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage
{
	protected readonly themeService = inject(ThemeService);

	protected readonly stats: QuickStat[] = [
		{
			label: "Total Users",
			value: "1,234",
			icon: "people",
			trend: "up",
			trendValue: "+12%",
			color: "primary"
		},
		{
			label: "Active Sessions",
			value: "89",
			icon: "trending_up",
			trend: "up",
			trendValue: "+5%",
			color: "accent"
		},
		{
			label: "Data Storage",
			value: "45.2 GB",
			icon: "storage",
			trend: "down",
			trendValue: "-2%"
		},
		{
			label: "API Calls Today",
			value: "12.4K",
			icon: "api",
			trend: "up",
			trendValue: "+18%",
			color: "primary"
		}
	];

	protected readonly quickActions: QuickAction[] = [
		{
			title: "User Management",
			description: "View and manage user accounts",
			icon: "people",
			route: "/users",
			color: "primary"
		},
		{
			title: "Weather Forecast",
			description: "Check weather data and forecasts",
			icon: "cloud",
			route: "/weather-forecast",
			color: "accent"
		},
		{
			title: "World Map",
			description: "Explore the interactive game world",
			icon: "map",
			route: "/game",
			color: "warn"
		},
		{
			title: "Settings",
			description: "Configure application preferences",
			icon: "settings",
			route: "/settings",
			color: "primary"
		}
	];

	protected readonly recentActivity = signal([
		{
			icon: "person_add",
			text: "New user registered: John Doe",
			time: "5 minutes ago"
		},
		{
			icon: "edit",
			text: "User profile updated: Jane Smith",
			time: "12 minutes ago"
		},
		{
			icon: "cloud_upload",
			text: "Data backup completed",
			time: "1 hour ago"
		},
		{ icon: "security", text: "Security scan passed", time: "2 hours ago" }
	]);
}
