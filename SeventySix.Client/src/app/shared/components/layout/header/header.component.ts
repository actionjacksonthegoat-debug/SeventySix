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
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import { BreadcrumbComponent } from "@shared/components";
import { APP_ROUTES } from "@shared/constants";
import { UserProfileDto } from "@shared/models";
import {
	AuthService,
	LayoutService,
	ThemeService
} from "@shared/services";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

@Component(
	{
		selector: "app-header",
		imports: [
			MatToolbarModule,
			MatButtonModule,
			MatIconModule,
			MatTooltipModule,
			MatMenuModule,
			MatDividerModule,
			BreadcrumbComponent
		],
		templateUrl: "./header.component.html",
		styleUrl: "./header.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Application header component.
 *
 * Displays logo, breadcrumb/navigation, and user controls including
 * theme toggles and account actions. Shows the current user's display name.
 *
 * @remarks
 * Place `<app-header>` in the application shell to provide consistent
 * top-level navigation and user actions.
 */
export class HeaderComponent
{
	/**
	 * Theme service to toggle brightness and color schemes.
	 * @type {ThemeService}
	 * @protected
	 * @readonly
	 */
	protected readonly themeService: ThemeService =
		inject(ThemeService);

	/**
	 * Layout service for sidebar state and responsive helpers.
	 * @type {LayoutService}
	 * @protected
	 * @readonly
	 */
	protected readonly layoutService: LayoutService =
		inject(LayoutService);

	/**
	 * Authentication service for user state and logout.
	 * @type {AuthService}
	 * @protected
	 * @readonly
	 */
	protected readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Angular Router for navigation actions.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Display name: fullName if available, otherwise username.
	 * @type {Signal<string>}
	 * @protected
	 */
	protected readonly displayName: Signal<string> =
		computed(
			() =>
			{
				const user: UserProfileDto | null =
					this.authService.user();
				if (isNullOrUndefined(user))
				{
					return "";
				}
				return user.fullName ?? user.username;
			});

	/**
	 * Toggle the sidebar expanded state.
	 * @returns {void}
	 */
	toggleSidebar(): void
	{
		this.layoutService.toggleSidebar();
	}

	/**
	 * Toggle between light and dark brightness modes.
	 * @returns {void}
	 */
	toggleBrightness(): void
	{
		this.themeService.toggleBrightness();
	}

	/**
	 * Toggle between available color schemes.
	 * @returns {void}
	 */
	toggleColorScheme(): void
	{
		this.themeService.toggleColorScheme();
	}

	/**
	 * Navigate to the login page.
	 * @returns {void}
	 */
	navigateToLogin(): void
	{
		this.router.navigate(
			[APP_ROUTES.AUTH.LOGIN]);
	}

	/**
	 * Navigate to the registration page.
	 * @returns {void}
	 */
	navigateToRegister(): void
	{
		this.router.navigate(
			[APP_ROUTES.AUTH.REGISTER]);
	}

	/**
	 * Navigate to the account page for the current user.
	 * @returns {void}
	 */
	navigateToAccount(): void
	{
		this.router.navigate(
			[APP_ROUTES.ACCOUNT.PROFILE]);
	}

	/**
	 * Log the current user out.
	 * @returns {void}
	 */
	logout(): void
	{
		this.authService.logout();
	}
}