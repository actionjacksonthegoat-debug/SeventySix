import { PermissionRequestDto } from "@admin/permission-requests/models";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { ComponentFixture } from "@angular/core/testing";
import type { BulkActionEvent, RowActionEvent } from "@shared/models";
import { NotificationService } from "@shared/services";
import { createMockNotificationService, MockNotificationService } from "@shared/testing";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { Mock, vi } from "vitest";
import { PermissionRequestListPage } from "./permission-request-list";

describe("PermissionRequestListPage",
	() =>
	{
		let fixture: ComponentFixture<PermissionRequestListPage>;
		let component: PermissionRequestListPage;
		let mockNotificationService: MockNotificationService;

		const mockPermissionRequests: PermissionRequestDto[] =
			[
				{
					id: 1,
					userId: 10,
					username: "testuser",
					requestedRole: "Developer",
					requestMessage: "Need access",
					createDate: "2024-01-01T00:00:00Z",
					createdBy: "testuser"
				}
			];

		const mockApproveMutation: { mutate: Mock; } =
			{
				mutate: vi.fn()
			};

		const mockRejectMutation: { mutate: Mock; } =
			{
				mutate: vi.fn()
			};

		const mockBulkApproveMutation: { mutate: Mock; } =
			{
				mutate: vi.fn()
			};

		const mockBulkRejectMutation: { mutate: Mock; } =
			{
				mutate: vi.fn()
			};

		const mockService: Partial<PermissionRequestService> =
			{
				getAllRequests: vi
					.fn()
					.mockReturnValue(
						{
							data: () => mockPermissionRequests,
							isLoading: () => false,
							error: () => null,
							isSuccess: () => true,
							refetch: vi.fn()
						}),
				approveRequest: vi
					.fn()
					.mockReturnValue(mockApproveMutation),
				rejectRequest: vi
					.fn()
					.mockReturnValue(mockRejectMutation),
				bulkApproveRequests: vi
					.fn()
					.mockReturnValue(mockBulkApproveMutation),
				bulkRejectRequests: vi
					.fn()
					.mockReturnValue(mockBulkRejectMutation)
			};

		beforeEach(
			async () =>
			{
				mockNotificationService =
					createMockNotificationService();

				mockApproveMutation.mutate.mockClear();
				mockRejectMutation.mutate.mockClear();
				mockBulkApproveMutation.mutate.mockClear();
				mockBulkRejectMutation.mutate.mockClear();

				fixture =
					await new ComponentTestBed<PermissionRequestListPage>()
						.withAdminDefaults()
						.withProvider(
							{
								provide: PermissionRequestService,
								useValue: mockService
							})
						.withProvider(
							{
								provide: NotificationService,
								useValue: mockNotificationService
							})
						.build(PermissionRequestListPage);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should render page header",
			() =>
			{
				const header: HTMLElement | null =
					fixture.nativeElement.querySelector("app-page-header");
				expect(header)
					.toBeTruthy();
			});

		it("should render data table",
			() =>
			{
				const dataTable: HTMLElement | null =
					fixture.nativeElement.querySelector("app-data-table");
				expect(dataTable)
					.toBeTruthy();
			});

		it("should call approve mutation on row action approve",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "approve",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				expect(mockApproveMutation.mutate)
					.toHaveBeenCalledWith(1, expect.any(Object));
			});

		it("should call reject mutation on row action reject",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "reject",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				expect(mockRejectMutation.mutate)
					.toHaveBeenCalledWith(1, expect.any(Object));
			});

		it("should show success notification when approve succeeds",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "approve",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				const mutateCall: Mock =
					mockApproveMutation.mutate;
				const callbackArg: { onSuccess: () => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onSuccess();

				expect(mockNotificationService.success)
					.toHaveBeenCalledWith("Request approved");
			});

		it("should show error notification when approve fails",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "approve",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				const mutateCall: Mock =
					mockApproveMutation.mutate;
				const callbackArg: { onError: (error: Error) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onError(new Error("Network failure"));

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith("Failed to approve request: Network failure");
			});

		it("should show success notification when reject succeeds",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "reject",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				const mutateCall: Mock =
					mockRejectMutation.mutate;
				const callbackArg: { onSuccess: () => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onSuccess();

				expect(mockNotificationService.success)
					.toHaveBeenCalledWith("Request rejected");
			});

		it("should show error notification when reject fails",
			() =>
			{
				const event: RowActionEvent<PermissionRequestDto> =
					{
						action: "reject",
						row: mockPermissionRequests[0]
					};

				component.onRowAction(event);

				const mutateCall: Mock =
					mockRejectMutation.mutate;
				const callbackArg: { onError: (error: Error) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onError(new Error("Database error"));

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith("Failed to reject request: Database error");
			});

		it("should show success notification with count when bulk approve succeeds",
			() =>
			{
				const event: BulkActionEvent<PermissionRequestDto> =
					{
						action: "approve-all",
						selectedRows: [],
						selectedIds: [1, 2, 3]
					};

				component.onBulkAction(event);

				const mutateCall: Mock =
					mockBulkApproveMutation.mutate;
				const callbackArg: { onSuccess: (count: number) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onSuccess(3);

				expect(mockNotificationService.success)
					.toHaveBeenCalledWith("3 requests approved");
			});

		it("should show error notification when bulk approve fails",
			() =>
			{
				const event: BulkActionEvent<PermissionRequestDto> =
					{
						action: "approve-all",
						selectedRows: [],
						selectedIds: [1, 2, 3]
					};

				component.onBulkAction(event);

				const mutateCall: Mock =
					mockBulkApproveMutation.mutate;
				const callbackArg: { onError: (error: Error) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onError(new Error("Permission denied"));

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith("Failed to approve requests: Permission denied");
			});

		it("should show success notification with count when bulk reject succeeds",
			() =>
			{
				const event: BulkActionEvent<PermissionRequestDto> =
					{
						action: "reject-all",
						selectedRows: [],
						selectedIds: [1, 2]
					};

				component.onBulkAction(event);

				const mutateCall: Mock =
					mockBulkRejectMutation.mutate;
				const callbackArg: { onSuccess: (count: number) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onSuccess(2);

				expect(mockNotificationService.success)
					.toHaveBeenCalledWith("2 requests rejected");
			});

		it("should show error notification when bulk reject fails",
			() =>
			{
				const event: BulkActionEvent<PermissionRequestDto> =
					{
						action: "reject-all",
						selectedRows: [],
						selectedIds: [1, 2]
					};

				component.onBulkAction(event);

				const mutateCall: Mock =
					mockBulkRejectMutation.mutate;
				const callbackArg: { onError: (error: Error) => void; } =
					mutateCall.mock.calls.at(-1)![1];
				callbackArg.onError(new Error("Timeout"));

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith("Failed to reject requests: Timeout");
			});
	});
