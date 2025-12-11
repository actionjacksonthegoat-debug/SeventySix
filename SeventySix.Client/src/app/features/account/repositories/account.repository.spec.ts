import { of } from "rxjs";
import { AccountRepository } from "./account.repository";
import { ApiService } from "@infrastructure/api-services/api.service";
import { UserProfileDto, UpdateProfileRequest, CreatePermissionRequestDto } from "../models";
import { setupRepositoryTest, createMockApiService } from "@testing";

describe("AccountRepository", () =>
{
	let repository: AccountRepository;
	let mockApiService: jasmine.SpyObj<ApiService>;
	const endpoint: string = "users/me";

	beforeEach(() =>
	{
		mockApiService = createMockApiService() as jasmine.SpyObj<ApiService>;
		repository = setupRepositoryTest(AccountRepository, [
			{ provide: ApiService, useValue: mockApiService }
		]);
	});

	it("should be created", () =>
	{
		expect(repository).toBeTruthy();
	});

	it("should GET profile from /auth/me", (done) =>
	{
		const mockProfile: UserProfileDto = {
			id: 1,
			username: "testuser",
			email: "test@example.com", fullName: "Test User",
			roles: ["User"],
			hasPassword: true,
			linkedProviders: [],
			lastLoginAt: "2024-01-01T12:00:00Z"
		};
		mockApiService.get.and.returnValue(of(mockProfile));

		repository.getProfile().subscribe((profile: UserProfileDto) =>
		{
			expect(profile).toEqual(mockProfile);
			expect(mockApiService.get).toHaveBeenCalledWith("auth/me");
			done();
		});
	});

	it("should PUT profile update to /users/me", (done) =>
	{
		const request: UpdateProfileRequest = {
			email: "new@example.com", fullName: "New Name"
		};
		mockApiService.put.and.returnValue(of({} as UserProfileDto));

		repository.updateProfile(request).subscribe(() =>
		{
			expect(mockApiService.put).toHaveBeenCalledWith(endpoint, request);
			done();
		});
	});

	it("should GET available roles from /users/me/available-roles", (done) =>
	{
		mockApiService.get.and.returnValue(of([]));

		repository.getAvailableRoles().subscribe(() =>
		{
			expect(mockApiService.get).toHaveBeenCalledWith(
				`${endpoint}/available-roles`
			);
			done();
		});
	});

	it("should POST permission request to /users/me/permission-requests", (done) =>
	{
		const request: CreatePermissionRequestDto = {
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
