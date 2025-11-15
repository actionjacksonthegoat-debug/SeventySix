import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { TokenStorageService } from "@core/services/token-storage.service";

/**
 * Auth interceptor.
 * Adds JWT authentication token to HTTP requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) =>
{
	const tokenStorage: TokenStorageService = inject(TokenStorageService);

	// Skip auth header for public endpoints
	if (req.url.includes("/public/") || req.url.includes("/auth/login"))
	{
		return next(req);
	}

	const token: string | null = tokenStorage.getAccessToken();

	if (token)
	{
		// Clone request and add authorization header
		const authReq: typeof req = req.clone({
			headers: req.headers.set("Authorization", `Bearer ${token}`)
		});

		return next(authReq);
	}

	return next(req);
};
