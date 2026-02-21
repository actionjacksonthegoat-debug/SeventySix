import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { APP_ROUTES } from "@shared/constants";
import { FeatureFlagsService } from "@shared/services";

/**
 * Route guard factory that blocks access when MFA is disabled via feature flags.
 * Prevents the route from matching at all, keeping the URL clean and avoiding flicker.
 * Redirects to the login page if MFA is not enabled.
 */
export function mfaFeatureGuard(): CanMatchFn
{
	return () =>
	{
		const featureFlags: FeatureFlagsService =
			inject(FeatureFlagsService);
		const router: Router =
			inject(Router);

		if (!featureFlags.mfaEnabled())
		{
			return router.createUrlTree(
				[APP_ROUTES.AUTH.LOGIN]);
		}

		return true;
	};
}