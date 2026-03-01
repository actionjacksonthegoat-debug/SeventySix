import { UserFixtures } from "@admin/testing";
import {
	PagedResultOfUserDto,
	UpdateUserRequest,
	UserDto
} from "@admin/users/models";
import { TestBed } from "@angular/core/testing";
import { ROLE_ADMIN, ROLE_DEVELOPER } from "@shared/constants/role.constants";
import { ApiService } from "@shared/services/api.service";
// QueryClient not used in these tests
import {
	createMockApiService,
	MockApiService,
	setupServiceTest
} from "@shared/testing";
import { of } from "rxjs";
import { UserService } from "./user.service";

/** User Service Tests - focuses on business logic, not framework internals */
describe("UserService",
	() =>
	{
		let service: UserService;
		let mockApiService: MockApiService;

		const mockUser: UserDto =
			UserFixtures.JOHN_DOE;

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService();
				const setup: { service: UserService; } =
					setupServiceTest(UserService,
						[
							{ provide: ApiService, useValue: mockApiService }
						]);
				service =
					setup.service;
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("filter management",
			() =>
			{
				it("should update filter and reset to page 1",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test" });

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.searchTerm)
							.toBe("test");
						expect(filter.page)
							.toBe(1);
					});

				it("should set page",
					() =>
					{
						service.setPage(3);

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(3);
					});

				it("should set page size and reset to page 1",
					() =>
					{
						service.setPage(5);
						service.setPageSize(100);

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.pageSize)
							.toBe(100);
						expect(filter.page)
							.toBe(1);
					});

				it("should clear filters",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test", isActive: true });
						service.clearFilters();

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.searchTerm)
							.toBeUndefined();
						expect(filter.isActive)
							.toBeUndefined();
						expect(filter.page)
							.toBe(1);
					});

				it("should initialize with no date filters",
					() =>
					{
						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();

						expect(filter.startDate)
							.toBeNull();
						expect(filter.endDate)
							.toBeNull();
					});

				it("should update isActive filter",
					() =>
					{
						service.updateFilter(
							{ isActive: true });

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.isActive)
							.toBe(true);
					});

				it("should update includeDeleted filter",
					() =>
					{
						service.updateFilter(
							{ includeDeleted: true });

						const filter: import("@admin/users/models").UserQueryRequest =
							service.getCurrentFilter();
						expect(filter.includeDeleted)
							.toBe(true);
					});
			});

		describe("getUserById",
			() =>
			{
				it("should fetch user by id",
					async () =>
					{
						mockApiService.get.mockReturnValue(of(mockUser));

						const query: ReturnType<typeof service.getUserById> =
							TestBed.runInInjectionContext(
								() => service.getUserById(1));
						const result: Awaited<ReturnType<typeof query.refetch>> =
							await query.refetch();

						expect(result.data)
							.toEqual(mockUser);
						expect(mockApiService.get)
							.toHaveBeenCalledWith("users/1");
					});
			});

		describe("createUser",
			() =>
			{
				it("should create user",
					async () =>
					{
						const newUser: Partial<UserDto> =
							{
								username: "newuser",
								email: "new@example.com"
							};
						mockApiService.post.mockReturnValue(of(mockUser));

						const mutation: ReturnType<typeof service.createUser> =
							TestBed.runInInjectionContext(
								() => service.createUser());
						await mutation.mutateAsync(newUser);

						expect(mockApiService.post)
							.toHaveBeenCalledWith(
								"users",
								expect.objectContaining(
									{
										username: "newuser",
										email: "new@example.com"
									}));
					});
			});

		describe("updateUser",
			() =>
			{
				it("should update user",
					async () =>
					{
						const updateRequest: UpdateUserRequest =
							{
								id: 1,
								username: "testuser",
								email: "updated@example.com",
								isActive: true
							};
						mockApiService.put.mockReturnValue(of(mockUser));

						const mutation: ReturnType<typeof service.updateUser> =
							TestBed.runInInjectionContext(
								() => service.updateUser());
						await mutation.mutateAsync(
							{ userId: 1, user: updateRequest });

						expect(mockApiService.put)
							.toHaveBeenCalledWith(
								"users/1",
								updateRequest);
					});
			});

		describe("deleteUser",
			() =>
			{
				it("should delete user",
					async () =>
					{
						mockApiService.delete.mockReturnValue(of(undefined));

						const mutation: ReturnType<typeof service.deleteUser> =
							TestBed.runInInjectionContext(
								() => service.deleteUser());
						await mutation.mutateAsync(1);

						expect(mockApiService.delete)
							.toHaveBeenCalledWith("users/1");
					});
			});

		describe("getPagedUsers",
			() =>
			{
				it("should fetch paged users with current filter",
					async () =>
					{
						service.updateFilter(
							{
								searchTerm: "test",
								isActive: true
							});

						const pagedResult: PagedResultOfUserDto =
							{
								items: [mockUser],
								totalCount: 1,
								page: 1,
								pageSize: 50,
								totalPages: 1,
								hasPrevious: false,
								hasNext: false
							};
						mockApiService.get.mockReturnValue(of(pagedResult));

						const query: ReturnType<typeof service.getPagedUsers> =
							TestBed.runInInjectionContext(
								() => service.getPagedUsers());
						const result: Awaited<ReturnType<typeof query.refetch>> =
							await query.refetch();

						expect(result.data)
							.toEqual(pagedResult);
					});
			});

		describe("getUserByUsername",
			() =>
			{
				it("should fetch user by username",
					async () =>
					{
						mockApiService.get.mockReturnValue(of(mockUser));

						const query: ReturnType<typeof service.getUserByUsername> =
							TestBed.runInInjectionContext(
								() =>
									service.getUserByUsername("testuser"));
						const result: Awaited<ReturnType<typeof query.refetch>> =
							await query.refetch();

						expect(result.data)
							.toEqual(mockUser);
						expect(mockApiService.get)
							.toHaveBeenCalledWith("users/username/testuser");
					});
			});

		describe("restoreUser",
			() =>
			{
				it("should restore user",
					async () =>
					{
						mockApiService.post.mockReturnValue(of(undefined));

						const mutation: ReturnType<typeof service.restoreUser> =
							TestBed.runInInjectionContext(
								() => service.restoreUser());
						await mutation.mutateAsync(1);

						expect(mockApiService.post)
							.toHaveBeenCalledWith("users/1/restore", {});
					});
			});

		describe("resetPassword",
			() =>
			{
				it("should reset user password",
					async () =>
					{
						mockApiService.post.mockReturnValue(of(undefined));

						const mutation: ReturnType<typeof service.resetPassword> =
							TestBed.runInInjectionContext(
								() => service.resetPassword());
						await mutation.mutateAsync(1);

						expect(mockApiService.post)
							.toHaveBeenCalledWith("users/1/reset-password", {});
					});
			});

		describe("forceRefresh",
			() =>
			{
				it("should refetch all active user queries",
					async () =>
					{
						const mockPagedResponse: PagedResultOfUserDto =
							{
								items: [mockUser],
								totalCount: 1,
								page: 1,
								pageSize: 50,
								totalPages: 1,
								hasPrevious: false,
								hasNext: false
							};

						mockApiService.get.mockReturnValue(of(mockPagedResponse));

						// Access the private signal via bracket notation for testing
						const getSignalValue: () => number =
							() =>
								(service as unknown as { [key: string]: () => number; })["forceRefreshTrigger"]();

						const initialValue: number =
							getSignalValue();

						// Force refresh
						await TestBed.runInInjectionContext(
							() => service.forceRefresh());

						const newValue: number =
							getSignalValue();

						// Counter should have incremented
						expect(newValue)
							.toBe(initialValue + 1);
					});
			});

		describe("checkUsernameAvailability",
			() =>
			{
				it("should check availability without excludeUserId",
					async () =>
					{
						mockApiService.get.mockReturnValue(of(true));

						const result: boolean =
							await service.checkUsernameAvailability(
								"testuser");

						expect(result)
							.toBe(true);
						expect(mockApiService.get)
							.toHaveBeenCalledWith(
								"users/check/username/testuser",
								undefined);
					});

				it("should check availability with excludeUserId",
					async () =>
					{
						mockApiService.get.mockReturnValue(of(false));

						const result: boolean =
							await service.checkUsernameAvailability(
								"testuser",
								42);

						expect(result)
							.toBe(false);
						expect(mockApiService.get)
							.toHaveBeenCalledWith(
								"users/check/username/testuser",
								expect.any(Object));
					});
			});

		describe("bulkActivateUsers",
			() =>
			{
				it("should bulk activate users",
					async () =>
					{
						mockApiService.post.mockReturnValue(of(2));

						const mutation: ReturnType<typeof service.bulkActivateUsers> =
							TestBed.runInInjectionContext(
								() => service.bulkActivateUsers());
						const count: number =
							await mutation.mutateAsync(
								[1, 2]);

						expect(count)
							.toBe(2);
						expect(mockApiService.post)
							.toHaveBeenCalledWith(
								"users/bulk/activate",
								[1, 2]);
					});
			});

		describe("bulkDeactivateUsers",
			() =>
			{
				it("should bulk deactivate users",
					async () =>
					{
						mockApiService.post.mockReturnValue(of(3));

						const mutation: ReturnType<typeof service.bulkDeactivateUsers> =
							TestBed.runInInjectionContext(
								() => service.bulkDeactivateUsers());
						const count: number =
							await mutation.mutateAsync(
								[1, 2, 3]);

						expect(count)
							.toBe(3);
						expect(mockApiService.post)
							.toHaveBeenCalledWith(
								"users/bulk/deactivate",
								[1, 2, 3]);
					});
			});

		describe("getUserRoles",
			() =>
			{
				it("should fetch user roles",
					async () =>
					{
						const roles: string[] =
							[ROLE_ADMIN, ROLE_DEVELOPER];
						mockApiService.get.mockReturnValue(of(roles));

						const query: ReturnType<typeof service.getUserRoles> =
							TestBed.runInInjectionContext(
								() => service.getUserRoles(1));
						const result: Awaited<ReturnType<typeof query.refetch>> =
							await query.refetch();

						expect(result.data)
							.toEqual(roles);
						expect(mockApiService.get)
							.toHaveBeenCalledWith("users/1/roles");
					});
			});

		describe("getAdminCount",
			() =>
			{
				it("should fetch admin count",
					async () =>
					{
						mockApiService.get.mockReturnValue(of(3));

						const query: ReturnType<typeof service.getAdminCount> =
							TestBed.runInInjectionContext(
								() => service.getAdminCount());
						const result: Awaited<ReturnType<typeof query.refetch>> =
							await query.refetch();

						expect(result.data)
							.toBe(3);
						expect(mockApiService.get)
							.toHaveBeenCalledWith("users/admin-count");
					});
			});

		describe("addRole",
			() =>
			{
				it("should add role to user",
					async () =>
					{
						mockApiService.post.mockReturnValue(of(undefined));

						const mutation: ReturnType<typeof service.addRole> =
							TestBed.runInInjectionContext(
								() => service.addRole());
						await mutation.mutateAsync(
							{ userId: 1, roleName: ROLE_DEVELOPER });

						expect(mockApiService.post)
							.toHaveBeenCalledWith(
								`users/1/roles/${ROLE_DEVELOPER}`,
								{});
					});
			});

		describe("removeRole",
			() =>
			{
				it("should remove role from user",
					async () =>
					{
						mockApiService.delete.mockReturnValue(of(undefined));

						const mutation: ReturnType<typeof service.removeRole> =
							TestBed.runInInjectionContext(
								() => service.removeRole());
						await mutation.mutateAsync(
							{ userId: 1, roleName: ROLE_DEVELOPER });

						expect(mockApiService.delete)
							.toHaveBeenCalledWith(`users/1/roles/${ROLE_DEVELOPER}`);
					});
			});
	});