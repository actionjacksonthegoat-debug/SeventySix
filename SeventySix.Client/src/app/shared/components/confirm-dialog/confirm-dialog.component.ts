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
				<mat-icon
					aria-hidden="true"
					class="confirm-icon"
					[class.confirm-icon-warn]="data.confirmColor === 'warn'"
					[class.confirm-icon-accent]="data.confirmColor === 'accent'"
					[class.confirm-icon-primary]="data.confirmColor !== 'warn' && data.confirmColor !== 'accent'">
					{{ data.icon }}
				</mat-icon>
			}
			{{ data.title }}
		</h2>
		<mat-dialog-content>
			<p>{{ data.message }}</p>
		</mat-dialog-content>
		<mat-dialog-actions align="end">
			<button mat-button type="button" (click)="onCancel()">
				{{ data.cancelText ?? "Cancel" }}
			</button>
			<button
				mat-stroked-button
				type="button"
				[color]="data.confirmColor ?? 'primary'"
				(click)="onConfirm()"
				cdkFocusInitial
			>
				{{ data.confirmText ?? "Confirm" }}
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

					&.confirm-icon-warn {
						color: var(--mat-sys-error);
					}

					&.confirm-icon-accent {
						color: var(--mat-sys-tertiary);
					}

					&.confirm-icon-primary {
						color: var(--mat-sys-primary);
					}
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
}