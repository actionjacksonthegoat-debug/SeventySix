import {
	ApplicationConfig,
	ErrorHandler,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection
} from "@angular/core";
import { provideRouter } from "@angular/router";
import {
	provideHttpClient,
	withInterceptors,
	withXsrfConfiguration
} from "@angular/common/http";

import { routes } from "./app.routes";
import {
	errorInterceptor,
	loggingInterceptor,
	authInterceptor,
	cacheInterceptor
} from "@core/interceptors";
import { ErrorHandlerService } from "@core/services";

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(
			withInterceptors([
				cacheInterceptor, // Cache before auth/logging
				authInterceptor,
				loggingInterceptor,
				errorInterceptor
			]),
			// Enable XSRF protection
			withXsrfConfiguration({
				cookieName: "XSRF-TOKEN",
				headerName: "X-XSRF-TOKEN"
			})
		),
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		// Global error handler
		{ provide: ErrorHandler, useClass: ErrorHandlerService }
	]
};
