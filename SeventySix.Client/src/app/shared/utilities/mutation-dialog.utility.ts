import { ConfirmOptions } from "@shared/models";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";
import { CreateMutationResult } from "@tanstack/angular-query-experimental";

/**
 * Executes a mutation after user confirmation via dialog.
 * Handles success/error notifications automatically.
 * Eliminates repeated confirm → mutate → notify pattern (DRY).
 *
 * @param {DialogService} dialogService
 * The dialog service for showing confirmation.
 *
 * @param {NotificationService} notificationService
 * The notification service for showing results.
 *
 * @param {ConfirmOptions} dialogOptions
 * Configuration for the confirmation dialog.
 *
 * @param {CreateMutationResult<TResult, Error, TInput>} mutation
 * The TanStack Query mutation to execute.
 *
 * @param {TInput} input
 * The input data for the mutation.
 *
 * @param {string} successMessage
 * Message to display on successful mutation.
 *
 * @param {string} errorPrefix
 * Prefix for error messages (e.g., "Failed to delete user").
 *
 * @example
 * confirmAndMutate(
 *     this.dialogService,
 *     this.notificationService,
 *     { title: "Reset Password", message: `Reset password for "${user.username}"?` },
 *     this.resetPasswordMutation,
 *     user.id,
 *     `Password reset email sent to ${user.email}`,
 *     "Failed to reset password"
 * );
 */
export function confirmAndMutate<TInput, TResult>(
	dialogService: DialogService,
	notificationService: NotificationService,
	dialogOptions: ConfirmOptions,
	mutation: CreateMutationResult<TResult, Error, TInput>,
	input: TInput,
	successMessage: string,
	errorPrefix: string): void
{
	dialogService
		.confirm(dialogOptions)
		.subscribe(
			(confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				mutation.mutate(
					input,
					{
						onSuccess: () =>
							notificationService.success(successMessage),
						onError: (error: Error) =>
							notificationService.error(`${errorPrefix}: ${error.message}`)
					});
			});
}