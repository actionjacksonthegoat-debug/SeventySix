import { ComponentFixture } from "@angular/core/testing";
import { PermissionRequestListPage } from "./permission-request-list";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestDto } from "@admin/permission-requests/models";
import type { RowActionEvent } from "@shared/models";
import { ComponentTestBed } from "@testing/test-bed-builders";

describe("PermissionRequestListPage", () =>
{
	let fixture: ComponentFixture<PermissionRequestListPage>;
	let component: PermissionRequestListPage;

	const mockPermissionRequests: PermissionRequestDto[] = [
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

	const mockApproveMutation: { mutate: jasmine.Spy } = {
		mutate: jasmine.createSpy("approveMutate")
	};

	const mockRejectMutation: { mutate: jasmine.Spy } = {
		mutate: jasmine.createSpy("rejectMutate")
	};

	const mockBulkApproveMutation: { mutate: jasmine.Spy } = {
		mutate: jasmine.createSpy("bulkApproveMutate")
	};

	const mockBulkRejectMutation: { mutate: jasmine.Spy } = {
		mutate: jasmine.createSpy("bulkRejectMutate")
	};

	const mockService: Partial<PermissionRequestService> = {
		getAllRequests: jasmine.createSpy("getAllRequests").and.returnValue({
			data: () => mockPermissionRequests,
			isLoading: () => false,
			error: () => null,
			isSuccess: () => true,
			refetch: jasmine.createSpy("refetch")
		}),
		approveRequest: jasmine
			.createSpy("approveRequest")
			.and.returnValue(mockApproveMutation),
		rejectRequest: jasmine
			.createSpy("rejectRequest")
			.and.returnValue(mockRejectMutation),
		bulkApproveRequests: jasmine
			.createSpy("bulkApproveRequests")
			.and.returnValue(mockBulkApproveMutation),
		bulkRejectRequests: jasmine
			.createSpy("bulkRejectRequests")
			.and.returnValue(mockBulkRejectMutation)
	};

	beforeEach(async () =>
	{
		mockApproveMutation.mutate.calls.reset();
		mockRejectMutation.mutate.calls.reset();
		mockBulkApproveMutation.mutate.calls.reset();
		mockBulkRejectMutation.mutate.calls.reset();

		fixture =
			await new ComponentTestBed<PermissionRequestListPage>()
				.withAdminDefaults()
				.withProvider({
					provide: PermissionRequestService,
					useValue: mockService
				})
				.build(PermissionRequestListPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should render page header", () =>
	{
		const header: HTMLElement | null =
			fixture.nativeElement.querySelector("app-page-header");
		expect(header).toBeTruthy();
	});

	it("should render data table", () =>
	{
		const dataTable: HTMLElement | null =
			fixture.nativeElement.querySelector("app-data-table");
		expect(dataTable).toBeTruthy();
	});

	it("should call approve mutation on row action approve", () =>
	{
		const event: RowActionEvent<PermissionRequestDto> = {
			action: "approve",
			row: mockPermissionRequests[0]
		};

		component.onRowAction(event);

		expect(mockApproveMutation.mutate).toHaveBeenCalledWith(1);
	});

	it("should call reject mutation on row action reject", () =>
	{
		const event: RowActionEvent<PermissionRequestDto> = {
			action: "reject",
			row: mockPermissionRequests[0]
		};

		component.onRowAction(event);

		expect(mockRejectMutation.mutate).toHaveBeenCalledWith(1);
	});
});
