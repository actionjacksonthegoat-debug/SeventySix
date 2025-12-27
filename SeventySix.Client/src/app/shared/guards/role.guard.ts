/**
 * Role guard factory.
 * DRY: Single factory creates guards for any role combination.
 *
 * Roles are ADDITIVE - user with Developer + Admin can access both.
 *
 * @example
 * // Auth only (any logged-in user)
 * canActivate: [roleGuard()]
 *
 * // Admin only
 * canActivate: [roleGuard("Admin")]
 *
 * // Developer OR Admin (additive)
 * canActivate: [roleGuard("Developer", "Admin")]
 */


import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";

/**
 * Creates an Angular CanActivate guard that enforces authentication and optional role requirements.
 * @param {string[]} requiredRoles
 * Roles required for access. If empty, only authentication is required.
 * @returns {CanActivateFn}
 * A function suitable for use in route `canActivate` that returns `true` to allow, or a `UrlTree` to redirect.
 */
export function roleGuard(...requiredRoles: string[]): CanActivateFn
{
	return (route, state) =>
	{
		const authService: AuthService =
			inject(AuthService);
		const router: Router =
			inject(Router);

		// Not authenticated - redirect to login
		if (!authService.isAuthenticated())
		{
			return router.createUrlTree(
				["/auth/login"],
				{
					queryParams: { returnUrl: state.url }
				});
		}

		// No roles required - just needs auth
		if (requiredRoles.length === 0)
		{
			return true;
		}

		// Check if user has ANY of the required roles (additive)
		const hasRequiredRole: boolean =
			authService.hasAnyRole(
				...requiredRoles);

		if (hasRequiredRole)
		{
			return true;
		}

		// Has auth but wrong role - redirect to home
		return router.createUrlTree(
			["/"]);
	};
}
