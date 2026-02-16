import { ChangeDetectionStrategy, Component } from "@angular/core";
import { LandingPageComponent } from "@home/pages/landing-page/landing-page";

/**
 * Home page - main dashboard wrapper.
 *
 * Embeds the {@link LandingPageComponent} as the primary landing content.
 * Swapping dashboard content only requires changing the imports and template -
 * the route and host binding remain stable.
 */
@Component(
	{
		selector: "app-home",
		imports: [LandingPageComponent],
		templateUrl: "./home.component.html",
		styleUrl: "./home.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush,
		host: { class: "full-width-page" }
	})
export class HomeComponent
{}
