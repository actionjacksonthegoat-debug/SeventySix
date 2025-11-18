import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { UserRepository } from "@admin/users/repositories";
import {
	User,
	UpdateUserRequest,
	UserQueryRequest,
	PagedResult
} from "@admin/users/models";
import { UserService } from "./user.service";

describe("UserService", () =>
{
	let service: UserService;
	let mockRepository: jasmine.SpyObj<UserRepository>;
	let queryClient: QueryClient;

	const mockUser: User = {
		id: 1,
		username: "testuser",
		email: "test@example.com",
		fullName: "Test User",
		createdAt: "2024-01-01T00:00:00Z",
		isActive: true,
		createdBy: "admin",
		modifiedAt: "2024-01-02T00:00:00Z",
		modifiedBy: "admin",
		lastLoginAt: "2024-01-03T00:00:00Z",
		rowVersion: 1
	};

	beforeEach(() =>
	{
		mockRepository = jasmine.createSpyObj("UserRepository", [
			"getAll",
			"getById",
			"create",
			"update",
			"delete",
			"getPaged",
			"getByUsername",
			"checkUsername",
			"restore",
			"bulkActivate",
			"bulkDeactivate"
		]);

		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});
		spyOn(queryClient, "invalidateQueries").and.callThrough();

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideAngularQuery(queryClient),
				UserService,
				{ provide: UserRepository, useValue: mockRepository }
			]
		});

		service = TestBed.inject(UserService);
	});

	afterEach(() =>
	{
		queryClient.clear();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAllUsers", () =>
	{
		it("should create query", () =>
		{
			const users: User[] = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			const query: ReturnType<typeof service.getAllUsers> =
				TestBed.runInInjectionContext(() => service.getAllUsers());

			expect(query).toBeTruthy();
		});

		it("should fetch users from repository", async () =>
		{
			const users: User[] = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			const query: ReturnType<typeof service.getAllUsers> =
				TestBed.runInInjectionContext(() => service.getAllUsers());
			const result = await query.refetch();

			expect(mockRepository.getAll).toHaveBeenCalled();
			expect(result.data).toEqual(users);
		});
	});

	describe("getUserById", () =>
	{
		it("should create query", () =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			const query: ReturnType<typeof service.getUserById> =
				TestBed.runInInjectionContext(() => service.getUserById(1));

			expect(query).toBeTruthy();
		});

		it("should fetch user by id from repository", async () =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			const query: ReturnType<typeof service.getUserById> =
				TestBed.runInInjectionContext(() => service.getUserById(1));
			const result = await query.refetch();

			expect(mockRepository.getById).toHaveBeenCalledWith(1);
			expect(result.data).toEqual(mockUser);
		});
	});

	describe("createUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.createUser> =
				TestBed.runInInjectionContext(() => service.createUser());

			expect(mutation).toBeTruthy();
		});

		it("should create user via mutation", async () =>
		{
			const newUser: Partial<User> = {
				username: "newuser",
				email: "new@example.com"
			};
			mockRepository.create.and.returnValue(of(mockUser));

			const mutation: ReturnType<typeof service.createUser> =
				TestBed.runInInjectionContext(() => service.createUser());
			await mutation.mutateAsync(newUser);

			expect(mockRepository.create).toHaveBeenCalledWith(newUser);
		});

		it("should invalidate users query on success", async () =>
		{
			const newUser: Partial<User> = {
				username: "newuser",
				email: "new@example.com"
			};
			mockRepository.create.and.returnValue(of(mockUser));
			mockRepository.getAll.and.returnValue(of([mockUser]));

			const mutation: ReturnType<typeof service.createUser> =
				TestBed.runInInjectionContext(() => service.createUser());

			await mutation.mutateAsync(newUser);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users", "all"]
			});
		});
	});
	describe("updateUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.updateUser> =
				TestBed.runInInjectionContext(() => service.updateUser());

			expect(mutation).toBeTruthy();
		});

		it("should update user via mutation", async () =>
		{
			const updateRequest: UpdateUserRequest = {
				id: 1,
				username: "testuser",
				email: "updated@example.com",
				isActive: true,
				rowVersion: 1
			};
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation: ReturnType<typeof service.updateUser> =
				TestBed.runInInjectionContext(() => service.updateUser());
			await mutation.mutateAsync({ id: 1, user: updateRequest });

			expect(mockRepository.update).toHaveBeenCalledWith(
				1,
				updateRequest
			);
		});

		it("should invalidate queries on success", async () =>
		{
			const updateRequest: UpdateUserRequest = {
				id: 1,
				username: "testuser",
				email: "updated@example.com",
				isActive: true,
				rowVersion: 1
			};
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation: ReturnType<typeof service.updateUser> =
				TestBed.runInInjectionContext(() => service.updateUser());
			await mutation.mutateAsync({ id: 1, user: updateRequest });

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users", "user", 1]
			});
			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users", "all"]
			});
		});
	});

	describe("deleteUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.deleteUser> =
				TestBed.runInInjectionContext(() => service.deleteUser());

			expect(mutation).toBeTruthy();
		});

		it("should delete user via mutation", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.deleteUser> =
				TestBed.runInInjectionContext(() => service.deleteUser());
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should invalidate users query on success", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.deleteUser> =
				TestBed.runInInjectionContext(() => service.deleteUser());
			await mutation.mutateAsync(1);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users", "all"]
			});
		});
	});

	describe("getPagedUsers", () =>
	{
		it("should create query", () =>
		{
			const request: UserQueryRequest = {
				page: 1,
				pageSize: 10,
				searchTerm: "test",
				includeInactive: false,
				sortBy: "username",
				sortDescending: false
			};
			const requestSignal = signal(request);
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

			const query: ReturnType<typeof service.getPagedUsers> =
				TestBed.runInInjectionContext(() =>
					service.getPagedUsers(requestSignal)
				);

			expect(query).toBeTruthy();
		});

		it("should fetch paged users from repository", async () =>
		{
			const request: UserQueryRequest = {
				page: 1,
				pageSize: 10,
				searchTerm: "test",
				includeInactive: false,
				sortBy: "username",
				sortDescending: false
			};
			const requestSignal = signal(request);
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

			const query: ReturnType<typeof service.getPagedUsers> =
				TestBed.runInInjectionContext(() =>
					service.getPagedUsers(requestSignal)
				);
			const result = await query.refetch();

			expect(mockRepository.getPaged).toHaveBeenCalledWith(request);
			expect(result.data).toEqual(pagedResult);
		});
	});

	describe("getUserByUsername", () =>
	{
		it("should create query", () =>
		{
			mockRepository.getByUsername.and.returnValue(of(mockUser));

			const query: ReturnType<typeof service.getUserByUsername> =
				TestBed.runInInjectionContext(() =>
					service.getUserByUsername("testuser")
				);

			expect(query).toBeTruthy();
		});

		it("should fetch user by username from repository", async () =>
		{
			mockRepository.getByUsername.and.returnValue(of(mockUser));

			const query: ReturnType<typeof service.getUserByUsername> =
				TestBed.runInInjectionContext(() =>
					service.getUserByUsername("testuser")
				);
			const result = await query.refetch();

			expect(mockRepository.getByUsername).toHaveBeenCalledWith(
				"testuser"
			);
			expect(result.data).toEqual(mockUser);
		});
	});

	describe("checkUsernameAvailability", () =>
	{
		it("should check username without excludeId", async () =>
		{
			mockRepository.checkUsername.and.returnValue(of(true));

			const result: boolean = await TestBed.runInInjectionContext(() =>
				service.checkUsernameAvailability("newuser")
			);

			expect(mockRepository.checkUsername).toHaveBeenCalledWith(
				"newuser",
				undefined
			);
			expect(result).toBe(true);
		});

		it("should check username with excludeId", async () =>
		{
			mockRepository.checkUsername.and.returnValue(of(false));

			const result: boolean = await TestBed.runInInjectionContext(() =>
				service.checkUsernameAvailability("existinguser", 5)
			);

			expect(mockRepository.checkUsername).toHaveBeenCalledWith(
				"existinguser",
				5
			);
			expect(result).toBe(false);
		});
	});

	describe("restoreUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.restoreUser> =
				TestBed.runInInjectionContext(() => service.restoreUser());

			expect(mutation).toBeTruthy();
		});

		it("should restore user via mutation", async () =>
		{
			mockRepository.restore.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.restoreUser> =
				TestBed.runInInjectionContext(() => service.restoreUser());
			await mutation.mutateAsync(1);

			expect(mockRepository.restore).toHaveBeenCalledWith(1);
		});

		it("should invalidate users query on success", async () =>
		{
			mockRepository.restore.and.returnValue(of(undefined));

			const mutation: ReturnType<typeof service.restoreUser> =
				TestBed.runInInjectionContext(() => service.restoreUser());
			await mutation.mutateAsync(1);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users"]
			});
		});
	});

	describe("bulkActivateUsers", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.bulkActivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkActivateUsers()
				);

			expect(mutation).toBeTruthy();
		});

		it("should bulk activate users via mutation", async () =>
		{
			const ids: number[] = [1, 2, 3];
			const count: number = 3;
			mockRepository.bulkActivate.and.returnValue(of(count));

			const mutation: ReturnType<typeof service.bulkActivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkActivateUsers()
				);
			const result: number = await mutation.mutateAsync(ids);

			expect(mockRepository.bulkActivate).toHaveBeenCalledWith(ids);
			expect(result).toBe(count);
		});

		it("should invalidate users query on success", async () =>
		{
			const ids: number[] = [1, 2, 3];
			mockRepository.bulkActivate.and.returnValue(of(3));

			const mutation: ReturnType<typeof service.bulkActivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkActivateUsers()
				);
			await mutation.mutateAsync(ids);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users"]
			});
		});
	});

	describe("bulkDeactivateUsers", () =>
	{
		it("should create mutation", () =>
		{
			const mutation: ReturnType<typeof service.bulkDeactivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkDeactivateUsers()
				);

			expect(mutation).toBeTruthy();
		});

		it("should bulk deactivate users via mutation", async () =>
		{
			const ids: number[] = [1, 2, 3];
			const count: number = 3;
			mockRepository.bulkDeactivate.and.returnValue(of(count));

			const mutation: ReturnType<typeof service.bulkDeactivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkDeactivateUsers()
				);
			const result: number = await mutation.mutateAsync(ids);

			expect(mockRepository.bulkDeactivate).toHaveBeenCalledWith(ids);
			expect(result).toBe(count);
		});

		it("should invalidate users query on success", async () =>
		{
			const ids: number[] = [1, 2, 3];
			mockRepository.bulkDeactivate.and.returnValue(of(3));

			const mutation: ReturnType<typeof service.bulkDeactivateUsers> =
				TestBed.runInInjectionContext(() =>
					service.bulkDeactivateUsers()
				);
			await mutation.mutateAsync(ids);

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: ["users"]
			});
		});
	});
});
