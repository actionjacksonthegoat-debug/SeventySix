import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

/**
 * Reusable page header with icon, title, subtitle, and action slot.
 * Used across admin pages for consistent layout.
 */
@Component(
	{
		selector: "app-page-header",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [MatIconModule],
		templateUrl: "./page-header.html",
		styleUrl: "./page-header.scss"
	})
export class PageHeaderComponent
{
	readonly icon: InputSignal<string | undefined> =
		input<string>();
	readonly title: InputSignal<string> =
		input.required<string>();
	readonly subtitle: InputSignal<string | undefined> =
		input<string>();
}
