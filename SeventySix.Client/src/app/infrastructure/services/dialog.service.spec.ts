import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "@shared/components";
import { ConfirmDialogData } from "@shared/models";
import { of } from "rxjs";
import { ConfirmOptions, DialogService } from "./dialog.service";

describe("DialogService",
	() =>
	{
		let service: DialogService;
		let dialogSpy: jasmine.SpyObj<MatDialog>;
		let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

		beforeEach(
			() =>
			{
				dialogRefSpy =
					jasmine.createSpyObj("MatDialogRef",
						["afterClosed"]);
				dialogSpy =
					jasmine.createSpyObj("MatDialog",
						["open"]);
				dialogSpy.open.and.returnValue(dialogRefSpy);

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
						dialogRefSpy.afterClosed.and.returnValue(of(true));

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
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(true));

						service
						.confirm(
							{ title: "Test", message: "Message" })
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeTrue();
								done();
							});
					});

				it("should return false when dialog is cancelled",
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(false));

						service
						.confirm(
							{ title: "Test", message: "Message" })
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeFalse();
								done();
							});
					});

				it("should return false when dialog is dismissed",
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(undefined));

						service
						.confirm(
							{ title: "Test", message: "Message" })
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeFalse();
								done();
							});
					});
			});

		describe("confirmDelete",
			() =>
			{
				it("should open dialog with delete styling for single item",
					() =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(true));

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
						dialogRefSpy.afterClosed.and.returnValue(of(true));

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
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(true));

						service
						.confirmDelete("log")
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeTrue();
								done();
							});
					});

				it("should return false when cancelled",
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(false));

						service
						.confirmDelete("log")
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeFalse();
								done();
							});
					});
			});

		describe("confirmDeactivate",
			() =>
			{
				it("should open dialog with deactivate styling",
					() =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(true));

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
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(true));

						service
						.confirmDeactivate("user")
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeTrue();
								done();
							});
					});

				it("should return false when cancelled",
					(done: DoneFn) =>
					{
						dialogRefSpy.afterClosed.and.returnValue(of(false));

						service
						.confirmDeactivate("user")
						.subscribe(
							(result: boolean) =>
							{
								expect(result)
								.toBeFalse();
								done();
							});
					});
			});
	});
