import { bootstrapApplication } from "@angular/platform-browser";
import { SwUpdateService } from "@shared/services";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

bootstrapApplication(App, appConfig)
	.then(
		(appRef) =>
		{
			// Trigger SW update service initialization via DI
			appRef.injector.get(SwUpdateService);
		})
	.catch(
		(err) => console.error(err));
