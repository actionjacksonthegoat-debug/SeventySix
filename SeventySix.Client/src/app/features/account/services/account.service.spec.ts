import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@infrastructure/api-services/api.service";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { createMockApiService } from "@testing";
import { of } from "rxjs";
import { AccountService } from "./account.service";

describe("AccountService",
	() =>
	{
		let service: AccountService;
		let queryClient: QueryClient;
		let mockApiService: jasmine.SpyObj<ApiService>;

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService() as jasmine.SpyObj<ApiService>;

				queryClient =
					new QueryClient(
						{
							defaultOptions: { queries: { retry: false } }
						});

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideAngularQuery(queryClient),
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

		it("should invalidate account queries on updateProfile success",
			async () =>
			{
				mockApiService.put.and.returnValue(of({}));
				const invalidateSpy: jasmine.Spy =
					spyOn(
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
					jasmine.objectContaining(
						{
							email: "test@example.com",
							fullName: "Test User"
						}));
				expect(invalidateSpy)
				.toHaveBeenCalledWith(
					{
						queryKey: QueryKeys.account.all
					});
			});

		it("should invalidate available roles on createPermissionRequest success",
			async () =>
			{
				mockApiService.post.and.returnValue(of(undefined));
				const invalidateSpy: jasmine.Spy =
					spyOn(
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
					jasmine.objectContaining(
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
