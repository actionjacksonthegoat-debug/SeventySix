import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";
import { SwUpdateService } from "@infrastructure/services";

bootstrapApplication(App, appConfig)
	.then((appRef) =>
	{
		// Trigger SW update service initialization via DI
		appRef.injector.get(SwUpdateService);
	})
	.catch((err) => console.error(err));
