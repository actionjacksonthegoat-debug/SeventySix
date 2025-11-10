import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { UserList } from "../components/user-list/user-list";

/**
 * Users page component.
 * Smart container for user management functionality.
 * Provides page layout and hosts the UserList component.
 * Follows Smart/Presentational component pattern for separation of concerns.
 */
@Component({
	selector: "app-users-page",
	imports: [RouterLink, MatIconModule, MatButtonModule, UserList],
	templateUrl: "./users-page.html",
	styleUrls: ["./users-page.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage
{
	// Page-level state
	readonly pageTitle = signal<string>("User Management");
}
