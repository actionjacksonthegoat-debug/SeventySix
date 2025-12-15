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
import { roleGuard } from "./role.guard";

/** Role Guard Tests - DRY factory pattern */
describe("roleGuard",
	() =>
	{
		let authService: jasmine.SpyObj<AuthService>;

		beforeEach(
			() =>
			{
				authService =
					jasmine.createSpyObj("AuthService",
						[
							"isAuthenticated",
							"hasAnyRole"
						]);

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
						authService.isAuthenticated.and.returnValue(true);

						const guard: CanActivateFn =
							roleGuard();
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/protected" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeTrue();
					});

				it("should redirect unauthenticated user to login",
					() =>
					{
						authService.isAuthenticated.and.returnValue(false);

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
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(true);

						const guard: CanActivateFn =
							roleGuard("Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/admin" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeTrue();
						expect(authService.hasAnyRole)
							.toHaveBeenCalledWith("Admin");
					});

				it("should redirect non-admin to home",
					() =>
					{
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(false);

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
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeTrue();
					});

				it("should allow user with Admin role only",
					() =>
					{
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeTrue();
					});

				it("should allow user with both roles",
					() =>
					{
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(true);

						const guard: CanActivateFn =
							roleGuard("Developer", "Admin");
						const result: boolean | UrlTree =
							TestBed.runInInjectionContext(
								() =>
									guard(
										{} as ActivatedRouteSnapshot,
										{ url: "/style-guide" } as RouterStateSnapshot)) as boolean | UrlTree;

						expect(result)
							.toBeTrue();
					});

				it("should redirect user with neither role",
					() =>
					{
						authService.isAuthenticated.and.returnValue(true);
						authService.hasAnyRole.and.returnValue(false);

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
						authService.isAuthenticated.and.returnValue(false);

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
