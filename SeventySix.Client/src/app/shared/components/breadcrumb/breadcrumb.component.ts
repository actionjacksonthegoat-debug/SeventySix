import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { RouterLink } from "@angular/router";
import { filter, map, startWith } from "rxjs/operators";

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
@Component(
	{
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
	private readonly router: Router =
		inject(Router);
	private readonly activatedRoute: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Feature mapping configuration for breadcrumbs
	 */
	private readonly featureMap: Record<string, { label: string; url: string; }> =
		{
			game: { label: "Game", url: "/game" },
			developer: { label: "Developer", url: "/developer/style-guide" },
			admin: { label: "Admin", url: "/admin" }
		};

	/**
	 * Signal tracking navigation events
	 */
	private readonly navigationEnd$: Signal<BreadcrumbItem[]> =
		toSignal(
			this.router.events.pipe(
				filter(
					(event) =>
						event instanceof NavigationEnd),
				startWith(null),
				map(
					() => this.buildBreadcrumbs())),
			{ initialValue: [] });

	/**
	 * Computed breadcrumb items
	 */
	readonly breadcrumbs: Signal<BreadcrumbItem[]> =
		computed(
			() => this.navigationEnd$());

	/**
	 * Builds breadcrumb items from current route hierarchy
	 */
	private buildBreadcrumbs(): BreadcrumbItem[]
	{
		const breadcrumbs: BreadcrumbItem[] =
			[this.createHomeBreadcrumb()];
		const urlSegments: string[] =
			this.getUrlSegments();

		if (urlSegments.length === 0)
		{
			return breadcrumbs;
		}

		this.addFeatureBreadcrumb(breadcrumbs, urlSegments[0]);
		this.addSubPageBreadcrumbs(breadcrumbs, urlSegments);

		return breadcrumbs;
	}

	/**
	 * Creates the home breadcrumb item.
	 * @returns Home breadcrumb item
	 */
	private createHomeBreadcrumb(): BreadcrumbItem
	{
		return {
			label: "Home",
			url: "/",
			isActive: this.router.url === "/"
		};
	}

	/**
	 * Gets URL segments from current route, filtered and cleaned.
	 * @returns Array of URL segments
	 */
	private getUrlSegments(): string[]
	{
		return this
		.router
		.url
		.split("/")
		.filter(
			(s) => s);
	}

	/**
	 * Adds feature breadcrumb if the first segment matches a known feature.
	 * @param breadcrumbs Breadcrumb array to modify
	 * @param firstSegment First URL segment
	 */
	private addFeatureBreadcrumb(
		breadcrumbs: BreadcrumbItem[],
		firstSegment: string): void
	{
		if (firstSegment in this.featureMap)
		{
			const feature: { label: string; url: string; } =
				this.featureMap[firstSegment];
			breadcrumbs.push(
				{
					label: feature.label,
					url: feature.url,
					isActive: this.router.url === feature.url
				});
		}
	}

	/**
	 * Adds sub-page breadcrumbs for remaining URL segments.
	 * @param breadcrumbs Breadcrumb array to modify
	 * @param urlSegments All URL segments
	 */
	private addSubPageBreadcrumbs(
		breadcrumbs: BreadcrumbItem[],
		urlSegments: string[]): void
	{
		let url: string = "";
		for (let i: number = 0; i < urlSegments.length; i++)
		{
			const segment: string =
				urlSegments[i];
			url += `/${segment}`;

			// Skip if this is the feature root we already added
			if (i === 0 && segment in this.featureMap)
			{
				continue;
			}

			// Skip if this URL was already added as feature root
			if (
				breadcrumbs.some(
					(b) => b.url === url))
			{
				continue;
			}

			// Get label from custom mappings or format the segment
			const label: string =
				this.getSegmentLabel(
					url,
					segment,
					urlSegments,
					i);

			// Skip empty labels
			if (!label)
			{
				continue;
			}

			breadcrumbs.push(
				{
					label,
					url,
					isActive: this.router.url === url
						|| this.router.url.startsWith(url + "?")
				});
		}
	}

	/**
	 * Gets the label for a URL segment
	 */
	private getSegmentLabel(
		url: string,
		segment: string,
		_allSegments: string[],
		_index: number): string
	{
		// Custom labels for specific routes
		const routeLabels: Record<string, string> =
			{
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
		const cleaned: string =
			segment.replace(/:\w+/g, "");

		// Handle special cases
		if (cleaned === "") return "Details";

		// Convert kebab-case to Title Case
		return cleaned
		.split("-")
		.map(
			(word) =>
				word
				.charAt(0)
				.toUpperCase() + word.slice(1))
		.join(" ");
	}
}
