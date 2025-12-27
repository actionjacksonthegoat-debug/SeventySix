/**
 * Options for confirmation dialogs.
 */
export interface ConfirmOptions
{
	/**
	 * Title to display in the confirmation dialog.
	 * @type {string}
	 */
	title: string;

	/**
	 * Message body describing the action to confirm.
	 * @type {string}
	 */
	message: string;

	/**
	 * Optional confirm button label.
	 * @type {string | undefined}
	 */
	confirmText?: string;

	/**
	 * Optional cancel button label.
	 * @type {string | undefined}
	 */
	cancelText?: string;
}
