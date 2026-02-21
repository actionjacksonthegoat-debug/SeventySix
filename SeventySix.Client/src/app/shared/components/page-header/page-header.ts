import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component(
	{
		selector: "app-page-header",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [MatIconModule],
		templateUrl: "./page-header.html",
		styleUrl: "./page-header.scss"
	})
/**
 * Reusable page header component.
 *
 * Renders an optional icon, required title, optional subtitle and an
 * action slot. Use across pages to provide consistent page-level headings.
 */
export class PageHeaderComponent
{
	/**
	 * Optional icon name to show in the page header (Material icon name).
	 * @type {InputSignal<string | undefined>}
	 */
	readonly icon: InputSignal<string | undefined> =
		input<string>();

	/**
	 * Page title text (required).
	 * @type {InputSignal<string>}
	 */
	readonly title: InputSignal<string> =
		input.required<string>();

	/**
	 * Optional subtitle text displayed beneath the title.
	 * @type {InputSignal<string | undefined>}
	 */
	readonly subtitle: InputSignal<string | undefined> =
		input<string>();
}