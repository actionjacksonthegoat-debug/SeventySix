import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { of, throwError } from "rxjs";
import { UserRepository } from "@admin/users/repositories";
import {
	User,
	UpdateUserRequest,
	UserQueryRequest,
	PagedResult
} from "@admin/users/models";
import { UserService } from "./user.service";
import {
	UserFixtures,
	createMockUserRepository,
	setupServiceTest
} from "@testing";

/**
 * User Service Tests
 * Simplified following 80/20 principle - focuses on business logic, not framework internals
 */
describe("UserService", () =>
{
	let service: UserService;
	let mockRepository: jasmine.SpyObj<UserRepository>;

	const mockUser: User = UserFixtures.JOHN_DOE;

	beforeEach(() =>
	{
		mockRepository =
			createMockUserRepository() as jasmine.SpyObj<UserRepository>;
		mockRepository.getByUsername = jasmine.createSpy("getByUsername");
		mockRepository.checkUsername = jasmine.createSpy("checkUsername");
		mockRepository.restore = jasmine.createSpy("restore");
		mockRepository.bulkActivate = jasmine.createSpy("bulkActivate");
		mockRepository.bulkDeactivate = jasmine.createSpy("bulkDeactivate");

		const setup = setupServiceTest(UserService, [
			{ provide: UserRepository, useValue: mockRepository }
		]);
		service = setup.service;
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAllUsers", () =>
	{
		it("should fetch users from repository", async () =>
		{
			const users: User[] = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			const query = TestBed.runInInjectionContext(() =>
				service.getAllUsers()
			);
			const result = await query.refetch();

			expect(result.data).toEqual(users);
		});

		it("should handle errors", async () =>
		{
			mockRepository.getAll.and.returnValue(
				throwError(() => new Error("API Error"))
			);

			const query = TestBed.runInInjectionContext(() =>
				service.getAllUsers()
			);
			const result = await query.refetch();

			expect(result.error).toBeDefined();
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
			const newUser: Partial<User> = {
				username: "newuser",
				email: "new@example.com"
			};
			mockRepository.create.and.returnValue(of(mockUser));

			const mutation = TestBed.runInInjectionContext(() =>
				service.createUser()
			);
			await mutation.mutateAsync(newUser);

			expect(mockRepository.create).toHaveBeenCalledWith(newUser);
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
				isActive: true,
				rowVersion: 1
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
		it("should fetch paged users", async () =>
		{
			const request: UserQueryRequest = {
				page: 1,
				pageSize: 10,
				searchTerm: "",
				includeInactive: false,
				sortBy: "",
				sortDescending: false
			};
			const pagedResult: PagedResult<User> = {
				items: [mockUser],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
				hasPreviousPage: false,
				hasNextPage: false
			};
			mockRepository.getPaged.and.returnValue(of(pagedResult));

			const query = TestBed.runInInjectionContext(() =>
				service.getPagedUsers(signal(request))
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
});
