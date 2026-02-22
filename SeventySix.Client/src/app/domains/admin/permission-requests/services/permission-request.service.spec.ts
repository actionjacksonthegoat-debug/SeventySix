import {
	CreatePermissionRequestDto,
	PermissionRequestDto
} from "@admin/permission-requests/models";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@shared/services/api.service";
import { CacheCoordinationService } from "@shared/services/cache-coordination.service";
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
import { PermissionRequestService } from "./permission-request.service";

describe("PermissionRequestService",
	() =>
	{
		let service: PermissionRequestService;
		let queryClient: QueryClient;
		let mockApiService: MockApiService;
		let mockCacheCoordination: { invalidatePermissionCaches: ReturnType<typeof vi.fn>; };

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService();
				queryClient =
					createTestQueryClient();
				mockCacheCoordination =
					{
						invalidatePermissionCaches: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideTanStackQuery(queryClient),
							PermissionRequestService,
							{ provide: ApiService, useValue: mockApiService },
							{ provide: CacheCoordinationService, useValue: mockCacheCoordination }
						]
					});

				service =
					TestBed.inject(PermissionRequestService);
			});

		afterEach(
			() => queryClient.clear());

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should fetch permission requests via GET on getAllRequests",
			async () =>
			{
				const mockRequests: PermissionRequestDto[] =
					[
						{
							id: 1,
							userId: 10,
							username: "testuser",
							requestedRole: "Developer",
							requestMessage: "Need access",
							createDate: "2024-01-01T00:00:00Z",
							createdBy: "testuser"
						}
					];

				mockApiService.get.mockReturnValue(of(mockRequests));

				const query: ReturnType<typeof service.getAllRequests> =
					TestBed.runInInjectionContext(
						() => service.getAllRequests());
				await query.refetch();

				expect(mockApiService.get)
					.toHaveBeenCalledWith("users/permission-requests");
				expect(QueryKeys.permissionRequests.list)
					.toBeDefined();
			});

		it("should fetch available roles via GET on getAvailableRoles",
			async () =>
			{
				mockApiService.get.mockReturnValue(of([]));
				const query: ReturnType<typeof service.getAvailableRoles> =
					TestBed.runInInjectionContext(
						() => service.getAvailableRoles());
				await query.refetch();

				expect(mockApiService.get)
					.toHaveBeenCalledWith("users/me/available-roles");
			});

		it("should POST to create permission request and invalidate caches",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));
				const invalidateSpy: ReturnType<typeof vi.fn> =
					vi.spyOn(
						queryClient,
						"invalidateQueries");

				const mutation: ReturnType<typeof service.createRequest> =
					TestBed.runInInjectionContext(
						() => service.createRequest());

				const request: CreatePermissionRequestDto =
					{
						requestedRoles: ["Developer"],
						requestMessage: "Need access for project"
					};

				await mutation.mutateAsync(request);

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/me/permission-requests",
						request);
				expect(invalidateSpy)
					.toHaveBeenCalled();
			});

		it("should POST to approve request and invalidate permission caches",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));

				const mutation: ReturnType<typeof service.approveRequest> =
					TestBed.runInInjectionContext(
						() => service.approveRequest());
				await mutation.mutateAsync(1);

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/permission-requests/1/approve",
						{});
				expect(mockCacheCoordination.invalidatePermissionCaches)
					.toHaveBeenCalled();
			});

		it("should POST to reject request and invalidate permission caches",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));

				const mutation: ReturnType<typeof service.rejectRequest> =
					TestBed.runInInjectionContext(
						() => service.rejectRequest());
				await mutation.mutateAsync(2);

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/permission-requests/2/reject",
						{});
				expect(mockCacheCoordination.invalidatePermissionCaches)
					.toHaveBeenCalled();
			});

		it("should POST to bulk approve and invalidate permission caches",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(3));

				const mutation: ReturnType<typeof service.bulkApproveRequests> =
					TestBed.runInInjectionContext(
						() => service.bulkApproveRequests());
				await mutation.mutateAsync(
					[1, 2, 3]);

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/permission-requests/bulk/approve",
						[1, 2, 3]);
				expect(mockCacheCoordination.invalidatePermissionCaches)
					.toHaveBeenCalled();
			});

		it("should POST to bulk reject and invalidate permission caches",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(2));

				const mutation: ReturnType<typeof service.bulkRejectRequests> =
					TestBed.runInInjectionContext(
						() => service.bulkRejectRequests());
				await mutation.mutateAsync(
					[4, 5]);

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/permission-requests/bulk/reject",
						[4, 5]);
				expect(mockCacheCoordination.invalidatePermissionCaches)
					.toHaveBeenCalled();
			});
	});