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
import { UserProfileDto } from "@infrastructure/api";
import {
	AuthService,
	LayoutService,
	ThemeService
} from "@infrastructure/services";
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
	protected readonly themeService: ThemeService =
		inject(ThemeService);
	protected readonly layoutService: LayoutService =
		inject(LayoutService);
	protected readonly authService: AuthService =
		inject(AuthService);
	private readonly router: Router =
		inject(Router);

	/** Display name: fullName if available, otherwise username. */
	protected readonly displayName: Signal<string> =
		computed(() =>
	{
		const user: UserProfileDto | null =
			this.authService.user();
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

	navigateToAccount(): void
	{
		this.router.navigate(["/account"]);
	}

	logout(): void
	{
		this.authService.logout();
	}
}
