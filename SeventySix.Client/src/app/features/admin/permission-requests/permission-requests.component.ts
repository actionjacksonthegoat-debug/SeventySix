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

/**
 * Admin page for viewing all permission requests.
 * Displays requests in a table sorted by date.
 */
@Component({
	selector: "app-permission-requests",
	imports: [
		DatePipe,
		MatTableModule,
		MatCardModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./permission-requests.component.html",
	styleUrls: ["./permission-requests.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionRequestsComponent
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
