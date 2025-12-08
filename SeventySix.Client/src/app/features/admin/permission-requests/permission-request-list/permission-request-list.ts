import {
	Component,
	inject,
	ChangeDetectionStrategy,
	Signal,
	computed
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequest } from "@admin/permission-requests/models";
import { DataTableComponent, PageHeaderComponent } from "@shared/components";
import type {
	TableColumn,
	RowAction,
	BulkAction,
	RowActionEvent,
	BulkActionEvent
} from "@shared/models";

/**
 * Permission request list page.
 * Displays all permission requests with approve/reject actions.
 */
@Component({
	selector: "app-permission-request-list-page",
	imports: [PageHeaderComponent, DataTableComponent],
	providers: [DatePipe],
	templateUrl: "./permission-request-list.html",
	styleUrl: "./permission-request-list.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionRequestListPage
{
	private readonly service: PermissionRequestService = inject(
		PermissionRequestService
	);
	private readonly datePipe: DatePipe = inject(DatePipe);

	readonly requestsQuery: ReturnType<
		PermissionRequestService["getAllRequests"]
	> = this.service.getAllRequests();

	// Mutations
	private readonly approveMutation: ReturnType<
		PermissionRequestService["approveRequest"]
	> = this.service.approveRequest();
	private readonly rejectMutation: ReturnType<
		PermissionRequestService["rejectRequest"]
	> = this.service.rejectRequest();
	private readonly bulkApproveMutation: ReturnType<
		PermissionRequestService["bulkApproveRequests"]
	> = this.service.bulkApproveRequests();
	private readonly bulkRejectMutation: ReturnType<
		PermissionRequestService["bulkRejectRequests"]
	> = this.service.bulkRejectRequests();

	readonly requests: Signal<PermissionRequest[]> = computed(
		() => this.requestsQuery.data() ?? []
	);

	readonly isLoading: Signal<boolean> = computed(() =>
		this.requestsQuery.isLoading());

	readonly error: Signal<string | null> = computed(() =>
		this.requestsQuery.error()
			? "Failed to load permission requests."
			: null);

	// DataTable pagination (simple mode - show all items)
	readonly totalCount: Signal<number> = computed(
		() => this.requests().length
	);
	readonly pageIndex: number = 0;
	readonly pageSize: number = 100;

	// Column definitions
	readonly columns: TableColumn<PermissionRequest>[] = [
		{
			key: "username",
			label: "User",
			type: "text",
			sortable: true,
			visible: true
		},
		{
			key: "requestedRole",
			label: "Role",
			type: "text",
			sortable: true,
			visible: true
		},
		{
			key: "requestMessage",
			label: "Message",
			type: "text",
			sortable: false,
			visible: true,
			formatter: (value: unknown): string =>
				(value as string | null) ?? "-"
		},
		{
			key: "createdBy",
			label: "Requested By",
			type: "text",
			sortable: true,
			visible: true
		},
		{
			key: "createDate",
			label: "Date",
			type: "date",
			sortable: true,
			visible: true,
			formatter: (value: unknown): string =>
				this.datePipe.transform(value as string, "short") ?? ""
		}
	];

	// Row actions
	readonly rowActions: RowAction<PermissionRequest>[] = [
		{
			key: "approve",
			label: "Approve",
			icon: "check_circle",
			color: "primary"
		},
		{
			key: "reject",
			label: "Reject",
			icon: "cancel",
			color: "warn"
		}
	];

	// Bulk actions
	readonly bulkActions: BulkAction[] = [
		{
			key: "approve-all",
			label: "Approve Selected",
			icon: "check_circle",
			color: "primary",
			requiresSelection: true
		},
		{
			key: "reject-all",
			label: "Reject Selected",
			icon: "cancel",
			color: "warn",
			requiresSelection: true
		}
	];

	onRefresh(): void
	{
		void this.requestsQuery.refetch();
	}

	onRowAction(event: RowActionEvent<PermissionRequest>): void
	{
		const requestId: number = event.row.id;

		if (event.action === "approve")
		{
			this.approveMutation.mutate(requestId);
		}
		else if (event.action === "reject")
		{
			this.rejectMutation.mutate(requestId);
		}
	}

	onBulkAction(event: BulkActionEvent<PermissionRequest>): void
	{
		const selectedIds: number[] = event.selectedIds;

		if (event.action === "approve-all")
		{
			this.bulkApproveMutation.mutate(selectedIds);
		}
		else if (event.action === "reject-all")
		{
			this.bulkRejectMutation.mutate(selectedIds);
		}
	}
}
