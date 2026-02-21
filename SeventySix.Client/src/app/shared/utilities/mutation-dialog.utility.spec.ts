import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ConfirmOptions } from "@shared/models";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";
import { of } from "rxjs";
import { Mock, vi } from "vitest";
import { confirmAndMutate } from "./mutation-dialog.utility";

interface MockDialogService
{
	confirm: Mock;
}

interface MockNotificationService
{
	success: Mock;
	error: Mock;
}

interface MockMutation
{
	mutate: Mock;
}

describe("mutation-dialog.utility",
	() =>
	{
		let dialogService: MockDialogService;
		let notificationService: MockNotificationService;
		let mutation: MockMutation;

		beforeEach(
			() =>
			{
				dialogService =
					{
						confirm: vi.fn()
					};
				notificationService =
					{
						success: vi.fn(),
						error: vi.fn()
					};
				mutation =
					{
						mutate: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [provideZonelessChangeDetection()]
					});
			});

		describe("confirmAndMutate",
			() =>
			{
				const dialogOptions: ConfirmOptions =
					{
						title: "Test Title",
						message: "Test Message",
						confirmText: "Confirm"
					};

				it("should call dialogService.confirm with provided options",
					() =>
					{
						dialogService.confirm.mockReturnValue(of(false));

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							123,
							"Success message",
							"Error prefix");

						expect(dialogService.confirm)
							.toHaveBeenCalledWith(dialogOptions);
					});

				it("should not call mutation when dialog is cancelled",
					() =>
					{
						dialogService.confirm.mockReturnValue(of(false));

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							123,
							"Success message",
							"Error prefix");

						expect(mutation.mutate)
							.not
							.toHaveBeenCalled();
					});

				it("should call mutation.mutate when dialog is confirmed",
					() =>
					{
						dialogService.confirm.mockReturnValue(of(true));

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							123,
							"Success message",
							"Error prefix");

						expect(mutation.mutate)
							.toHaveBeenCalledWith(
								123,
								expect.objectContaining(
									{
										onSuccess: expect.any(Function),
										onError: expect.any(Function)
									}));
					});

				it("should show success notification when mutation succeeds",
					() =>
					{
						dialogService.confirm.mockReturnValue(of(true));
						mutation.mutate.mockImplementation(
							(
								_input: unknown,
								callbacks: { onSuccess?: () => void; }) =>
							{
								callbacks.onSuccess?.();
							});

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							123,
							"Operation successful",
							"Error prefix");

						expect(notificationService.success)
							.toHaveBeenCalledWith("Operation successful");
					});

				it("should show error notification when mutation fails",
					() =>
					{
						const testError: Error =
							new Error("Something went wrong");
						dialogService.confirm.mockReturnValue(of(true));
						mutation.mutate.mockImplementation(
							(
								_input: unknown,
								callbacks: { onError?: (error: Error) => void; }) =>
							{
								callbacks.onError?.(testError);
							});

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							123,
							"Success message",
							"Failed to complete");

						expect(notificationService.error)
							.toHaveBeenCalledWith("Failed to complete: Something went wrong");
					});

				it("should pass correct input to mutation",
					() =>
					{
						const complexInput: { userId: number; action: string; } =
							{
								userId: 42,
								action: "reset"
							};
						dialogService.confirm.mockReturnValue(of(true));

						confirmAndMutate(
							dialogService as unknown as DialogService,
							notificationService as unknown as NotificationService,
							dialogOptions,
							mutation as never,
							complexInput,
							"Success",
							"Error");

						expect(mutation.mutate)
							.toHaveBeenCalledWith(
								complexInput,
								expect.any(Object));
					});
			});
	});