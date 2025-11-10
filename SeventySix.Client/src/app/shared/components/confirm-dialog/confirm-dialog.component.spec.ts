import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
	ConfirmDialogComponent,
	ConfirmDialogData
} from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () =>
{
	let component: ConfirmDialogComponent;
	let fixture: ComponentFixture<ConfirmDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
	const mockData: ConfirmDialogData = {
		title: "Confirm Action",
		message: "Are you sure?",
		confirmText: "Yes",
		cancelText: "No",
		confirmColor: "warn",
		icon: "warning"
	};

	beforeEach(async () =>
	{
		mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

		await TestBed.configureTestingModule({
			imports: [ConfirmDialogComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: mockData }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ConfirmDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display title and message", () =>
	{
		const compiled = fixture.nativeElement;
		expect(compiled.textContent).toContain("Confirm Action");
		expect(compiled.textContent).toContain("Are you sure?");
	});

	it("should close dialog with true on confirm", () =>
	{
		component.onConfirm();
		expect(mockDialogRef.close).toHaveBeenCalledWith(true);
	});

	it("should close dialog with false on cancel", () =>
	{
		component.onCancel();
		expect(mockDialogRef.close).toHaveBeenCalledWith(false);
	});

	it("should get correct icon color for warn", () =>
	{
		const color = component.getIconColor();
		expect(color).toBe("var(--mat-sys-error)");
	});

	it("should use default button text when not provided", async () =>
	{
		const minimalData: ConfirmDialogData = {
			title: "Test",
			message: "Test message"
		};

		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [ConfirmDialogComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: minimalData }
			]
		}).compileComponents();

		const newFixture = TestBed.createComponent(ConfirmDialogComponent);
		newFixture.detectChanges();

		const compiled = newFixture.nativeElement;
		expect(compiled.textContent).toContain("Confirm");
		expect(compiled.textContent).toContain("Cancel");
	});
});
