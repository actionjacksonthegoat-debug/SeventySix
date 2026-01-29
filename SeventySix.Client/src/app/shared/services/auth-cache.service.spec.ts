import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { PLATFORM_ID, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "@environments/environment";
import { AuthResponse } from "@shared/models";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient,
	QueryState
} from "@tanstack/angular-query-experimental";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";

/**
 * Tests for AuthService cache integration with TanStack Query.
 *
 * These tests verify:
 * - Cache is cleared on logout (security: prevent data leakage)
 * - Cache is invalidated on login (ensure fresh data for new session)
 */
describe("AuthService Cache Integration",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;
		let queryClient: QueryClient;

		/** Default login credentials for test cases */
		const TEST_LOGIN: { usernameOrEmail: string; password: string; rememberMe: boolean; } =
			{
				usernameOrEmail: "testuser",
				password: "Password123",
				rememberMe: false
			};

		beforeEach(
			() =>
			{
				queryClient =
					createTestQueryClient();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							provideRouter([]),
							provideTanStackQuery(queryClient),
							{ provide: PLATFORM_ID, useValue: "browser" },
							AuthService
						]
					});

				service =
					TestBed.inject(AuthService);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify();
			});

		describe("login cache invalidation",
			() =>
			{
				it("should invalidate account cache on successful login",
					() =>
					{
						// Seed cache with stale data from previous session
						queryClient.setQueryData(
							["account"],
							{
								stale: true
							});

						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(TEST_LOGIN)
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// Assert - query should be invalidated
						const accountState: QueryState | undefined =
							queryClient.getQueryState(
								["account"]);
						expect(accountState?.isInvalidated)
							.toBe(true);
					});
			});

		describe("logout cache clearing",
			() =>
			{
				it("should clear TanStack Query cache on forceLogoutLocally",
					() =>
					{
						// Seed query cache with test data
						queryClient.setQueryData(
							["accountData"],
							{
								profile: "user data"
							});

						expect(
							queryClient.getQueryData(
								["accountData"]))
							.toBeDefined();

						service.forceLogoutLocally();

						// Cache should be cleared
						expect(
							queryClient.getQueryData(
								["accountData"]))
							.toBeUndefined();
					});
			});
	});
