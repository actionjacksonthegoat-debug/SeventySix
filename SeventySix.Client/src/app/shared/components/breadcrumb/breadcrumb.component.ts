import {
	Component,
	computed,
	inject,
	ChangeDetectionStrategy,
	Signal
} from "@angular/core";
import { Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map, startWith } from "rxjs/operators";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem
{
	label: string;
	url: string;
	isActive: boolean;
}

/**
 * Breadcrumb navigation component.
 * Automatically generates breadcrumbs from route hierarchy.
 * Uses Material buttons and icons for visual presentation.
 */
@Component({
	selector: "app-breadcrumb",
	imports: [MatButtonModule, MatIconModule, RouterLink],
	template: `
		<nav class="breadcrumb" aria-label="Breadcrumb navigation">
			@for (item of breadcrumbs(); track item.url; let isLast = $last) {
				@if (!isLast) {
					<button
						mat-button
						[routerLink]="item.url"
						class="breadcrumb-item"
					>
						{{ item.label }}
					</button>
					<mat-icon class="breadcrumb-separator"
						>chevron_right</mat-icon
					>
				} @else {
					<button
						mat-button
						disabled
						class="breadcrumb-item breadcrumb-active"
					>
						{{ item.label }}
					</button>
				}
			}
		</nav>
	`,
	styles: `
		.breadcrumb {
			display: flex;
			align-items: center;
			gap: 0.25rem;
			padding: 0.5rem 0;
			flex-wrap: wrap;

			.breadcrumb-item {
				text-transform: none;
				font-size: 0.875rem;
				min-width: auto;
				padding: 0 0.5rem;

				&.breadcrumb-active {
					color: rgba(var(--mat-primary-rgb), 1);
					font-weight: 500;
				}
			}

			.breadcrumb-separator {
				font-size: 18px;
				width: 18px;
				height: 18px;
				color: rgba(var(--mat-outline-rgb), 0.6);
			}
		}

		@media (max-width: 768px) {
			.breadcrumb {
				font-size: 0.8125rem;

				.breadcrumb-separator {
					font-size: 16px;
					width: 16px;
					height: 16px;
				}
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent
{
	private readonly router: Router = inject(Router);
	private readonly activatedRoute: ActivatedRoute = inject(ActivatedRoute);

	/**
	 * Signal tracking navigation events
	 */
	private readonly navigationEnd$: Signal<BreadcrumbItem[]> = toSignal(
		this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			startWith(null),
			map(() => this.buildBreadcrumbs())
		),
		{ initialValue: [] }
	);

	/**
	 * Computed breadcrumb items
	 */
	readonly breadcrumbs: Signal<BreadcrumbItem[]> = computed(() =>
		this.navigationEnd$()
	);

	/**
	 * Builds breadcrumb items from current route hierarchy
	 */
	private buildBreadcrumbs(): BreadcrumbItem[]
	{
		const breadcrumbs: BreadcrumbItem[] = [];
		const urlSegments: string[] = this.router.url
			.split("/")
			.filter((s) => s);

		// Always add home
		breadcrumbs.push({
			label: "Home",
			url: "/",
			isActive: this.router.url === "/"
		});

		if (urlSegments.length === 0)
		{
			return breadcrumbs;
		}

		// Build feature-based breadcrumbs
		const firstSegment: string = urlSegments[0];
		const featureMap: Record<string, { label: string; url: string }> = {
			"weather-forecast": { label: "Home", url: "/" },
			game: { label: "Game", url: "/game" },
			developer: { label: "Developer", url: "/developer/style-guide" },
			admin: { label: "Admin", url: "/admin" }
		};

		// Add feature breadcrumb if not already home
		if (firstSegment in featureMap && firstSegment !== "weather-forecast")
		{
			const feature: { label: string; url: string } =
				featureMap[firstSegment];
			breadcrumbs.push({
				label: feature.label,
				url: feature.url,
				isActive: this.router.url === feature.url
			});
		}

		// Add sub-page breadcrumbs
		let url: string = "";
		for (let i: number = 0; i < urlSegments.length; i++)
		{
			const segment: string = urlSegments[i];
			url += `/${segment}`;

			// Skip if this is the feature root we already added
			if (
				i === 0 &&
				segment in featureMap &&
				segment !== "weather-forecast"
			)
			{
				continue;
			}

			// Get label from custom mappings or format the segment
			const label: string = this.getSegmentLabel(
				url,
				segment,
				urlSegments,
				i
			);

			// Skip empty labels
			if (!label)
			{
				continue;
			}

			breadcrumbs.push({
				label,
				url,
				isActive:
					this.router.url === url ||
					this.router.url.startsWith(url + "?")
			});
		}

		return breadcrumbs;
	}

	/**
	 * Gets the label for a URL segment
	 */
	private getSegmentLabel(
		url: string,
		segment: string,
		_allSegments: string[],
		_index: number
	): string
	{
		// Custom labels for specific routes
		const routeLabels: Record<string, string> = {
			"/weather-forecast": "Weather Forecast",
			"/game": "World Map",
			"/developer/style-guide": "Style Guide",
			"/admin": "Dashboard",
			"/admin/dashboard": "Dashboard",
			"/admin/logs": "Logs",
			"/admin/users": "Users",
			"/admin/users/create": "Create User"
		};

		if (routeLabels[url])
		{
			return routeLabels[url];
		}

		// Handle dynamic segments (like :id)
		if (segment.match(/^\d+$/))
		{
			return "Details";
		}

		// Format the segment
		return this.formatPathSegment(segment);
	}

	/**
	 * Formats path segment into readable label
	 */
	private formatPathSegment(segment: string): string
	{
		// Remove route parameters
		const cleaned: string = segment.replace(/:\w+/g, "");

		// Handle special cases
		if (cleaned === "") return "Details";

		// Convert kebab-case to Title Case
		return cleaned
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}
}
