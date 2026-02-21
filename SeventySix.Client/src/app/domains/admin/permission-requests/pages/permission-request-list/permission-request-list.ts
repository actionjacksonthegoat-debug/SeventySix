import { PermissionRequestDto } from "@admin/permission-requests/models";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { DataTableComponent, PageHeaderComponent } from "@shared/components";
import type {
	BulkAction,
	BulkActionEvent,
	RowAction,
	RowActionEvent,
	TableColumn
} from "@shared/models";
import { NotificationService } from "@shared/services";

/**
 * Permission request list page.
 * Displays all permission requests with approve/reject actions.
 */
@Component(
	{
		selector: "app-permission-request-list-page",
		imports: [PageHeaderComponent, DataTableComponent],
		providers: [DatePipe],
		templateUrl: "./permission-request-list.html",
		styleUrl: "./permission-request-list.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class PermissionRequestListPage
{
	/**
	 * Service for fetching and mutating permission requests.
	 * @type {PermissionRequestService}
	 * @private
	 * @readonly
	 */
	private readonly service: PermissionRequestService =
		inject(PermissionRequestService);

	/**
	 * Angular DatePipe for formatting dates in the table.
	 * @type {DatePipe}
	 * @private
	 * @readonly
	 */
	private readonly datePipe: DatePipe =
		inject(DatePipe);

	/**
	 * Notification service for user-visible messages.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Query for permission requests (contains data/isLoading/error flags).
	 * @type {ReturnType<PermissionRequestService["getAllRequests"]>}
	 */
	readonly requestsQuery: ReturnType<
		PermissionRequestService["getAllRequests"]> =
		this.service.getAllRequests();

	// Mutations
	/**
	 * Mutation for approving a single permission request.
	 * @type {ReturnType<PermissionRequestService["approveRequest"]>}
	 * @private
	 */
	private readonly approveMutation: ReturnType<
		PermissionRequestService["approveRequest"]> =
		this.service.approveRequest();

	/**
	 * Mutation for rejecting a single permission request.
	 * @type {ReturnType<PermissionRequestService["rejectRequest"]>}
	 * @private
	 */
	private readonly rejectMutation: ReturnType<
		PermissionRequestService["rejectRequest"]> =
		this.service.rejectRequest();

	/**
	 * Mutation for bulk approving selected requests.
	 * @type {ReturnType<PermissionRequestService["bulkApproveRequests"]>}
	 * @private
	 */
	private readonly bulkApproveMutation: ReturnType<
		PermissionRequestService["bulkApproveRequests"]> =
		this.service.bulkApproveRequests();

	/**
	 * Mutation for bulk rejecting selected requests.
	 * @type {ReturnType<PermissionRequestService["bulkRejectRequests"]>}
	 * @private
	 */
	private readonly bulkRejectMutation: ReturnType<
		PermissionRequestService["bulkRejectRequests"]> =
		this.service.bulkRejectRequests();

	/**
	 * Computed list of permission requests for display.
	 * @type {Signal<PermissionRequestDto[]>}
	 */
	readonly requests: Signal<PermissionRequestDto[]> =
		computed(
			() => this.requestsQuery.data() ?? []);

	/**
	 * Loading indicator for requests query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.requestsQuery.isLoading());

	/**
	 * Error message for failed requests fetch.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
				this.requestsQuery.error()
					? "Failed to load permission requests."
					: null);

	/**
	 * Number of requests (used for simple pagination in the table).
	 * @type {Signal<number>}
	 */
	readonly totalCount: Signal<number> =
		computed(
			() => this.requests().length);
	readonly pageIndex: number = 0;
	readonly pageSize: number = 100;

	// Column definitions
	/**
	 * Column definitions for permission requests table.
	 * @type {TableColumn<PermissionRequestDto>[]}
	 */
	readonly columns: TableColumn<PermissionRequestDto>[] =
		[
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
	/**
	 * Row-level actions for permission requests (approve/reject).
	 * @type {RowAction<PermissionRequestDto>[]}
	 */
	readonly rowActions: RowAction<PermissionRequestDto>[] =
		[
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
	/**
	 * Bulk action definitions for permission requests (approve/reject selected).
	 * @type {BulkAction[]}
	 */
	readonly bulkActions: BulkAction[] =
		[
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

	/**
	 * Refresh the permission requests query from the server.
	 * @returns {void}
	 */
	onRefresh(): void
	{
		void this.requestsQuery.refetch();
	}

	/**
	 * Handle a row-level action for a permission request (approve/reject).
	 * @param {RowActionEvent<PermissionRequestDto>} event
	 * The row action event payload.
	 * @returns {void}
	 */
	onRowAction(event: RowActionEvent<PermissionRequestDto>): void
	{
		const requestId: number =
			event.row.id;

		if (event.action === "approve")
		{
			this.approveMutation.mutate(requestId,
				{
					onSuccess: () =>
					{
						this.notificationService.success("Request approved");
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to approve request: ${error.message}`);
					}
				});
		}
		else if (event.action === "reject")
		{
			this.rejectMutation.mutate(requestId,
				{
					onSuccess: () =>
					{
						this.notificationService.success("Request rejected");
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to reject request: ${error.message}`);
					}
				});
		}
	}

	/**
	 * Handle bulk actions (approve-all/reject-all) for selected requests.
	 * @param {BulkActionEvent<PermissionRequestDto>} event
	 * The bulk action event payload containing selected IDs.
	 * @returns {void}
	 */
	onBulkAction(event: BulkActionEvent<PermissionRequestDto>): void
	{
		const selectedIds: number[] =
			event.selectedIds;

		if (event.action === "approve-all")
		{
			this.bulkApproveMutation.mutate(selectedIds,
				{
					onSuccess: (approvedCount: number) =>
					{
						this.notificationService.success(
							`${approvedCount} requests approved`);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to approve requests: ${error.message}`);
					}
				});
		}
		else if (event.action === "reject-all")
		{
			this.bulkRejectMutation.mutate(selectedIds,
				{
					onSuccess: (rejectedCount: number) =>
					{
						this.notificationService.success(
							`${rejectedCount} requests rejected`);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to reject requests: ${error.message}`);
					}
				});
		}
	}
}