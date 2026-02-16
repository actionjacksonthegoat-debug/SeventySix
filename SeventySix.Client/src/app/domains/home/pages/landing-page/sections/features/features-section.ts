import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { FeatureHighlight } from "@home/models";
import { ScrollRevealDirective } from "@shared/directives";

/**
 * Features section — alternating left/right layout of feature highlights.
 * Each feature has an icon, tagline, description, and bullet list.
 */
@Component(
	{
		selector: "app-features-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatCardModule,
			MatIconModule,
			ScrollRevealDirective
		],
		templateUrl: "./features-section.html",
		styleUrl: "./features-section.scss"
	})
export class FeaturesSectionComponent
{
	/**
	 * Feature highlight entries with icon, tagline, description, and bullet list.
	 * @type {InputSignal<readonly FeatureHighlight[]>}
	 * @readonly
	 */
	readonly features: InputSignal<readonly FeatureHighlight[]> =
		input.required<readonly FeatureHighlight[]>();
}
