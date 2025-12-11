import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { UserRepository } from "@admin/users/repositories";
import { PagedResultOfUserDto } from "@infrastructure/api";
import { UserDto, UpdateUserRequest } from "@admin/users/models";
import { UserService } from "./user.service";
import {
	UserFixtures,
	createMockUserRepository,
	setupServiceTest
} from "@testing";

/** User Service Tests - focuses on business logic, not framework internals */
describe("UserService", () =>
{
	let service: UserService;
	let mockRepository: jasmine.SpyObj<UserRepository>;

	const mockUser: UserDto = UserFixtures.JOHN_DOE;

	beforeEach(() =>
	{
		mockRepository =
			createMockUserRepository() as jasmine.SpyObj<UserRepository>;
		mockRepository.getByUsername = jasmine.createSpy("getByUsername");
		mockRepository.checkUsername = jasmine.createSpy("checkUsername");
		mockRepository.restore = jasmine.createSpy("restore");
		mockRepository.bulkActivate = jasmine.createSpy("bulkActivate");
		mockRepository.bulkDeactivate = jasmine.createSpy("bulkDeactivate");
		mockRepository.resetPassword = jasmine.createSpy("resetPassword");

		const setup = setupServiceTest(UserService, [
			{ provide: UserRepository, useValue: mockRepository }
		]);
		service = setup.service;
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("filter management", () =>
	{
		it("should update filter and reset to page 1", () =>
		{
			service.updateFilter({ searchTerm: "test" });

			const filter = service.getCurrentFilter();
			expect(filter.searchTerm).toBe("test");
			expect(filter.page).toBe(1);
		});

		it("should set page", () =>
		{
			service.setPage(3);

			const filter = service.getCurrentFilter();
			expect(filter.page).toBe(3);
		});

		it("should set page size and reset to page 1", () =>
		{
			service.setPage(5);
			service.setPageSize(100);

			const filter = service.getCurrentFilter();
			expect(filter.pageSize).toBe(100);
			expect(filter.page).toBe(1);
		});

		it("should clear filters", () =>
		{
			service.updateFilter({ searchTerm: "test", isActive: true });
			service.clearFilters();

			const filter = service.getCurrentFilter();
			expect(filter.searchTerm).toBeUndefined();
			expect(filter.isActive).toBeUndefined();
			expect(filter.page).toBe(1);
		});

		it("should initialize with no date filters", () =>
		{
			const filter = service.getCurrentFilter();

			expect(filter.startDate).toBeNull();
			expect(filter.endDate).toBeNull();
		});

		it("should update isActive filter", () =>
		{
			service.updateFilter({ isActive: true });

			const filter = service.getCurrentFilter();
			expect(filter.isActive).toBe(true);
		});

		it("should update includeDeleted filter", () =>
		{
			service.updateFilter({ includeDeleted: true });

			const filter = service.getCurrentFilter();
			expect(filter.includeDeleted).toBe(true);
		});
	});

	describe("getUserById", () =>
	{
		it("should fetch user by id", async () =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			const query = TestBed.runInInjectionContext(() =>
				service.getUserById(1)
			);
			const result = await query.refetch();

			expect(result.data).toEqual(mockUser);
		});
	});

	describe("createUser", () =>
	{
		it("should create user", async () =>
		{
			const newUser: Partial<UserDto> = {
				username: "newuser",
				email: "new@example.com"
			};
			mockRepository.create.and.returnValue(of(mockUser));

			const mutation = TestBed.runInInjectionContext(() =>
				service.createUser()
			);
			await mutation.mutateAsync(newUser);

			expect(mockRepository.create).toHaveBeenCalledWith(
				jasmine.objectContaining({
					username: "newuser",
					email: "new@example.com"
				})
			);
		});
	});

	describe("updateUser", () =>
	{
		it("should update user", async () =>
		{
			const updateRequest: UpdateUserRequest = {
				id: 1,
				username: "testuser",
				email: "updated@example.com",
				isActive: true
			};
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation = TestBed.runInInjectionContext(() =>
				service.updateUser()
			);
			await mutation.mutateAsync({ id: 1, user: updateRequest });

			expect(mockRepository.update).toHaveBeenCalledWith(
				1,
				updateRequest
			);
		});
	});

	describe("deleteUser", () =>
	{
		it("should delete user", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation = TestBed.runInInjectionContext(() =>
				service.deleteUser()
			);
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});
	});

	describe("getPagedUsers", () =>
	{
		it("should fetch paged users with current filter", async () =>
		{
			service.updateFilter({
				searchTerm: "test",
				isActive: true
			});

			const pagedResult: PagedResultOfUserDto = {
				items: [mockUser],
				totalCount: 1,
				page: 1,
				pageSize: 50,
				totalPages: 1,
				hasPrevious: false,
				hasNext: false
			};
			mockRepository.getPaged.and.returnValue(of(pagedResult));

			const query = TestBed.runInInjectionContext(() =>
				service.getPagedUsers()
			);
			const result = await query.refetch();

			expect(result.data).toEqual(pagedResult);
		});
	});

	describe("getUserByUsername", () =>
	{
		it("should fetch user by username", async () =>
		{
			mockRepository.getByUsername.and.returnValue(of(mockUser));

			const query = TestBed.runInInjectionContext(() =>
				service.getUserByUsername("testuser")
			);
			const result = await query.refetch();

			expect(result.data).toEqual(mockUser);
		});
	});

	describe("restoreUser", () =>
	{
		it("should restore user", async () =>
		{
			mockRepository.restore.and.returnValue(of(undefined));

			const mutation = TestBed.runInInjectionContext(() =>
				service.restoreUser()
			);
			await mutation.mutateAsync(1);

			expect(mockRepository.restore).toHaveBeenCalledWith(1);
		});
	});

	describe("resetPassword", () =>
	{
		it("should reset user password", async () =>
		{
			mockRepository.resetPassword.and.returnValue(of(undefined));

			const mutation = TestBed.runInInjectionContext(() =>
				service.resetPassword()
			);
			await mutation.mutateAsync(1);

			expect(mockRepository.resetPassword).toHaveBeenCalledWith(1);
		});
	});

	describe("forceRefresh", () =>
	{
		it("should refetch all active user queries", async () =>
		{
			const mockPagedResponse: PagedResultOfUserDto = {
				items: [mockUser],
				totalCount: 1,
				page: 1,
				pageSize: 50,
				totalPages: 1,
				hasPrevious: false,
				hasNext: false
			};

			mockRepository.getPaged.and.returnValue(of(mockPagedResponse));

			// Access the private signal via bracket notation for testing
			const getSignalValue = (): boolean =>
				(service as any)["forceRefreshTrigger"]();

			const initialValue: boolean = getSignalValue();

			// Force refresh
			await TestBed.runInInjectionContext(() => service.forceRefresh());

			const newValue: boolean = getSignalValue();

			// Signal should have toggled
			expect(newValue).toBe(!initialValue);
		});
	});
});
