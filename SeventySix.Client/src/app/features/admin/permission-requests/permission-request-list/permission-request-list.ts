import {
	Component,
	inject,
	ChangeDetectionStrategy,
	Signal,
	computed
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequest } from "@admin/permission-requests/models";
import { PageHeaderComponent } from "@shared/components";

/**
 * Permission request list page.
 * Displays all permission requests in a table sorted by date.
 */
@Component({
	selector: "app-permission-request-list-page",
	imports: [
		DatePipe,
		MatTableModule,
		MatCardModule,
		MatProgressSpinnerModule,
		PageHeaderComponent
	],
	templateUrl: "./permission-request-list.html",
	styleUrl: "./permission-request-list.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionRequestListPage
{
	private readonly service: PermissionRequestService =
		inject(PermissionRequestService);

	readonly requestsQuery: ReturnType<
		PermissionRequestService["getAllRequests"]
	> =
		this.service.getAllRequests();

	readonly requests: Signal<PermissionRequest[]> = computed(
		() => this.requestsQuery.data() ?? []
	);

	readonly isLoading: Signal<boolean> = computed(() =>
		this.requestsQuery.isLoading()
	);

	readonly error: Signal<string | null> = computed(() =>
		this.requestsQuery.error()
			? "Failed to load permission requests."
			: null
	);

	readonly displayedColumns: string[] = [
		"username",
		"requestedRole",
		"requestMessage",
		"createdBy",
		"createDate"
	];
}
