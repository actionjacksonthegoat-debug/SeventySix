import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@shared/services/api.service";
import {
	createMockApiService,
	createTestQueryClient,
	MockApiService
} from "@shared/testing";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { vi } from "vitest";
import { AccountService } from "./account.service";

describe("AccountService",
	() =>
	{
		let service: AccountService;
		let queryClient: QueryClient;
		let mockApiService: MockApiService;

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService();
				queryClient =
					createTestQueryClient();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideTanStackQuery(queryClient),
							AccountService,
							{ provide: ApiService, useValue: mockApiService }
						]
					});

				service =
					TestBed.inject(AccountService);
			});

		afterEach(
			() => queryClient.clear());

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should invalidate user caches on updateProfile success",
			async () =>
			{
				mockApiService.put.mockReturnValue(of({}));
				const invalidateSpy: ReturnType<typeof vi.fn> =
					vi.spyOn(
						queryClient,
						"invalidateQueries");

				const mutation: ReturnType<typeof service.updateProfile> =
					TestBed.runInInjectionContext(
						() => service.updateProfile());
				await mutation.mutateAsync(
					{
						email: "test@example.com",
						fullName: "Test User"
					});

				expect(mockApiService.put)
					.toHaveBeenCalledWith(
						"users/me",
						expect.objectContaining(
							{
								email: "test@example.com",
								fullName: "Test User"
							}));
				// Cross-domain: invalidates users cache for admin panel and account profile
				expect(invalidateSpy)
					.toHaveBeenCalledWith(
						{
							queryKey: QueryKeys.users.all
						});
				expect(invalidateSpy)
					.toHaveBeenCalledWith(
						{
							queryKey: QueryKeys.account.profile
						});
			});

		it("should invalidate available roles on createPermissionRequest success",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));
				const invalidateSpy: ReturnType<typeof vi.fn> =
					vi.spyOn(
						queryClient,
						"invalidateQueries");

				const mutation: ReturnType<typeof service.createPermissionRequest> =
					TestBed.runInInjectionContext(
						() => service.createPermissionRequest());
				await mutation.mutateAsync(
					{
						requestedRoles: ["Admin"],
						requestMessage: "Test"
					});

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/me/permission-requests",
						expect.objectContaining(
							{
								requestedRoles: ["Admin"],
								requestMessage: "Test"
							}));
				expect(invalidateSpy)
					.toHaveBeenCalledWith(
						{
							queryKey: QueryKeys.account.availableRoles
						});
			});
	});
