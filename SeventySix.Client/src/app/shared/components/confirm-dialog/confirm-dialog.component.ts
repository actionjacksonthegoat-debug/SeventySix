import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
	MAT_DIALOG_DATA,
	MatDialogModule,
	MatDialogRef
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { ConfirmDialogData } from "@shared/models";

@Component(
	{
		selector: "app-confirm-dialog",
		imports: [MatDialogModule, MatButtonModule, MatIconModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		template: `
		<h2 mat-dialog-title>
			@if (data.icon) {
				<mat-icon [style.color]="getIconColor()">{{
					data.icon
				}}</mat-icon>
			}
			{{ data.title }}
		</h2>
		<mat-dialog-content>
			<p>{{ data.message }}</p>
		</mat-dialog-content>
		<mat-dialog-actions align="end">
			<button mat-button type="button" (click)="onCancel()">
				{{ data.cancelText || "Cancel" }}
			</button>
			<button
				mat-raised-button
				type="button"
				[color]="data.confirmColor || 'primary'"
				(click)="onConfirm()"
				cdkFocusInitial
			>
				{{ data.confirmText || "Confirm" }}
			</button>
		</mat-dialog-actions>
	`,
		styles: [
			`
			h2 {
				display: flex;
				align-items: center;
				gap: 12px;

				mat-icon {
					font-size: 28px;
					width: 28px;
					height: 28px;
				}
			}

			mat-dialog-content {
				min-width: 300px;
				max-width: 500px;
			}
		`
		]
	})
/**
 * Confirmation dialog component.
 *
 * Displays a title, message and confirm/cancel actions for critical operations
 * such as delete or overwrite. Supports optional icon and color customization.
 *
 * Usage Example:
 * const dialogRef = this.dialog.open(ConfirmDialogComponent, {
 *   data: { title, message, confirmText }
 * });
 *
 * @remarks
 * The dialog closes with boolean `true` to confirm and `false` to cancel.
 */
export class ConfirmDialogComponent
{
	/**
	 * Reference to the dialog instance for programmatic close.
	 * @type {MatDialogRef<ConfirmDialogComponent>}
	 * @private
	 * @readonly
	 */
	private dialogRef: MatDialogRef<ConfirmDialogComponent> =
		inject(
		MatDialogRef<ConfirmDialogComponent>);

	/**
	 * Dialog input data (title, message, buttons, colors).
	 * @type {ConfirmDialogData}
	 * @protected
	 * @readonly
	 */
	protected data: ConfirmDialogData =
		inject<ConfirmDialogData>(MAT_DIALOG_DATA);

	/**
	 * Confirm action handler — closes the dialog with a true result.
	 * @returns {void}
	 */
	onConfirm(): void
	{
		this.dialogRef.close(true);
	}

	/**
	 * Cancel action handler — closes the dialog with a false result.
	 * @returns {void}
	 */
	onCancel(): void
	{
		this.dialogRef.close(false);
	}

	/**
	 * Maps the confirm button color to a CSS variable used for the icon.
	 * @returns {string}
	 */
	getIconColor(): string
	{
		switch (this.data.confirmColor)
		{
			case "warn":
				return "var(--mat-sys-error)";
			case "accent":
				return "var(--mat-sys-tertiary)";
			default:
				return "var(--mat-sys-primary)";
		}
	}
}
