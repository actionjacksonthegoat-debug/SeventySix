import { of } from "rxjs";
import { AccountRepository } from "./account.repository";
import { ApiService } from "@infrastructure/api-services/api.service";
import { Profile, UpdateProfileRequest, CreatePermissionRequest } from "../models";
import { setupRepositoryTest, createMockApiService } from "@testing";

describe("AccountRepository", () =>
{
	let repository: AccountRepository;
	let mockApiService: jasmine.SpyObj<ApiService>;
	const endpoint: string = "users/me";

	beforeEach(() =>
	{
		mockApiService = createMockApiService() as jasmine.SpyObj<ApiService>;
		repository = setupRepositoryTest(
			AccountRepository,
			[{ provide: ApiService, useValue: mockApiService }]
		);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	it("should GET profile from /users/me", (done) =>
	{
		const mockProfile: Profile =
		{
			id: 1,
			username: "testuser",
			email: "test@example.com",
			createDate: "2024-01-01",
			roles: ["User"]
		};
		mockApiService.get.and.returnValue(of(mockProfile));

		repository.getProfile().subscribe((profile: Profile) =>
		{
			expect(profile).toEqual(mockProfile);
			expect(mockApiService.get).toHaveBeenCalledWith(endpoint);
			done();
		});
	});

	it("should PUT profile update to /users/me", (done) =>
	{
		const request: UpdateProfileRequest =
		{
			email: "new@example.com",
			fullName: "New Name"
		};
		mockApiService.put.and.returnValue(of({} as Profile));

		repository.updateProfile(request).subscribe(() =>
		{
			expect(mockApiService.put).toHaveBeenCalledWith(
				endpoint,
				request
			);
			done();
		});
	});

	it("should GET available roles from /users/me/available-roles", (done) =>
	{
		mockApiService.get.and.returnValue(of([]));

		repository.getAvailableRoles().subscribe(() =>
		{
			expect(mockApiService.get).toHaveBeenCalledWith(`${endpoint}/available-roles`);
			done();
		});
	});

	it("should POST permission request to /users/me/permission-requests", (done) =>
	{
		const request: CreatePermissionRequest =
		{
			requestedRoles: ["Admin"],
			requestMessage: "Need access"
		};
		mockApiService.post.and.returnValue(of(undefined));

		repository.createPermissionRequest(request).subscribe(() =>
		{
			expect(mockApiService.post).toHaveBeenCalledWith(
				`${endpoint}/permission-requests`,
				request
			);
			done();
		});
	});
});
