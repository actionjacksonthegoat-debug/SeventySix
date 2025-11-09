import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { TokenStorageService } from "../services/token-storage.service";

/**
 * Auth interceptor.
 * Adds JWT authentication token to HTTP requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) =>
{
	const tokenStorage = inject(TokenStorageService);

	// Skip auth header for public endpoints
	if (req.url.includes("/public/") || req.url.includes("/auth/login"))
	{
		return next(req);
	}

	const token = tokenStorage.getAccessToken();

	if (token)
	{
		// Clone request and add authorization header
		const authReq = req.clone({
			headers: req.headers.set("Authorization", `Bearer ${token}`)
		});

		return next(authReq);
	}

	return next(req);
};
