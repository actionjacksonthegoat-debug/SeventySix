import {
	Component,
	inject,
	signal,
	computed,
	ChangeDetectionStrategy
} from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "@core/services/user.service";
import { User } from "@core/models/interfaces/user";
import { LoggerService } from "@core/services/logger.service";

/**
 * User list component.
 * Displays table of users with loading and error states.
 * Clickable rows navigate to user detail page.
 * Follows OnPush change detection for performance.
 */
@Component({
	selector: "app-user-list",
	imports: [],
	templateUrl: "./user-list.html",
	styleUrls: ["./user-list.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserList
{
	private readonly userService = inject(UserService);
	private readonly logger = inject(LoggerService);
	private readonly router = inject(Router);

	// State signals
	readonly users = signal<User[]>([]);
	readonly isLoading = signal<boolean>(true);
	readonly error = signal<string | null>(null);

	// Computed signals for derived state
	readonly hasUsers = computed(() => this.users().length > 0);
	readonly userCount = computed(() => this.users().length);

	constructor()
	{
		this.loadUsers();
	}

	/**
	 * Loads users from the service.
	 */
	loadUsers(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.userService.getAllUsers().subscribe({
			next: (data) =>
			{
				this.users.set(data);
				this.isLoading.set(false);
				this.logger.info("Users loaded successfully", {
					count: data.length
				});
			},
			error: (err) =>
			{
				this.error.set(
					"Failed to load users. Please try again."
				);
				this.isLoading.set(false);
				this.logger.error("Failed to load users", err);
			}
		});
	}

	/**
	 * Navigate to user detail page.
	 * @param userId User ID to view
	 */
	viewUser(userId: number): void
	{
		this.router.navigate(["/users", userId]);
	}

	/**
	 * Retries loading users.
	 */
	retry(): void
	{
		this.loadUsers();
	}

	/**
	 * TrackBy function for ngFor performance.
	 */
	trackById(_index: number, user: User): number
	{
		return user.id;
	}
}
