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
	private readonly dialog: MatDialog =
		inject(MatDialog);

	/**
	 * Shows a generic confirmation dialog.
	 * @param options - Dialog configuration
	 * @returns Observable emitting true if confirmed, false if cancelled
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
	 * @param itemName - Name of the item being deleted (e.g., "log", "user")
	 * @param itemCount - Number of items being deleted (defaults to 1)
	 * @returns Observable emitting true if confirmed, false if cancelled
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
	 * @param itemName - Name of the item being deactivated (e.g., "user")
	 * @returns Observable emitting true if confirmed, false if cancelled
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
