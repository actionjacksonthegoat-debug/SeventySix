import {
	Directive,
	HostBinding,
	input,
	InputSignal
} from "@angular/core";

/**
 * Directive that enforces accessibility for icon-only buttons.
 * Automatically sets aria-label from the provided value.
 *
 * @example
 * ```html
 * <button mat-icon-button appAccessibleIconButton="Close menu">
 *     <mat-icon aria-hidden="true">close</mat-icon>
 * </button>
 * ```
 *
 * @wcag 1.1.1 Non-text Content (Level A)
 * @wcag 4.1.2 Name, Role, Value (Level A)
 */
@Directive(
	{
		selector: "button[mat-icon-button][appAccessibleIconButton]",
		standalone: true
	})
export class AccessibleIconButtonDirective
{
	/**
	 * The accessible label for the button.
	 * This value will be set as the aria-label attribute.
	 */
	readonly label: InputSignal<string> =
		input.required<string>(
			{
				alias: "appAccessibleIconButton"
			});

	@HostBinding("attr.aria-label")
	get ariaLabel(): string
	{
		return this.label();
	}
}
