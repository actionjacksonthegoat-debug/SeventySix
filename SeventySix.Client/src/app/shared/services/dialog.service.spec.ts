import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "@shared/components";
import { ConfirmDialogData, ConfirmOptions } from "@shared/models";
import { firstValueFrom, of } from "rxjs";
import { Mock, vi } from "vitest";
import { DialogService } from "./dialog.service";

interface MockMatDialogRef
{
	afterClosed: Mock;
}

interface MockMatDialog
{
	open: Mock;
}

describe("DialogService",
	() =>
	{
		let service: DialogService;
		let dialogSpy: MockMatDialog;
		let dialogRefSpy: MockMatDialogRef;

		beforeEach(
			() =>
			{
				dialogRefSpy =
					{
						afterClosed: vi.fn()
					};
				dialogSpy =
					{
						open: vi
							.fn()
							.mockReturnValue(dialogRefSpy)
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							DialogService,
							{ provide: MatDialog, useValue: dialogSpy }
						]
					});

				service =
					TestBed.inject(DialogService);
			});

		describe("confirm",
			() =>
			{
				it("should open dialog with provided options",
					() =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						const options: ConfirmOptions =
							{
								title: "Test Title",
								message: "Test Message",
								confirmText: "Yes",
								cancelText: "No"
							};

						service
							.confirm(options)
							.subscribe();

						expect(dialogSpy.open)
							.toHaveBeenCalledWith(
								ConfirmDialogComponent,
								{
									data: {
										title: "Test Title",
										message: "Test Message",
										confirmText: "Yes",
										cancelText: "No",
										confirmColor: "primary"
									} as ConfirmDialogData
								});
					});

				it("should return true when dialog is confirmed",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						const result: boolean =
							await firstValueFrom(
								service.confirm(
									{ title: "Test", message: "Message" }));

						expect(result)
							.toBe(true);
					});

				it("should return false when dialog is cancelled",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(false));

						const result: boolean =
							await firstValueFrom(
								service.confirm(
									{ title: "Test", message: "Message" }));

						expect(result)
							.toBe(false);
					});

				it("should return false when dialog is dismissed",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(undefined));

						const result: boolean =
							await firstValueFrom(
								service.confirm(
									{ title: "Test", message: "Message" }));

						expect(result)
							.toBe(false);
					});
			});

		describe("confirmDelete",
			() =>
			{
				it("should open dialog with delete styling for single item",
					() =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						service
							.confirmDelete("log")
							.subscribe();

						const expectedData: ConfirmDialogData =
							{
								title: "Delete log?",
								message: "Are you sure you want to delete log? This action cannot be undone.",
								confirmText: "Delete",
								cancelText: "Cancel",
								confirmColor: "warn",
								icon: "warning"
							};

						expect(dialogSpy.open)
							.toHaveBeenCalledWith(
								ConfirmDialogComponent,
								{ data: expectedData });
					});

				it("should open dialog with plural text for multiple items",
					() =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						service
							.confirmDelete("log", 5)
							.subscribe();

						const expectedData: ConfirmDialogData =
							{
								title: "Delete logs?",
								message: "Are you sure you want to delete 5 logs? This action cannot be undone.",
								confirmText: "Delete",
								cancelText: "Cancel",
								confirmColor: "warn",
								icon: "warning"
							};

						expect(dialogSpy.open)
							.toHaveBeenCalledWith(
								ConfirmDialogComponent,
								{ data: expectedData });
					});

				it("should return true when confirmed",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						const result: boolean =
							await firstValueFrom(
								service.confirmDelete("log"));

						expect(result)
							.toBe(true);
					});

				it("should return false when cancelled",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(false));

						const result: boolean =
							await firstValueFrom(
								service.confirmDelete("log"));

						expect(result)
							.toBe(false);
					});
			});

		describe("confirmDeactivate",
			() =>
			{
				it("should open dialog with deactivate styling",
					() =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						service
							.confirmDeactivate("user")
							.subscribe();

						const expectedData: ConfirmDialogData =
							{
								title: "Deactivate user?",
								message:
					"Are you sure you want to deactivate this user? The user will no longer be able to access the system.",
								confirmText: "Deactivate",
								cancelText: "Cancel",
								confirmColor: "warn",
								icon: "person_off"
							};

						expect(dialogSpy.open)
							.toHaveBeenCalledWith(
								ConfirmDialogComponent,
								{ data: expectedData });
					});

				it("should return true when confirmed",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(true));

						const result: boolean =
							await firstValueFrom(
								service.confirmDeactivate("user"));

						expect(result)
							.toBe(true);
					});

				it("should return false when cancelled",
					async () =>
					{
						dialogRefSpy.afterClosed.mockReturnValue(of(false));

						const result: boolean =
							await firstValueFrom(
								service.confirmDeactivate("user"));

						expect(result)
							.toBe(false);
					});
			});
	});