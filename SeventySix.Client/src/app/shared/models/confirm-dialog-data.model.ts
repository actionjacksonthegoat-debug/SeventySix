/**
 * Confirmation dialog data interface.
 * Used by ConfirmDialogComponent and DialogService.
 */
export interface ConfirmDialogData
{
	/**
	 * Dialog title shown at the top of the confirm dialog.
	 * @type {string}
	 */
	title: string;

	/**
	 * Main message describing what is being confirmed.
	 * @type {string}
	 */
	message: string;

	/**
	 * Optional text to show on the confirm button (defaults to "Confirm").
	 * @type {string | undefined}
	 */
	confirmText?: string;

	/**
	 * Optional text to show on the cancel button (defaults to "Cancel").
	 * @type {string | undefined}
	 */
	cancelText?: string;

	/**
	 * Optional color theme for the confirm button (material color).
	 * @type {"primary" | "accent" | "warn" | undefined}
	 */
	confirmColor?: "primary" | "accent" | "warn";

	/**
	 * Optional icon name to display in the dialog header.
	 * @type {string | undefined}
	 */
	icon?: string;
}