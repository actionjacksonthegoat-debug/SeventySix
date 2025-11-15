import {
	Component,
	signal,
	WritableSignal,
	ChangeDetectionStrategy
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { UserList } from "@admin/users/components/user-list/user-list";

/**
 * Users component.
 * Smart container for user management functionality.
 * Provides page layout and hosts the UserList component.
 * Follows Smart/Presentational component pattern for separation of concerns.
 */
@Component({
	selector: "app-users",
	imports: [RouterLink, MatIconModule, MatButtonModule, UserList],
	templateUrl: "./users.component.html",
	styleUrls: ["./users.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent
{
	// Page-level state
	readonly pageTitle: WritableSignal<string> =
		signal<string>("User Management");
}
