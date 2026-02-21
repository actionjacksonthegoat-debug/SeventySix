import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	CanMatchFn,
	provideRouter,
	Route,
	UrlSegment,
	UrlTree
} from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { type Mock, vi } from "vitest";
import { passwordChangeGuard } from "./password-change.guard";

interface MockAuthService
{
	isAuthenticated: Mock;
	requiresPasswordChange: Mock;
}

/**
 * Password Change Guard Tests
 */
describe("passwordChangeGuard",
	() =>
	{
		let authService: MockAuthService;

		beforeEach(
			() =>
			{
				authService =
					{
						isAuthenticated: vi.fn(),
						requiresPasswordChange: vi.fn()
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

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should allow navigation when not authenticated",
			() =>
			{
				authService.isAuthenticated.mockReturnValue(false);

				const guard: CanMatchFn =
					passwordChangeGuard();
				const result: boolean | UrlTree =
					TestBed.runInInjectionContext(
						() =>
							guard(
								{} as Route,
								[] as UrlSegment[])) as boolean | UrlTree;

				expect(result)
					.toBe(true);
			});

		it("should allow navigation when password change not required",
			() =>
			{
				authService.isAuthenticated.mockReturnValue(true);
				authService.requiresPasswordChange.mockReturnValue(false);

				const guard: CanMatchFn =
					passwordChangeGuard();
				const result: boolean | UrlTree =
					TestBed.runInInjectionContext(
						() =>
							guard(
								{} as Route,
								[] as UrlSegment[])) as boolean | UrlTree;

				expect(result)
					.toBe(true);
			});

		it("should redirect to change password when required",
			() =>
			{
				authService.isAuthenticated.mockReturnValue(true);
				authService.requiresPasswordChange.mockReturnValue(true);

				const guard: CanMatchFn =
					passwordChangeGuard();
				const result: boolean | UrlTree =
					TestBed.runInInjectionContext(
						() =>
							guard(
								{} as Route,
								[] as UrlSegment[])) as boolean | UrlTree;

				expect(result)
					.toBeInstanceOf(UrlTree);
				expect(result.toString())
					.toContain("/auth/change-password");
			});

		it("should include returnUrl in redirect query params",
			() =>
			{
				authService.isAuthenticated.mockReturnValue(true);
				authService.requiresPasswordChange.mockReturnValue(true);

				const segments: UrlSegment[] =
					[
						new UrlSegment("account", {}),
						new UrlSegment("profile", {})
					];

				const guard: CanMatchFn =
					passwordChangeGuard();
				const result: boolean | UrlTree =
					TestBed.runInInjectionContext(
						() =>
							guard(
								{} as Route,
								segments)) as boolean | UrlTree;

				expect(result)
					.toBeInstanceOf(UrlTree);

				const resultString: string =
					result.toString();
				expect(resultString)
					.toContain("returnUrl");
				expect(decodeURIComponent(resultString))
					.toContain("account/profile");
			});
	});