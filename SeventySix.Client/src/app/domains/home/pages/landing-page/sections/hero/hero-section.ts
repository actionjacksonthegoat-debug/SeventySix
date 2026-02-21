import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

/**
 * Hero section component — parallax background with project title and CTAs.
 * All visual differentiation via `--landing-*` custom properties.
 */
@Component(
	{
		selector: "app-hero-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatButtonModule,
			MatIconModule
		],
		templateUrl: "./hero-section.html",
		styleUrl: "./hero-section.scss"
	})
export class HeroSectionComponent
{
	/**
	 * GitHub repository URL for the hero CTA button.
	 * @type {InputSignal<string>}
	 * @readonly
	 */
	readonly githubUrl: InputSignal<string> =
		input.required<string>();
}