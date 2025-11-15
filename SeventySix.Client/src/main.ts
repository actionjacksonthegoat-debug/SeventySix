import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";
import { SwUpdateService } from "@core/services";

bootstrapApplication(App, appConfig)
	.then((appRef) =>
	{
		// Initialize Service Worker update service
		const swUpdateService: SwUpdateService =
			appRef.injector.get(SwUpdateService);
		swUpdateService.init();
	})
	.catch((err) => console.error(err));
