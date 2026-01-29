/**
 * Role guard factory.
 * DRY: Single factory creates guards for any role combination.
 *
 * Roles are ADDITIVE - user with Developer + Admin can access both.
 *
 * Now supports both canActivate and canMatch. Prefer canMatch for protected
 * routes to prevent lazy module download before authorization check.
 *
 * @example
 * // Auth only (any logged-in user)
 * canMatch: [roleGuard()]
 *
 * // Admin only
 * canMatch: [roleGuard("Admin")]
 *
 * // Developer OR Admin (additive)
 * canMatch: [roleGuard("Developer", "Admin")]
 */

import { inject } from "@angular/core";
import {
	CanMatchFn,
	Router,
	UrlTree
} from "@angular/router";
import { APP_ROUTES } from "@shared/constants";
import { AuthService } from "@shared/services/auth.service";

/**
 * Creates an Angular CanMatch guard that enforces authentication and optional role requirements.
 * canMatch runs BEFORE lazy loading modules, saving bandwidth for unauthorized users.
 * @param {string[]} requiredRoles
 * Roles required for access. If empty, only authentication is required.
 * @returns {CanMatchFn}
 * A function suitable for use in route `canMatch` that returns `true` to allow, or a `UrlTree` to redirect.
 */
export function roleGuard(...requiredRoles: string[]): CanMatchFn
{
	return () =>
	{
		const authService: AuthService =
			inject(AuthService);
		const router: Router =
			inject(Router);

		// Not authenticated - redirect to login
		if (!authService.isAuthenticated())
		{
			// Note: canMatch doesn't have access to state.url, so we redirect to login
			// without returnUrl. The login page can use window.location if needed.
			const redirectUrl: UrlTree =
				router.createUrlTree(
					[APP_ROUTES.AUTH.LOGIN]);
			return redirectUrl;
		}

		// No roles required - just needs auth
		if (requiredRoles.length === 0)
		{
			return true;
		}

		// Check if user has ANY of the required roles (additive)
		const hasRequiredRole: boolean =
			authService.hasAnyRole(...requiredRoles);

		if (hasRequiredRole)
		{
			return true;
		}

		// Has auth but wrong role - redirect to home
		const homeUrl: UrlTree =
			router.createUrlTree(
				["/"]);
		return homeUrl;
	};
}
