import { UserFixtures } from "@admin/testing";
import {
	PagedResultOfUserDto,
	UpdateUserRequest,
	UserDto
} from "@admin/users/models";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@shared/services/api.service";
// QueryClient not used in these tests
import {
	createMockApiService,
	setupServiceTest
} from "@shared/testing";
import { of } from "rxjs";
import { UserService } from "./user.service";

/** User Service Tests - focuses on business logic, not framework internals */
describe("UserService",
	() =>
	{
		let service: UserService;
		let mockApiService: jasmine.SpyObj<ApiService>;

		const mockUser: UserDto =
			UserFixtures.JOHN_DOE;

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService() as jasmine.SpyObj<ApiService>;

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
						mockApiService.get.and.returnValue(of(mockUser));

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
						mockApiService.post.and.returnValue(of(mockUser));

						const mutation: ReturnType<typeof service.createUser> =
							TestBed.runInInjectionContext(
								() => service.createUser());
						await mutation.mutateAsync(newUser);

						expect(mockApiService.post)
							.toHaveBeenCalledWith(
								"users",
								jasmine.objectContaining(
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
						mockApiService.put.and.returnValue(of(mockUser));

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
						mockApiService.delete.and.returnValue(of(undefined));

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
						mockApiService.get.and.returnValue(of(pagedResult));

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
						mockApiService.get.and.returnValue(of(mockUser));

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
						mockApiService.post.and.returnValue(of(undefined));

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
						mockApiService.post.and.returnValue(of(undefined));

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

						mockApiService.get.and.returnValue(of(mockPagedResponse));

						// Access the private signal via bracket notation for testing
						const getSignalValue: () => boolean =
							() =>
								(service as unknown as { [key: string]: () => boolean; })["forceRefreshTrigger"]();

						const initialValue: boolean =
							getSignalValue();

						// Force refresh
						await TestBed.runInInjectionContext(
							() => service.forceRefresh());

						const newValue: boolean =
							getSignalValue();

						// Signal should have toggled
						expect(newValue)
							.toBe(!initialValue);
					});
			});
	});
