import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of } from "rxjs";
import { UserRepository } from "./user.repository";
import { ApiService } from "@core/api-services/api.service";
import { User } from "@core/models/interfaces/user";

describe("UserRepository", () =>
{
	let repository: UserRepository;
	let mockApiService: jasmine.SpyObj<ApiService>;

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
		mockApiService = jasmine.createSpyObj("ApiService", [
			"get",
			"post",
			"put",
			"delete"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				UserRepository,
				{ provide: ApiService, useValue: mockApiService }
			]
		});

		repository = TestBed.inject(UserRepository);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	describe("getAll", () =>
	{
		it("should get all users", (done) =>
		{
			const users = [mockUser];
			mockApiService.get.and.returnValue(of(users));

			repository.getAll().subscribe((result) =>
			{
				expect(result).toEqual(users);
				expect(mockApiService.get).toHaveBeenCalledWith("User");
				done();
			});
		});
	});

	describe("getById", () =>
	{
		it("should get user by id", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockUser));

			repository.getById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.get).toHaveBeenCalledWith("User/1");
				done();
			});
		});
	});

	describe("create", () =>
	{
		it("should create user", (done) =>
		{
			const newUser = { username: "newuser", email: "new@example.com" };
			mockApiService.post.and.returnValue(of(mockUser));

			repository.create(newUser).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.post).toHaveBeenCalledWith(
					"User",
					newUser
				);
				done();
			});
		});
	});

	describe("update", () =>
	{
		it("should update user", (done) =>
		{
			const updates = { email: "updated@example.com" };
			mockApiService.put.and.returnValue(of(mockUser));

			repository.update(1, updates).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.put).toHaveBeenCalledWith(
					"User/1",
					updates
				);
				done();
			});
		});
	});

	describe("delete", () =>
	{
		it("should delete user", (done) =>
		{
			mockApiService.delete.and.returnValue(of(undefined));

			repository.delete(1).subscribe(() =>
			{
				expect(mockApiService.delete).toHaveBeenCalledWith("User/1");
				done();
			});
		});
	});
});
