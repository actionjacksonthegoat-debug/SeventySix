/**
 * Shared snackbar utility for consistent notification behavior.
 * Provides DRY abstraction over Material MatSnackBar.
 */

import { MatSnackBar } from "@angular/material/snack-bar";
import { SnackbarType } from "@shared/constants/snackbar.constants";

/**
 * Shows a snackbar notification with consistent configuration.
 * @param snackBar - The Material snackbar service
 * @param message - The message to display
 * @param type - The type of snackbar (Success or Error)
 */
export function showSnackbar(
	snackBar: MatSnackBar,
	message: string,
	type: SnackbarType =
		SnackbarType.Success): void
{
	const duration: number =
		type === SnackbarType.Error ? 5000 : 3000;

	snackBar.open(
		message,
		"Close",
		{
			duration,
			horizontalPosition: "end",
			verticalPosition: "top"
		});
}
