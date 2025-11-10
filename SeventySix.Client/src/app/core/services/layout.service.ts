import {
	Injectable,
	signal,
	computed,
	inject,
	PLATFORM_ID
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";

/**
 * Service for managing application layout state
 * Handles sidebar expansion, responsive breakpoints, and layout preferences
 */
@Injectable({
	providedIn: "root"
})
export class LayoutService
{
	private platformId = inject(PLATFORM_ID);
	private breakpointObserver = inject(BreakpointObserver);
	private readonly SIDEBAR_STATE_KEY = "seventysix-sidebar-expanded";

	/**
	 * Sidebar expanded state
	 */
	sidebarExpanded = signal<boolean>(this.getInitialSidebarState());

	/**
	 * Observe responsive breakpoints
	 */
	private breakpoints$ = this.breakpointObserver.observe([
		Breakpoints.Handset,
		Breakpoints.Tablet,
		Breakpoints.Web
	]);

	breakpoints = toSignal(this.breakpoints$, {
		initialValue: { matches: false, breakpoints: {} }
	});

	/**
	 * Computed values for responsive behavior
	 */
	isHandset = computed(() =>
	{
		const bp = this.breakpoints().breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Handset];
	});

	isTablet = computed(() =>
	{
		const bp = this.breakpoints().breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Tablet];
	});

	isWeb = computed(() =>
	{
		const bp = this.breakpoints().breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Web];
	});

	/**
	 * Sidebar mode based on screen size
	 * - Handset/Tablet: 'over' (overlay)
	 * - Web: 'side' (push content)
	 */
	sidebarMode = computed(() =>
	{
		if (this.isHandset() || this.isTablet())
		{
			return "over";
		}
		return "side";
	});

	/**
	 * Whether sidebar should be opened by default
	 */
	sidebarOpened = computed(() =>
	{
		// On mobile/tablet, keep closed by default
		if (this.sidebarMode() === "over")
		{
			return false;
		}
		// On desktop, use expanded state
		return this.sidebarExpanded();
	});

	/**
	 * Toggle sidebar expanded state
	 */
	toggleSidebar(): void
	{
		this.sidebarExpanded.update((expanded) => !expanded);
		this.saveSidebarState(this.sidebarExpanded());
	}

	/**
	 * Set sidebar expanded state
	 */
	setSidebarExpanded(expanded: boolean): void
	{
		this.sidebarExpanded.set(expanded);
		this.saveSidebarState(expanded);
	}

	/**
	 * Close sidebar (useful for mobile after navigation)
	 */
	closeSidebar(): void
	{
		this.sidebarExpanded.set(false);
		this.saveSidebarState(false);
	}

	/**
	 * Open sidebar
	 */
	openSidebar(): void
	{
		this.sidebarExpanded.set(true);
		this.saveSidebarState(true);
	}

	/**
	 * Get initial sidebar state from localStorage
	 */
	private getInitialSidebarState(): boolean
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return true; // Default to expanded for SSR
		}

		const saved = localStorage.getItem(this.SIDEBAR_STATE_KEY);
		return saved === "true" || saved === null; // Default to true if not set
	}

	/**
	 * Save sidebar state to localStorage
	 */
	private saveSidebarState(expanded: boolean): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return;
		}

		localStorage.setItem(this.SIDEBAR_STATE_KEY, expanded.toString());
	}
}
