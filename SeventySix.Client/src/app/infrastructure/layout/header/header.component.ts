import {
	Component,
	ChangeDetectionStrategy,
	inject,
	computed,
	Signal
} from "@angular/core";
import { Router } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import {
	ThemeService,
	LayoutService,
	AuthService
} from "@infrastructure/services";
import { AuthUser } from "@infrastructure/models";
import { BreadcrumbComponent } from "@shared/components";

/**
 * Application header component
 * Displays logo, navigation, search, user menu, and theme toggles
 */
@Component({
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
export class HeaderComponent
{
	protected readonly themeService: ThemeService = inject(ThemeService);
	protected readonly layoutService: LayoutService = inject(LayoutService);
	protected readonly authService: AuthService = inject(AuthService);
	private readonly router: Router = inject(Router);

	/** Display name: fullName if available, otherwise username. */
	protected readonly displayName: Signal<string> = computed(() =>
	{
		const user: AuthUser | null = this.authService.user();
		if (!user)
		{
			return "";
		}
		return user.fullName || user.username;
	});

	toggleSidebar(): void
	{
		this.layoutService.toggleSidebar();
	}

	toggleBrightness(): void
	{
		this.themeService.toggleBrightness();
	}

	toggleColorScheme(): void
	{
		this.themeService.toggleColorScheme();
	}

	navigateToLogin(): void
	{
		this.router.navigate(["/auth/login"]);
	}

	navigateToRegister(): void
	{
		this.router.navigate(["/auth/register"]);
	}

	navigateToProfile(): void
	{
		const user: AuthUser | null = this.authService.user();
		if (user)
		{
			// Admins go to /admin/users/:id, regular users go to /user/:id
			const basePath: string = this.authService.hasAnyRole("Admin")
				? "/admin/users"
				: "/user";
			this.router.navigate([basePath, user.id]);
		}
	}

	logout(): void
	{
		this.authService.logout();
	}
}
