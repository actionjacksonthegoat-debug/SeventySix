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
import { DatePipe } from "@angular/common";

/**
 * User list component.
 * Displays list of users with loading and error states.
 * Follows OnPush change detection for performance.
 * Uses signals for reactive state management.
 */
@Component({
	selector: "app-user-list",
	imports: [DatePipe],
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
	readonly activeUserCount = computed(
		() => this.users().filter((u) => u.isActive).length
	);
	readonly inactiveUserCount = computed(
		() => this.users().filter((u) => !u.isActive).length
	);

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
				this.error.set("Failed to load users. Please try again.");
				this.isLoading.set(false);
				this.logger.error("Failed to load users", err);
			}
		});
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
	 * @param _index The item index
	 * @param user The user object
	 * @returns The user ID for tracking
	 */
	trackById(_index: number, user: User): number
	{
		return user.id;
	}

	/**
	 * Gets the status badge class for a user.
	 * @param user The user object
	 * @returns CSS class for status badge
	 */
	getStatusClass(user: User): string
	{
		return user.isActive ? "status-active" : "status-inactive";
	}

	/**
	 * Gets the status text for a user.
	 * @param user The user object
	 * @returns Status text
	 */
	getStatusText(user: User): string
	{
		return user.isActive ? "Active" : "Inactive";
	}

	/**
	 * Handles user row click.
	 * Navigates to user detail/edit page.
	 * @param user The user that was clicked
	 */
	onUserClick(user: User): void
	{
		this.router.navigate(["/users", user.id]);
		this.logger.info("Navigating to user detail", { userId: user.id });
	}
}
