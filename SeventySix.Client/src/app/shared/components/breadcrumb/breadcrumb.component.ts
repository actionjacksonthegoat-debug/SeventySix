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
import { ActivatedRoute, NavigationEnd, Router, UrlSegment, UrlSegmentGroup, UrlTree } from "@angular/router";
import { RouterLink } from "@angular/router";
import { BreadcrumbItem } from "@shared/models";
import { capitalize } from "@shared/utilities";
import { isNullOrEmpty } from "@shared/utilities/null-check.utility";
import { filter, map, startWith } from "rxjs/operators";

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
						aria-hidden="true"
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
/**
 * Breadcrumb navigation component.
 *
 * Automatically generates breadcrumbs from the active route hierarchy and
 * exposes a `breadcrumbs` signal for template consumption.
 *
 * @remarks
 * Uses `Router` events and a feature map to produce consistent labels and URLs.
 */
export class BreadcrumbComponent
{
	/**
	 * Angular Router for navigation and current URL.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Activated route for inspecting route data when needed.
	 * @type {ActivatedRoute}
	 * @private
	 * @readonly
	 */
	private readonly activatedRoute: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Feature mapping configuration for breadcrumbs.
	 * Maps top-level route segments to a display label and base URL.
	 *
	 * @type {Readonly<Record<string, { label: string; url: string; }>>}
	 * @private
	 */
	private readonly featureMap: Readonly<Record<string, { label: string; url: string; }>> =
		{
			game: { label: "Game", url: "/game" },
			developer: { label: "Developer", url: "/developer" },
			admin: { label: "Admin", url: "/admin" }
		};

	/**
	 * Signal tracking navigation events and producing breadcrumb lists on navigation end.
	 *
	 * @type {Signal<BreadcrumbItem[]>}
	 * @private
	 */
	private readonly navigationEnd: Signal<BreadcrumbItem[]> =
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
	 * Computed breadcrumb items exposed for template consumption.
	 *
	 * @type {Signal<BreadcrumbItem[]>}
	 * @readonly
	 */
	readonly breadcrumbs: Signal<BreadcrumbItem[]> =
		computed(
			() => this.navigationEnd());

	/**
	 * Builds breadcrumb items from current route hierarchy.
	 *
	 * @returns {BreadcrumbItem[]}
	 * Array of breadcrumb items starting with the Home item.
	 * @private
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

		// Special-case: if the first segment is 'login' (may include returnUrl query),
		// display a single Login breadcrumb and avoid parsing returnUrl into crumbs.
		if (urlSegments[0].toLowerCase() === "login")
		{
			breadcrumbs.push(
				{
					label: "Login",
					url: "/login",
					isActive: this.router.url.startsWith("/login")
				});

			return breadcrumbs;
		}

		this.addFeatureBreadcrumb(breadcrumbs, urlSegments[0]);
		this.addSubPageBreadcrumbs(breadcrumbs, urlSegments);

		return breadcrumbs;
	}

	/**
	 * Creates the home breadcrumb item.
	 *
	 * @returns {BreadcrumbItem}
	 * Home breadcrumb item used as the first breadcrumb in the list.
	 * @private
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
	 *
	 * @returns {string[]}
	 * Array of URL segments (excluding empty segments).
	 * @private
	 */
	private getUrlSegments(): string[]
	{
		const currentUrl: string =
			this.router.url ?? "";
		const urlTree: UrlTree =
			this.router.parseUrl(currentUrl);

		const primaryOutlet: UrlSegmentGroup | undefined =
			urlTree.root.children["primary"] as
			| UrlSegmentGroup
			| undefined;

		const primarySegments: UrlSegment[] =
			primaryOutlet?.segments ?? [];

		const segments: string[] =
			primarySegments
				.map(
					(segment) => segment.path)
				.filter(
					(segment) => segment.length > 0);

		return segments;
	}

	/**
	 * Adds feature breadcrumb if the first segment matches a known feature.
	 *
	 * @param {BreadcrumbItem[]} breadcrumbs
	 * Breadcrumb array to modify (will be appended to when a feature match is found).
	 *
	 * @param {string} firstSegment
	 * First URL segment to test against the feature map.
	 *
	 * @returns {void}
	 * @private
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
	 *
	 * @param {BreadcrumbItem[]} breadcrumbs
	 * Breadcrumb array to modify.
	 *
	 * @param {string[]} urlSegments
	 * All URL segments extracted from the current path.
	 *
	 * @returns {void}
	 * @private
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
					(breadcrumb) => breadcrumb.url === url))
			{
				continue;
			}

			// Get label from custom mappings or format the segment
			const label: string =
				this.getSegmentLabel(
					url,
					segment);

			// Skip empty labels
			if (isNullOrEmpty(label))
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
	 *
	 * @param {string} url
	 * The full accumulated URL up to this segment (e.g., '/admin/users').
	 *
	 * @param {string} segment
	 * The segment text from the path (e.g., 'users' or '123').
	 *
	 * @returns {string}
	 * Display label for the segment (custom mapping, 'Details' for numeric ids, or formatted text).
	 * @private
	 */
	private getSegmentLabel(
		url: string,
		segment: string): string
	{
		// Custom labels for specific routes
		const routeLabels: Record<string, string> =
			{
				"/developer/style-guide": "Style Guide",
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
	 * Formats path segment into readable label.
	 *
	 * @param {string} segment
	 * The raw path segment to format (may contain route parameter tokens).
	 *
	 * @returns {string}
	 * Readable label for display in breadcrumbs (Title Case, 'Details' fallback).
	 * @private
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
			.map((word) => capitalize(word))
			.join(" ");
	}
}