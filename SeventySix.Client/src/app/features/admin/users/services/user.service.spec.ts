import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { of } from "rxjs";
import { UserRepository } from "@admin/users/repositories";
import { User } from "@admin/users/models";
import { UserService } from "./user.service";

describe("UserService", () =>
{
	let service: UserService;
	let mockRepository: jasmine.SpyObj<UserRepository>;

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

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				UserService,
				{ provide: UserRepository, useValue: mockRepository }
			]
		});

		service = TestBed.inject(UserService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("getAllUsers", () =>
	{
		it("should return users from repository", (done) =>
		{
			const users = [mockUser];
			mockRepository.getAll.and.returnValue(of(users));

			service.getAllUsers().subscribe((result) =>
			{
				expect(result).toEqual(users);
				expect(mockRepository.getAll).toHaveBeenCalled();
				done();
			});
		});
	});

	describe("getUserById", () =>
	{
		it("should return user by id", (done) =>
		{
			mockRepository.getById.and.returnValue(of(mockUser));

			service.getUserById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockRepository.getById).toHaveBeenCalledWith(1);
				done();
			});
		});
	});

	describe("createUser", () =>
	{
		it("should create user", (done) =>
		{
			const newUser = { username: "newuser", email: "new@example.com" };
			mockRepository.create.and.returnValue(of(mockUser));

			service.createUser(newUser).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockRepository.create).toHaveBeenCalledWith(newUser);
				done();
			});
		});
	});

	describe("updateUser", () =>
	{
		it("should update user", (done) =>
		{
			const updates = { email: "updated@example.com" };
			mockRepository.update.and.returnValue(of(mockUser));

			service.updateUser(1, updates).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
				done();
			});
		});
	});

	describe("deleteUser", () =>
	{
		it("should delete user", (done) =>
		{
			mockRepository.delete.and.returnValue(of(undefined));

			service.deleteUser(1).subscribe(() =>
			{
				expect(mockRepository.delete).toHaveBeenCalledWith(1);
				done();
			});
		});
	});
});
