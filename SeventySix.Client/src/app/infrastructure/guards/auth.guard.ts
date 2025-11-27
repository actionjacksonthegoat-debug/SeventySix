import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { LoggerService } from "@infrastructure/services/logger.service";
import { TokenStorageService } from "@infrastructure/services/token-storage.service";
import { NotificationService } from "@infrastructure/services/notification.service";

/**
 * Authentication guard.
 * Prevents access to routes for unauthenticated users.
 */
export const authGuard: CanActivateFn = (route, state) =>
{
	const logger: LoggerService = inject(LoggerService);
	const tokenStorage: TokenStorageService = inject(TokenStorageService);
	const notification: NotificationService = inject(NotificationService);

	const isAuthenticated: boolean = tokenStorage.isAuthenticated();

	if (!isAuthenticated)
	{
		logger.warning("Unauthorized access attempt", {
			route: state.url
		});

		notification.error("You must be logged in to access this page.");

		// TODO: Redirect to login page when implemented
		// const router = inject(Router);
		// return router.createUrlTree(['/login'], {
		// 	queryParams: { returnUrl: state.url },
		// });

		return false;
	}

	return true;
};
