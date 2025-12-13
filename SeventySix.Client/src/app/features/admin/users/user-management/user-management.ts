import { UserList } from "@admin/users/components/user-list/user-list";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";

/**
 * User management page.
 * Smart container for user management functionality.
 * Provides page layout and hosts the UserList component.
 */
@Component({
	selector: "app-user-management-page",
	imports: [
		RouterLink,
		MatIconModule,
		MatButtonModule,
		UserList,
		PageHeaderComponent
	],
	templateUrl: "./user-management.html",
	styleUrl: "./user-management.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementPage
{}
