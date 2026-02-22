/**
 * Password change guard factory.
 * Blocks navigation when the authenticated user has a pending required password change.
 * Redirects to /auth/change-password with the intended URL as returnUrl.
 *
 * This guard runs BEFORE roleGuard() and only activates for authenticated users.
 * Unauthenticated users pass through (roleGuard handles login redirect).
 *
 * @example
 * canMatch: [passwordChangeGuard(), roleGuard()]
 */

import { inject } from "@angular/core";
import {
	CanMatchFn,
	Route,
	Router,
	UrlSegment,
	UrlTree
} from "@angular/router";
import { APP_ROUTES } from "@shared/constants";
import { AuthService } from "@shared/services/auth.service";

/**
 * Creates an Angular CanMatch guard that blocks navigation when the user must change their password.
 *
 * @returns {CanMatchFn}
 * A function suitable for use in route `canMatch` that returns `true` to allow,
 * or a `UrlTree` to redirect to change-password.
 */
export function passwordChangeGuard(): CanMatchFn
{
	return (route: Route, segments: UrlSegment[]) =>
	{
		const authService: AuthService =
			inject(AuthService);
		const router: Router =
			inject(Router);

		if (!authService.isAuthenticated())
		{
			return true;
		}

		if (!authService.requiresPasswordChange())
		{
			return true;
		}

		const targetPath: string =
			segments
				.map((segment) => segment.path)
				.join("/");

		const redirectUrl: UrlTree =
			router.createUrlTree(
				[APP_ROUTES.AUTH.CHANGE_PASSWORD],
				{
					queryParams: {
						required: "true",
						returnUrl: `/${targetPath}`
					}
				});

		return redirectUrl;
	};
}