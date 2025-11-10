import { Component, ChangeDetectionStrategy } from "@angular/core";
import { UserList } from "@shared/components/user-list/user-list";

/**
 * Users page container component.
 * Smart component that displays the user list.
 * Follows Smart/Presentational component pattern.
 */
@Component({
	selector: "app-users-page",
	imports: [UserList],
	template: `<app-user-list></app-user-list>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage
{}
