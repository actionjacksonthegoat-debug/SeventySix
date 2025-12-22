import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ActivatedRouteSnapshot,
	provideRouter,
	RouterStateSnapshot,
	UrlTree
} from "@angular/router";
import { CanActivateFn } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { vi, type Mock } from "vitest";
import { roleGuard } from "./role.guard";

interface MockAuthService
{
	isAuthenticated: Mock;
	hasAnyRole: Mock;
}

/** Role Guard Tests - DRY factory pattern */
describe("roleGuard",
	() =>
	{
		let authService: MockAuthService;

		beforeEach(
			() =>
			{
				authService =
					{
						isAuthenticated: vi.fn(),
						hasAnyRole: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideRouter([]),
							{ provide: AuthService, useValue: authService }
						]
					});
			});

		describe("roleGuard() - no roles required",
			() =>
			{
				it("should allow authenticated user",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);

						const guard: CanActivateFn =
							roleGuard();
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/protected" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBe(true);
					});

				it("should redirect unauthenticated user to login",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(false);

						const guard: CanActivateFn =
							roleGuard();
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/protected" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeInstanceOf(UrlTree);
						expect(result.toString())
							.toContain("/auth/login");
						expect(result.toString())
							.toContain("returnUrl=%2Fprotected");
					});
			});

		describe("roleGuard('Admin') - single role required",
			() =>
			{
				it("should allow admin user",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(true);

						const guard: CanActivateFn =
							roleGuard("Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/admin" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBe(true);
						expect(authService.hasAnyRole)
							.toHaveBeenCalledWith("Admin");
					});

				it("should redirect non-admin to home",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(false);

						const guard: CanActivateFn =
							roleGuard("Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/admin" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeInstanceOf(UrlTree);
						expect(result.toString())
							.toBe("/");
					});
			});

		describe("roleGuard('Developer', 'Admin') - multiple roles (OR)",
			() =>
			{
				it("should allow user with Developer role only",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBe(true);
					});

				it("should allow user with Admin role only",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBe(true);
					});

				it("should allow user with both roles",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBe(true);
					});

				it("should redirect user with neither role",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(true);
						authService.hasAnyRole.mockReturnValue(false);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeInstanceOf(UrlTree);
						expect(result.toString())
							.toBe("/");
					});
			});

		describe("unauthenticated with roles",
			() =>
			{
				it("should redirect to login even when checking roles",
					() =>
					{
						authService.isAuthenticated.mockReturnValue(false);

						const guard: CanActivateFn =
							roleGuard("Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/admin/users" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeInstanceOf(UrlTree);
						expect(result.toString())
							.toContain("/login");
						// Should NOT check roles if not authenticated
						expect(authService.hasAnyRole).not.toHaveBeenCalled();
					});
			});
	});
