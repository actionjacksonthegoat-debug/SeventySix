import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { UserRepository } from "@admin/users/repositories";
import { User } from "@admin/users/models";
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
		isActive: true
	};

	beforeEach(() =>
	{
		mockRepository = jasmine.createSpyObj("UserRepository", [
			"getAll",
			"getById",
			"create",
			"update",
			"delete"
		]);

		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});

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
		it("should create query with correct configuration", () =>
		{
			const users = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			const query = service.getAllUsers();

			expect(query.queryKey()).toEqual(["users"]);
		});

		it("should fetch users from repository", async () =>
		{
			const users = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			const query = service.getAllUsers();
			await query.refetch();

			expect(mockRepository.getAll).toHaveBeenCalled();
			expect(query.data()).toEqual(users);
		});
	});

	describe("getUserById", () =>
	{
		it("should create query with correct key", () =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			const query = service.getUserById(1);

			expect(query.queryKey()).toEqual(["users", 1]);
		});

		it("should fetch user by id from repository", async () =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			const query = service.getUserById(1);
			await query.refetch();

			expect(mockRepository.getById).toHaveBeenCalledWith(1);
			expect(query.data()).toEqual(mockUser);
		});
	});

	describe("createUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.createUser();

			expect(mutation).toBeTruthy();
		});

		it("should create user via mutation", async () =>
		{
			const newUser = { username: "newuser", email: "new@example.com" };
			mockRepository.create.and.returnValue(of(mockUser));

			const mutation = service.createUser();
			await mutation.mutateAsync(newUser);

			expect(mockRepository.create).toHaveBeenCalledWith(newUser);
		});

		it("should invalidate users query on success", async () =>
		{
			const newUser = { username: "newuser", email: "new@example.com" };
			mockRepository.create.and.returnValue(of(mockUser));
			mockRepository.getAll.and.returnValue(of([mockUser]));

			const query = service.getAllUsers();
			const mutation = service.createUser();

			await mutation.mutateAsync(newUser);

			expect(
				queryClient.isFetching({ queryKey: ["users"] })
			).toBeGreaterThan(0);
		});
	});

	describe("updateUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.updateUser();

			expect(mutation).toBeTruthy();
		});

		it("should update user via mutation", async () =>
		{
			const updates = { email: "updated@example.com" };
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation = service.updateUser();
			await mutation.mutateAsync({ id: 1, user: updates });

			expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
		});

		it("should invalidate queries on success", async () =>
		{
			const updates = { email: "updated@example.com" };
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation = service.updateUser();
			await mutation.mutateAsync({ id: 1, user: updates });

			expect(
				queryClient.isFetching({ queryKey: ["users", 1] })
			).toBeGreaterThan(0);
			expect(
				queryClient.isFetching({ queryKey: ["users"] })
			).toBeGreaterThan(0);
		});
	});

	describe("deleteUser", () =>
	{
		it("should create mutation", () =>
		{
			const mutation = service.deleteUser();

			expect(mutation).toBeTruthy();
		});

		it("should delete user via mutation", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation = service.deleteUser();
			await mutation.mutateAsync(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should invalidate users query on success", async () =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			const mutation = service.deleteUser();
			await mutation.mutateAsync(1);

			expect(
				queryClient.isFetching({ queryKey: ["users"] })
			).toBeGreaterThan(0);
		});
	});
});
