import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { CacheCoordinationService } from "@shared/services/cache-coordination.service";
import { createTestQueryClient } from "@shared/testing";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { vi } from "vitest";

describe("CacheCoordinationService",
	() =>
	{
		let service: CacheCoordinationService;
		let queryClient: QueryClient;
		let invalidateSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(
			() =>
			{
				queryClient =
					createTestQueryClient();

				invalidateSpy =
					vi.spyOn(queryClient, "invalidateQueries");

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideTanStackQuery(queryClient),
							CacheCoordinationService
						]
					});

				service =
					TestBed.inject(CacheCoordinationService);
			});

		afterEach(
			() =>
			{
				queryClient.clear();
				vi.clearAllMocks();
			});

		describe("invalidateUserAccountCache",
			() =>
			{
				it("should invalidate account profile cache",
					() =>
					{
						service.invalidateUserAccountCache(123);

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.account.profile
								});
					});

				it("should invalidate account available roles cache",
					() =>
					{
						service.invalidateUserAccountCache(123);

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.account.availableRoles
								});
					});

				it("should accept string userId",
					() =>
					{
						service.invalidateUserAccountCache("user-456");

						expect(invalidateSpy)
							.toHaveBeenCalledTimes(2);
					});
			});

		describe("invalidatePermissionCaches",
			() =>
			{
				it("should invalidate permission requests cache",
					() =>
					{
						service.invalidatePermissionCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.permissionRequests.all
								});
					});

				it("should invalidate account available roles cache",
					() =>
					{
						service.invalidatePermissionCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.account.availableRoles
								});
					});

				it("should invalidate both caches",
					() =>
					{
						service.invalidatePermissionCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledTimes(2);
					});
			});

		describe("invalidateAllUserCaches",
			() =>
			{
				it("should invalidate all users cache",
					() =>
					{
						service.invalidateAllUserCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.users.all
								});
					});

				it("should invalidate account profile cache",
					() =>
					{
						service.invalidateAllUserCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: QueryKeys.account.profile
								});
					});

				it("should invalidate both caches",
					() =>
					{
						service.invalidateAllUserCaches();

						expect(invalidateSpy)
							.toHaveBeenCalledTimes(2);
					});
			});
	});
