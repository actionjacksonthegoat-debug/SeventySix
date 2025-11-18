import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { HttpParams } from "@angular/common/http";
import { of } from "rxjs";
import { UserRepository } from "./user.repository";
import { ApiService } from "@core/api-services/api.service";
import {
	User,
	UserQueryRequest,
	PagedResult,
	UpdateUserRequest
} from "@admin/users/models";

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
		isActive: true,
		createdBy: "admin",
		modifiedAt: "2024-01-02T00:00:00Z",
		modifiedBy: "admin",
		lastLoginAt: "2024-01-03T00:00:00Z",
		rowVersion: 1
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
			const updateRequest: UpdateUserRequest = {
				id: 1,
				username: "testuser",
				email: "updated@example.com",
				isActive: true,
				rowVersion: 1
			};
			mockApiService.put.and.returnValue(of(mockUser));

			repository.update(1, updateRequest).subscribe((result: User) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.put).toHaveBeenCalledWith(
					"User/1",
					updateRequest
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

	describe("getPaged", () =>
	{
		it("should get paged users with query params", (done) =>
		{
			const request: UserQueryRequest = {
				page: 1,
				pageSize: 10,
				searchTerm: "test",
				includeInactive: false,
				sortBy: "username",
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
			mockApiService.get.and.returnValue(of(pagedResult));

			repository
				.getPaged(request)
				.subscribe((result: PagedResult<User>) =>
				{
					expect(result).toEqual(pagedResult);
					expect(mockApiService.get).toHaveBeenCalledWith(
						"User/paged",
						jasmine.any(HttpParams)
					);
					done();
				});
		});
	});

	describe("getByUsername", () =>
	{
		it("should get user by username", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockUser));

			repository.getByUsername("testuser").subscribe((result: User) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"User/username/testuser"
				);
				done();
			});
		});
	});

	describe("checkUsername", () =>
	{
		it("should check username availability", (done) =>
		{
			mockApiService.get.and.returnValue(of(true));

			repository
				.checkUsername("testuser")
				.subscribe((result: boolean) =>
				{
					expect(result).toBe(true);
					expect(mockApiService.get).toHaveBeenCalledWith(
						"User/check/username/testuser"
					);
					done();
				});
		});

		it("should check username availability with excludeId", (done) =>
		{
			mockApiService.get.and.returnValue(of(false));

			repository
				.checkUsername("testuser", 5)
				.subscribe((result: boolean) =>
				{
					expect(result).toBe(false);
					expect(mockApiService.get).toHaveBeenCalledWith(
						"User/check/username/testuser",
						jasmine.any(HttpParams)
					);
					done();
				});
		});
	});

	describe("restore", () =>
	{
		it("should restore deleted user", (done) =>
		{
			mockApiService.post.and.returnValue(of(undefined));

			repository.restore(1).subscribe(() =>
			{
				expect(mockApiService.post).toHaveBeenCalledWith(
					"User/1/restore",
					{}
				);
				done();
			});
		});
	});

	describe("bulkActivate", () =>
	{
		it("should activate multiple users", (done) =>
		{
			const ids: number[] = [1, 2, 3];
			mockApiService.post.and.returnValue(of(3));

			repository.bulkActivate(ids).subscribe((result: number) =>
			{
				expect(result).toBe(3);
				expect(mockApiService.post).toHaveBeenCalledWith(
					"User/bulk/activate",
					ids
				);
				done();
			});
		});
	});

	describe("bulkDeactivate", () =>
	{
		it("should deactivate multiple users", (done) =>
		{
			const ids: number[] = [1, 2, 3];
			mockApiService.post.and.returnValue(of(3));

			repository.bulkDeactivate(ids).subscribe((result: number) =>
			{
				expect(result).toBe(3);
				expect(mockApiService.post).toHaveBeenCalledWith(
					"User/bulk/deactivate",
					ids
				);
				done();
			});
		});
	});
});
