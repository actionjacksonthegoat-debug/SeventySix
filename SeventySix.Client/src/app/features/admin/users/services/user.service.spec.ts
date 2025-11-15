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
			const updates: Partial<User> = { email: "updated@example.com" };
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation: ReturnType<typeof service.updateUser> =
				TestBed.runInInjectionContext(() => service.updateUser());
			await mutation.mutateAsync({ id: 1, user: updates });

			expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
		});

		it("should invalidate queries on success", async () =>
		{
			const updates: Partial<User> = { email: "updated@example.com" };
			mockRepository.update.and.returnValue(of(mockUser));

			const mutation: ReturnType<typeof service.updateUser> =
				TestBed.runInInjectionContext(() => service.updateUser());
			await mutation.mutateAsync({ id: 1, user: updates });

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
});
