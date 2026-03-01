import { PagedResultOfUserDto, UserDto } from "@admin/users/models";
import {
	UserExportService,
	UserPreferencesService,
	UserService
} from "@admin/users/services";
import { DatePipe } from "@angular/common";
import { WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { Router } from "@angular/router";
import type { CellValue, RowAction } from "@shared/models";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockNotificationService,
	type MockNotificationService
} from "@shared/testing";
import {
	createMockMutationResult,
	createMockQueryResult
} from "@testing/tanstack-query-helpers";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { of } from "rxjs";
import { type Mock, vi } from "vitest";
import { UserList } from "./user-list";

/** Reusable mock user DTO for action handler tests. */
const TEST_USER: UserDto =
	{
		id: 42,
		username: "test_user",
		email: "test@example.com",
		fullName: "Test User",
		createDate: "2024-01-01T00:00:00Z",
		isActive: true,
		createdBy: "admin",
		modifyDate: "2024-01-02T00:00:00Z",
		modifiedBy: "admin",
		lastLoginAt: null,
		isDeleted: false,
		deletedAt: null,
		deletedBy: null
	};

describe("UserList",
	() =>
	{
		let component: UserList;
		let fixture: ComponentFixture<UserList>;

		beforeEach(
			async () =>
			{
				fixture =
					await new ComponentTestBed<UserList>()
						.withAdminDefaults()
						.withRealService(UserService)
						.withRealService(UserExportService)
						.withRealService(UserPreferencesService)
						.withRealService(DatePipe)
						.build(UserList);

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

		it("should define column configuration",
			() =>
			{
				expect(component.columns)
					.toBeDefined();
				expect(component.columns.length)
					.toBe(7);
				expect(component.columns[0].key)
					.toBe("id");
			});

		it("should define quick filters",
			() =>
			{
				expect(component.quickFilters)
					.toBeDefined();
				expect(component.quickFilters.length)
					.toBe(4);
				expect(component.quickFilters[0].key)
					.toBe("all");
			});

		it("should define row actions",
			() =>
			{
				expect(component.rowActions)
					.toBeDefined();
				expect(component.rowActions.length)
					.toBe(5);
			});

		it("should include resetPassword in row actions",
			() =>
			{
				const resetPasswordAction: { key: string; label: string; icon: string; } | undefined =
					component
						.rowActions
						.find(
							(action) =>
								action.key === "resetPassword");
				expect(resetPasswordAction)
					.toBeTruthy();
				expect(resetPasswordAction?.label)
					.toBe("Reset Password");
				expect(resetPasswordAction?.icon)
					.toBe("lock_reset");
			});

		describe("column formatters",
			() =>
			{
				describe("isActive formatter",
					() =>
					{
						let formatter: ((value: CellValue, row?: UserDto) => string) | undefined;

						beforeEach(
							() =>
							{
								formatter =
									component
										.columns
										.find(
											(col) => col.key === "isActive")
										?.formatter;
							});

						it("should return 'Deleted' when row is deleted",
							() =>
							{
								const deletedUser: Partial<UserDto> =
									{ isDeleted: true };
								expect(formatter?.(true, deletedUser as UserDto))
									.toBe("Deleted");
							});

						it("should return 'Active' for active non-deleted user",
							() =>
							{
								const activeUser: Partial<UserDto> =
									{ isDeleted: false };
								expect(formatter?.(true, activeUser as UserDto))
									.toBe("Active");
							});

						it("should return 'Inactive' for inactive non-deleted user",
							() =>
							{
								const inactiveUser: Partial<UserDto> =
									{ isDeleted: false };
								expect(formatter?.(false, inactiveUser as UserDto))
									.toBe("Inactive");
							});
					});

				describe("isActive badgeColor",
					() =>
					{
						let badgeColor: ((value: CellValue, row?: UserDto) => "primary" | "accent" | "warn") | undefined;

						beforeEach(
							() =>
							{
								badgeColor =
									component
										.columns
										.find(
											(col) => col.key === "isActive")
										?.badgeColor;
							});

						it("should return 'warn' when row is deleted",
							() =>
							{
								const deletedUser: Partial<UserDto> =
									{ isDeleted: true };
								expect(badgeColor?.(true, deletedUser as UserDto))
									.toBe("warn");
							});

						it("should return 'primary' for active non-deleted user",
							() =>
							{
								const activeUser: Partial<UserDto> =
									{ isDeleted: false };
								expect(badgeColor?.(true, activeUser as UserDto))
									.toBe("primary");
							});

						it("should return 'accent' for inactive non-deleted user",
							() =>
							{
								const inactiveUser: Partial<UserDto> =
									{ isDeleted: false };
								expect(badgeColor?.(false, inactiveUser as UserDto))
									.toBe("accent");
							});
					});

				describe("lastLoginAt formatter",
					() =>
					{
						let lastLoginFormatter: ((value: CellValue) => string) | undefined;

						beforeEach(
							() =>
							{
								lastLoginFormatter =
									component
										.columns
										.find(
											(col) => col.key === "lastLoginAt")
										?.formatter;
							});

						it("should return 'Never' when value is null",
							() =>
							{
								expect(lastLoginFormatter?.(null))
									.toBe("Never");
							});

						it("should return formatted date when value is present",
							() =>
							{
								const result: string =
									lastLoginFormatter?.("2024-01-15T10:00:00Z") ?? "";
								expect(result).not.toBe("Never");
								expect(result.length)
									.toBeGreaterThan(0);
							});
					});
			});
	});

describe("UserList action handlers",
	() =>
	{
		let component: UserList;
		let fixture: ComponentFixture<UserList>;
		let mockUserService: {
			getPagedUsers: Mock;
			updateUser: Mock;
			resetPassword: Mock;
			restoreUser: Mock;
			updateFilter: Mock;
			getCurrentFilter: Mock;
			setPage: Mock;
			setPageSize: Mock;
			forceRefresh: Mock;
		};
		let mockDialogService: { confirm: Mock; confirmDeactivate: Mock; };
		let mockNotificationService: MockNotificationService;
		let router: Router;

		beforeEach(
			async () =>
			{
				const mockPagedResponse: PagedResultOfUserDto =
					{
						items: [],
						totalCount: 0,
						page: 1,
						pageSize: 50,
						totalPages: 0,
						hasPrevious: false,
						hasNext: false
					};

				mockUserService =
					{
						getPagedUsers: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfUserDto>(mockPagedResponse)),
						updateUser: vi
							.fn()
							.mockReturnValue(createMockMutationResult()),
						resetPassword: vi
							.fn()
							.mockReturnValue(createMockMutationResult()),
						restoreUser: vi
							.fn()
							.mockReturnValue(createMockMutationResult()),
						updateFilter: vi.fn(),
						getCurrentFilter: vi
							.fn()
							.mockReturnValue(
								{ includeDeleted: false }),
						setPage: vi.fn(),
						setPageSize: vi.fn(),
						forceRefresh: vi.fn()
					};

				mockDialogService =
					{
						confirm: vi
							.fn()
							.mockReturnValue(of(true)),
						confirmDeactivate: vi
							.fn()
							.mockReturnValue(of(true))
					};

				mockNotificationService =
					createMockNotificationService();

				fixture =
					await new ComponentTestBed<UserList>()
						.withAdminDefaults()
						.withProvider(
							{
								provide: UserService,
								useValue: mockUserService
							})
						.withProvider(
							{
								provide: DialogService,
								useValue: mockDialogService
							})
						.withProvider(
							{
								provide: NotificationService,
								useValue: mockNotificationService
							})
						.build(UserList);

				component =
					fixture.componentInstance;
				router =
					fixture.debugElement.injector.get(Router);
				vi
					.spyOn(router, "navigate")
					.mockResolvedValue(true);
				fixture.detectChanges();
			});

		describe("onSearch",
			() =>
			{
				it("should call updateFilter with search term",
					() =>
					{
						component.onSearch("alice");

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{ searchTerm: "alice" });
					});
			});

		describe("onFilterChange",
			() =>
			{
				it("should filter by active users",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "active" });

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{
									isActive: true,
									includeDeleted: false
								});
					});

				it("should filter by inactive users",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "inactive" });

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{
									isActive: false,
									includeDeleted: false
								});
					});

				it("should toggle deleted users",
					() =>
					{
						mockUserService.getCurrentFilter.mockReturnValue(
							{ includeDeleted: false });

						component.onFilterChange(
							{ filterKey: "deleted" });

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{
									isActive: undefined,
									includeDeleted: true
								});
					});

				it("should show all users",
					() =>
					{
						component.onFilterChange(
							{ filterKey: "all" });

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{
									isActive: undefined,
									includeDeleted: false
								});
					});
			});

		describe("onRowAction",
			() =>
			{
				it("should navigate to user detail on view action",
					() =>
					{
						component.onRowAction(
							{ action: "view", row: TEST_USER });

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[expect.stringContaining("42")]);
					});

				it("should navigate to user edit on edit action",
					() =>
					{
						component.onRowAction(
							{ action: "edit", row: TEST_USER });

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[expect.stringContaining("42")]);
					});

				it("should call confirm dialog and mutate on resetPassword action",
					() =>
					{
						component.onRowAction(
							{ action: "resetPassword", row: TEST_USER });

						expect(mockDialogService.confirm)
							.toHaveBeenCalled();
						expect(
							mockUserService
								.resetPassword()
								.mutate)
							.toHaveBeenCalled();
					});

				it("should call confirmDeactivate and mutate on deactivate action when confirmed",
					() =>
					{
						component.onRowAction(
							{ action: "deactivate", row: TEST_USER });

						expect(mockDialogService.confirmDeactivate)
							.toHaveBeenCalledWith("user");
						expect(
							mockUserService
								.updateUser()
								.mutate)
							.toHaveBeenCalled();
					});

				it("should not mutate on deactivate when dialog is cancelled",
					() =>
					{
						mockDialogService.confirmDeactivate.mockReturnValue(of(false));

						component.onRowAction(
							{ action: "deactivate", row: TEST_USER });

						expect(
							mockUserService
								.updateUser()
								.mutate)
							.not
							.toHaveBeenCalled();
					});

				it("should call confirm dialog and mutate on restore action",
					() =>
					{
						component.onRowAction(
							{ action: "restore", row: TEST_USER });

						expect(mockDialogService.confirm)
							.toHaveBeenCalled();
						expect(
							mockUserService
								.restoreUser()
								.mutate)
							.toHaveBeenCalled();
					});
			});

		describe("onPageChange",
			() =>
			{
				it("should call setPage with 1-based index",
					() =>
					{
						component.onPageChange(0);

						expect(mockUserService.setPage)
							.toHaveBeenCalledWith(1);
					});
			});

		describe("onRowClick",
			() =>
			{
				it("should navigate to user detail",
					() =>
					{
						component.onRowClick(TEST_USER);

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[expect.stringContaining("42")]);
					});
			});

		describe("onPageSizeChange",
			() =>
			{
				it("should call setPageSize with the provided value",
					() =>
					{
						component.onPageSizeChange(25);

						expect(mockUserService.setPageSize)
							.toHaveBeenCalledWith(25);
					});
			});

		describe("mutation callbacks",
			() =>
			{
				it("should show success notification when deactivate succeeds",
					() =>
					{
						const updateMutation: ReturnType<typeof createMockMutationResult> =
							mockUserService.updateUser();
						(updateMutation.mutate as unknown as Mock)
							.mockImplementation(
								(
									_input: unknown,
									options?: { onSuccess?: () => void; }) =>
								{
									options?.onSuccess?.();
								});

						component.onRowAction(
							{ action: "deactivate", row: TEST_USER });

						expect(mockNotificationService.success)
							.toHaveBeenCalled();
					});

				it("should show error notification when deactivate fails",
					() =>
					{
						const updateMutation: ReturnType<typeof createMockMutationResult> =
							mockUserService.updateUser();
						(updateMutation.mutate as unknown as Mock)
							.mockImplementation(
								(
									_input: unknown,
									options?: { onError?: (error: Error) => void; }) =>
								{
									options?.onError?.(new Error("Server error"));
								});

						component.onRowAction(
							{ action: "deactivate", row: TEST_USER });

						expect(mockNotificationService.error)
							.toHaveBeenCalled();
					});
			});

		describe("rowActions showIf",
			() =>
			{
				const activeUser: UserDto =
					{ ...TEST_USER, isDeleted: false };
				const deletedUser: UserDto =
					{ ...TEST_USER, isDeleted: true };

				it("should show edit action for non-deleted users",
					() =>
					{
						const editAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "edit");
						expect(editAction?.showIf?.(activeUser))
							.toBe(true);
					});

				it("should hide edit action for deleted users",
					() =>
					{
						const editAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "edit");
						expect(editAction?.showIf?.(deletedUser))
							.toBe(false);
					});

				it("should show resetPassword action for non-deleted users",
					() =>
					{
						const resetAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "resetPassword");
						expect(resetAction?.showIf?.(activeUser))
							.toBe(true);
					});

				it("should hide resetPassword action for deleted users",
					() =>
					{
						const resetAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "resetPassword");
						expect(resetAction?.showIf?.(deletedUser))
							.toBe(false);
					});

				it("should show restore action only for deleted users",
					() =>
					{
						const restoreAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "restore");
						expect(restoreAction?.showIf?.(deletedUser))
							.toBe(true);
					});

				it("should hide restore action for non-deleted users",
					() =>
					{
						const restoreAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "restore");
						expect(restoreAction?.showIf?.(activeUser))
							.toBe(false);
					});

				it("should show deactivate action for non-deleted users",
					() =>
					{
						const deactivateAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "deactivate");
						expect(deactivateAction?.showIf?.(activeUser))
							.toBe(true);
					});

				it("should hide deactivate action for deleted users",
					() =>
					{
						const deactivateAction: RowAction<UserDto> | undefined =
							component.rowActions.find((action) =>
								action.key === "deactivate");
						expect(deactivateAction?.showIf?.(deletedUser))
							.toBe(false);
					});
			});

		describe("onSearch",
			() =>
			{
				it("should call updateFilter with undefined when search term is empty",
					() =>
					{
						component.onSearch("");

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{ searchTerm: undefined });
					});
			});

		describe("onSortChange",
			() =>
			{
				it("should call updateFilter with sort params",
					() =>
					{
						component.onSortChange(
							{ sortBy: "username", sortDescending: true });

						expect(mockUserService.updateFilter)
							.toHaveBeenCalledWith(
								{ sortBy: "username", sortDescending: true });
					});
			});

		describe("onCreateClick",
			() =>
			{
				it("should navigate to create user route",
					() =>
					{
						component.onCreateClick();

						expect(router.navigate)
							.toHaveBeenCalled();
					});
			});

		describe("onRefresh",
			() =>
			{
				it("should call userService forceRefresh",
					() =>
					{
						component.onRefresh();

						expect(mockUserService.forceRefresh)
							.toHaveBeenCalled();
					});
			});

		describe("computed signals",
			() =>
			{
				it("should return null error when query succeeds",
					() =>
					{
						expect(component.error())
							.toBeNull();
					});

				it("should return error message when query has an error",
					() =>
					{
						(component.usersQuery.error as unknown as WritableSignal<Error | null>)
							.set(new Error("Network failure"));

						expect(component.error());
					});

				it("should return false for isFetching when not refetching",
					() =>
					{
						expect(
							(component as unknown as { isFetching(): boolean; }).isFetching())
							.toBe(false);
					});
			});
	});