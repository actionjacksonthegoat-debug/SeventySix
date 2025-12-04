/**
 * Confirmation dialog data interface.
 * Used by ConfirmDialogComponent and DialogService.
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
