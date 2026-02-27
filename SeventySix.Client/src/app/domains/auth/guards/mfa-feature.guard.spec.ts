import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, type Route, type UrlSegment, UrlTree } from "@angular/router";
import { FeatureFlagsService } from "@shared/services/feature-flags.service";
import { vi } from "vitest";
import { mfaFeatureGuard } from "./mfa-feature.guard";

describe("mfaFeatureGuard",
	() =>
	{
		function setup(mfaEnabled: boolean): ReturnType<ReturnType<typeof mfaFeatureGuard>>
		{
			const mockFeatureFlags: { mfaEnabled: ReturnType<typeof vi.fn>; } =
				{
					mfaEnabled: vi
						.fn()
						.mockReturnValue(mfaEnabled)
				};

			TestBed.configureTestingModule(
				{
					providers: [
						provideZonelessChangeDetection(),
						provideRouter([]),
						{ provide: FeatureFlagsService, useValue: mockFeatureFlags }
					]
				});

			const guardFn: ReturnType<typeof mfaFeatureGuard> =
				mfaFeatureGuard();

			// CanMatchFn receives route and segments but the guard ignores them
			return TestBed.runInInjectionContext(
				() =>
					guardFn({} as Route, [] as UrlSegment[]));
		}

		it("should return true when MFA is enabled",
			() =>
			{
				const result: ReturnType<ReturnType<typeof mfaFeatureGuard>> =
					setup(true);

				expect(result)
					.toBe(true);
			});

		it("should return a UrlTree redirecting to login when MFA is disabled",
			() =>
			{
				const result: ReturnType<ReturnType<typeof mfaFeatureGuard>> =
					setup(false);

				expect(result instanceof UrlTree)
					.toBe(true);
				expect((result as UrlTree).toString())
					.toBe("/auth/login");
			});
	});