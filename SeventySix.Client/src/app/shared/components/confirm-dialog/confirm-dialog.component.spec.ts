import { ComponentFixture } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfirmDialogData } from "@shared/models";
import { createMockDialogRef } from "@testing/mock-factories";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { ConfirmDialogComponent } from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () =>
{
	let component: ConfirmDialogComponent;
	let fixture: ComponentFixture<ConfirmDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
	const mockData: ConfirmDialogData =
		{
			title: "Confirm Action",
			message: "Are you sure?",
			confirmText: "Yes",
			cancelText: "No",
			confirmColor: "warn",
			icon: "warning"
		};

	beforeEach(async () =>
	{
		mockDialogRef =
			createMockDialogRef<ConfirmDialogComponent>();

		fixture =
			await new ComponentTestBed<ConfirmDialogComponent>()
			.withProvider({ provide: MatDialogRef, useValue: mockDialogRef })
			.withProvider({ provide: MAT_DIALOG_DATA, useValue: mockData })
			.build(ConfirmDialogComponent);

		component =
			fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component)
			.toBeTruthy();
	});

	it("should display title and message", () =>
	{
		const compiled: HTMLElement =
			fixture.nativeElement;
		expect(compiled.textContent)
			.toContain("Confirm Action");
		expect(compiled.textContent)
			.toContain("Are you sure?");
	});

	it("should close dialog with true on confirm", () =>
	{
		component.onConfirm();
		expect(mockDialogRef.close)
			.toHaveBeenCalledWith(true);
	});

	it("should close dialog with false on cancel", () =>
	{
		component.onCancel();
		expect(mockDialogRef.close)
			.toHaveBeenCalledWith(false);
	});

	it("should get correct icon color for warn", () =>
	{
		const color: string =
			component.getIconColor();
		expect(color)
			.toBe("var(--mat-sys-error)");
	});

	it("should display custom button text when provided", () =>
	{
		const compiled: HTMLElement =
			fixture.nativeElement;
		expect(compiled.textContent)
			.toContain("Yes");
		expect(compiled.textContent)
			.toContain("No");
	});
});
