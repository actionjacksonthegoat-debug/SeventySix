import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { StatItem } from "@home/models";
import { CountUpDirective, ScrollRevealDirective } from "@shared/directives";

/**
 * Stats section — animated counter bar with project statistics.
 * Count-up animation triggered on scroll into viewport.
 */
@Component(
	{
		selector: "app-stats-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatIconModule,
			ScrollRevealDirective,
			CountUpDirective
		],
		templateUrl: "./stats-section.html",
		styleUrl: "./stats-section.scss"
	})
export class StatsSectionComponent
{
	/**
	 * Project stat items (assertions, test cases, dependencies, etc.).
	 * @type {InputSignal<readonly StatItem[]>}
	 * @readonly
	 */
	readonly stats: InputSignal<readonly StatItem[]> =
		input.required<readonly StatItem[]>();
}