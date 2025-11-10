import {
	Component,
	signal,
	computed,
	ChangeDetectionStrategy
} from "@angular/core";
import { UserList } from "@shared/components/user-list/user-list";

/**
 * Users page component.
 * Smart container for user management functionality.
 * Provides page layout and hosts the UserList component.
 * Follows Smart/Presentational component pattern for separation of concerns.
 */
@Component({
	selector: "app-users-page",
	imports: [UserList],
	templateUrl: "./users-page.html",
	styleUrls: ["./users-page.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage
{
	// Page-level state
	readonly pageTitle = signal<string>("User Management");
	readonly showHeaderActions = signal<boolean>(true);

	// Computed values for page metadata
	readonly breadcrumbs = computed(() => [
		{ label: "Home", route: "/" },
		{ label: "Users", route: "/users" }
	]);

	/**
	 * Initializes the users page.
	 * Component initialization logic can be added here for future enhancements.
	 */
	constructor()
	{
		// Future: Page-level initialization
		// Could add analytics tracking, permission checks, etc.
	}
}
