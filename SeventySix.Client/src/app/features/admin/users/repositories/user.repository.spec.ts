import { TestBed } from "@angular/core/testing";
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
import { setupRepositoryTest, createMockApiService } from "@testing";

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
		mockApiService = createMockApiService();

		repository = setupRepositoryTest(UserRepository, [
			{ provide: ApiService, useValue: mockApiService }
		]);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	describe("getById", () =>
	{
		it("should get user by id", (done) =>
		{
			mockApiService.get.and.returnValue(of(mockUser));

			repository.getById(1).subscribe((result) =>
			{
				expect(result).toEqual(mockUser);
				expect(mockApiService.get).toHaveBeenCalledWith(
					"users/1",
					undefined,
					jasmine.anything()
				);
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
						"users/paged",
						jasmine.any(HttpParams),
						jasmine.anything()
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
					"users/username/testuser",
					undefined,
					jasmine.anything()
				);
				done();
			});
		});
	});
});
