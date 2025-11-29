/**
 * Login page with local and OAuth options.
 * Most of the app works without login (guest access).
 */

import {
	Component,
	inject,
	signal,
	WritableSignal,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import {
	LoginCredentials,
	AuthResponse
} from "@infrastructure/models/auth.model";

@Component({
	selector: "app-login",
	standalone: true,
	imports: [FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit
{
	private readonly authService: AuthService = inject(AuthService);
	private readonly router: Router = inject(Router);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);
	private readonly notification: NotificationService =
		inject(NotificationService);

	protected usernameOrEmail: string = "";
	protected password: string = "";
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	private returnUrl: string = "/";

	ngOnInit(): void
	{
		this.returnUrl = this.route.snapshot.queryParams["returnUrl"] ?? "/";

		// Redirect if already authenticated
		if (this.authService.isAuthenticated())
		{
			this.router.navigateByUrl(this.returnUrl);
		}
	}

	protected onLocalLogin(): void
	{
		if (!this.usernameOrEmail || !this.password)
		{
			this.notification.error("Please enter username and password.");
			return;
		}

		this.isLoading.set(true);

		const credentials: LoginCredentials = {
			usernameOrEmail: this.usernameOrEmail,
			password: this.password
		};

		this.authService.login(credentials).subscribe({
			next: (response: AuthResponse) =>
			{
				if (response.requiresPasswordChange)
				{
					// Redirect to password change page
					this.notification.info(
						"You must change your password before continuing."
					);
					this.router.navigate(["/auth/change-password"], {
						queryParams: {
							required: "true",
							returnUrl: this.returnUrl
						}
					});
				}
				else
				{
					this.router.navigateByUrl(this.returnUrl);
				}
			},
			error: () =>
			{
				this.notification.error("Invalid username or password.");
				this.isLoading.set(false);
			}
		});
	}

	protected onGitHubLogin(): void
	{
		this.isLoading.set(true);
		this.authService.loginWithProvider("github", this.returnUrl);
	}
}
