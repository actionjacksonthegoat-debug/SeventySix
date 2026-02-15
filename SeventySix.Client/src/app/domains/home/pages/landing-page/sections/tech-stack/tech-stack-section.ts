import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CdnIconComponent } from "@shared/components";
import { ScrollRevealDirective } from "@shared/directives";
import { TechStackCategory } from "@home/models";

/**
 * Tech stack section — 3-column grid of technology categories.
 * Uses CDN-loaded SVG icons with Material icon fallback.
 */
@Component(
	{
		selector: "app-tech-stack-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatCardModule,
			MatIconModule,
			CdnIconComponent,
			ScrollRevealDirective
		],
		templateUrl: "./tech-stack-section.html",
		styleUrl: "./tech-stack-section.scss"
	})
export class TechStackSectionComponent
{
	/**
	 * Technology stack categories (Server, Client, Infrastructure) with their items.
	 * @type {InputSignal<readonly TechStackCategory[]>}
	 * @readonly
	 */
	readonly categories: InputSignal<readonly TechStackCategory[]> =
		input.required<readonly TechStackCategory[]>();
}
