import { Component, inject } from "@angular/core";
import {
	MatDialogModule,
	MatDialogRef,
	MAT_DIALOG_DATA
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

/**
 * Confirmation dialog data interface
 */
export interface ConfirmDialogData
{
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmColor?: "primary" | "accent" | "warn";
	icon?: string;
}

/**
 * Reusable confirmation dialog component
 * Used for critical actions like deletions
 */
@Component({
	selector: "app-confirm-dialog",
	imports: [MatDialogModule, MatButtonModule, MatIconModule],
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
			<button mat-button (click)="onCancel()">
				{{ data.cancelText || "Cancel" }}
			</button>
			<button
				mat-raised-button
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
export class ConfirmDialogComponent
{
	private dialogRef: MatDialogRef<ConfirmDialogComponent> = inject(
		MatDialogRef<ConfirmDialogComponent>
	);
	protected data: ConfirmDialogData =
		inject<ConfirmDialogData>(MAT_DIALOG_DATA);

	onConfirm(): void
	{
		this.dialogRef.close(true);
	}

	onCancel(): void
	{
		this.dialogRef.close(false);
	}

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
