import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "@shared/components";
import { ConfirmDialogData, ConfirmOptions } from "@shared/models";
import { map, Observable } from "rxjs";

/**
 * Dialog service providing standardized confirmation dialogs.
 * Wraps MatDialog with convenience methods for common operations.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class DialogService
{
	/**
	 * MatDialog service for opening modal dialogs.
	 * @type {MatDialog}
	 * @private
	 * @readonly
	 */
	private readonly dialog: MatDialog =
		inject(MatDialog);

	/**
	 * Shows a generic confirmation dialog.
	 * @param {ConfirmOptions} options
	 * The dialog configuration options used to build the confirm dialog.
	 * @returns {Observable<boolean>}
	 * Observable that emits true when confirmed, false when cancelled.
	 */
	confirm(options: ConfirmOptions): Observable<boolean>
	{
		const dialogData: ConfirmDialogData =
			{
				title: options.title,
				message: options.message,
				confirmText: options.confirmText ?? "Confirm",
				cancelText: options.cancelText ?? "Cancel",
				confirmColor: "primary"
			};

		return this
		.dialog
		.open(ConfirmDialogComponent,
			{ data: dialogData })
		.afterClosed()
		.pipe(
			map(
				(result: boolean | undefined): boolean =>
					result === true));
	}

	/**
	 * Shows a delete confirmation dialog with warn styling.
	 * @param {string} itemName
	 * The name of the item being deleted (e.g., "log", "user").
	 * @param {number} itemCount
	 * Number of items being deleted (defaults to 1).
	 * @returns {Observable<boolean>}
	 * Observable that emits true when the user confirms the deletion.
	 */
	confirmDelete(
		itemName: string,
		itemCount: number = 1): Observable<boolean>
	{
		const plural: boolean =
			itemCount > 1;
		const displayName: string =
			plural
				? `${itemCount} ${itemName}s`
				: itemName;

		const dialogData: ConfirmDialogData =
			{
				title: `Delete ${plural ? itemName + "s" : itemName}?`,
				message: `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
				confirmText: "Delete",
				cancelText: "Cancel",
				confirmColor: "warn",
				icon: "warning"
			};

		return this
		.dialog
		.open(ConfirmDialogComponent,
			{ data: dialogData })
		.afterClosed()
		.pipe(
			map(
				(result: boolean | undefined): boolean =>
					result === true));
	}

	/**
	 * Shows a deactivation confirmation dialog with warn styling.
	 * @param {string} itemName
	 * The name of the item being deactivated.
	 * @returns {Observable<boolean>}
	 * Observable that emits true when the user confirms deactivation.
	 */
	confirmDeactivate(itemName: string): Observable<boolean>
	{
		const dialogData: ConfirmDialogData =
			{
				title: `Deactivate ${itemName}?`,
				message:
				`Are you sure you want to deactivate this ${itemName}? The ${itemName} will no longer be able to access the system.`,
				confirmText: "Deactivate",
				cancelText: "Cancel",
				confirmColor: "warn",
				icon: "person_off"
			};

		return this
		.dialog
		.open(ConfirmDialogComponent,
			{ data: dialogData })
		.afterClosed()
		.pipe(
			map(
				(result: boolean | undefined): boolean =>
					result === true));
	}
}
