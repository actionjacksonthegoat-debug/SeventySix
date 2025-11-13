import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { NotificationToastComponent } from "./notification-toast.component";
import { NotificationService, NotificationLevel } from "@core/services";

describe("NotificationToastComponent", () =>
{
	let component: NotificationToastComponent;
	let fixture: ComponentFixture<NotificationToastComponent>;
	let notificationService: NotificationService;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [NotificationToastComponent],
			providers: [provideZonelessChangeDetection(), NotificationService]
		}).compileComponents();

		fixture = TestBed.createComponent(NotificationToastComponent);
		component = fixture.componentInstance;
		notificationService = TestBed.inject(NotificationService);
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	describe("notification display", () =>
	{
		it("should display notifications from service", () =>
		{
			notificationService.success("Test message");
			fixture.detectChanges();

			const compiled = fixture.nativeElement;
			expect(
				compiled.querySelector(".toast-message")?.textContent
			).toContain("Test message");
		});

		it("should display multiple notifications", () =>
		{
			notificationService.success("First");
			notificationService.error("Second");
			fixture.detectChanges();

			const toasts = fixture.nativeElement.querySelectorAll(".toast");
			expect(toasts.length).toBe(2);
		});

		it("should apply correct CSS class for error level", () =>
		{
			notificationService.error("Error");
			fixture.detectChanges();

			const toast = fixture.nativeElement.querySelector(".toast");
			expect(toast?.classList.contains("toast-error")).toBe(true);
		});

		it("should apply correct CSS class for warning level", () =>
		{
			notificationService.warning("Warning");
			fixture.detectChanges();

			const toast = fixture.nativeElement.querySelector(".toast");
			expect(toast?.classList.contains("toast-warning")).toBe(true);
		});

		it("should apply correct CSS class for info level", () =>
		{
			notificationService.info("Info");
			fixture.detectChanges();

			const toast = fixture.nativeElement.querySelector(".toast");
			expect(toast?.classList.contains("toast-info")).toBe(true);
		});

		it("should apply correct CSS class for success level", () =>
		{
			notificationService.success("Success");
			fixture.detectChanges();

			const toast = fixture.nativeElement.querySelector(".toast");
			expect(toast?.classList.contains("toast-success")).toBe(true);
		});
	});

	describe("icons", () =>
	{
		it("should show error icon for error notifications", () =>
		{
			notificationService.error("Error");
			fixture.detectChanges();

			const icon = fixture.nativeElement.querySelector("mat-icon");
			expect(icon?.textContent?.trim()).toBe("error");
		});

		it("should show warning icon for warning notifications", () =>
		{
			notificationService.warning("Warning");
			fixture.detectChanges();

			const icon = fixture.nativeElement.querySelector("mat-icon");
			expect(icon?.textContent?.trim()).toBe("warning");
		});

		it("should show info icon for info notifications", () =>
		{
			notificationService.info("Info");
			fixture.detectChanges();

			const icon = fixture.nativeElement.querySelector("mat-icon");
			expect(icon?.textContent?.trim()).toBe("info");
		});

		it("should show check_circle icon for success notifications", () =>
		{
			notificationService.success("Success");
			fixture.detectChanges();

			const icon = fixture.nativeElement.querySelector("mat-icon");
			expect(icon?.textContent?.trim()).toBe("check_circle");
		});
	});

	describe("details display", () =>
	{
		it("should show details when present", () =>
		{
			notificationService.errorWithDetails("Error", [
				"Detail 1",
				"Detail 2"
			]);
			fixture.detectChanges();

			const details =
				fixture.nativeElement.querySelectorAll(".toast-details li");
			expect(details.length).toBe(2);
			expect(details[0].textContent).toBe("Detail 1");
			expect(details[1].textContent).toBe("Detail 2");
		});

		it("should not show details section when details are empty", () =>
		{
			notificationService.error("Error");
			fixture.detectChanges();

			const detailsSection =
				fixture.nativeElement.querySelector(".toast-details");
			expect(detailsSection).toBeNull();
		});

		it("should not show details section when details are undefined", () =>
		{
			notificationService.errorWithDetails("Error", undefined);
			fixture.detectChanges();

			const detailsSection =
				fixture.nativeElement.querySelector(".toast-details");
			expect(detailsSection).toBeNull();
		});
	});

	describe("copy button", () =>
	{
		it("should show copy button when copyData is present", () =>
		{
			notificationService.errorWithDetails(
				"Error",
				undefined,
				"Copy data"
			);
			fixture.detectChanges();

			const copyButton = fixture.nativeElement.querySelector(
				"[aria-label='Copy error details']"
			);
			expect(copyButton).toBeTruthy();
		});

		it("should not show copy button when copyData is absent", () =>
		{
			notificationService.error("Error");
			fixture.detectChanges();

			const copyButton = fixture.nativeElement.querySelector(
				"[aria-label='Copy error details']"
			);
			expect(copyButton).toBeNull();
		});

		it("should call copyToClipboard when copy button is clicked", async () =>
		{
			const copySpy = spyOn(
				notificationService,
				"copyToClipboard"
			).and.returnValue(Promise.resolve(true));
			notificationService.errorWithDetails(
				"Error",
				undefined,
				"Copy data"
			);
			fixture.detectChanges();

			const copyButton = fixture.nativeElement.querySelector(
				"[aria-label='Copy error details']"
			) as HTMLButtonElement;
			copyButton.click();

			expect(copySpy).toHaveBeenCalled();
		});
	});

	describe("dismiss button", () =>
	{
		it("should show dismiss button for all notifications", () =>
		{
			notificationService.success("Success");
			fixture.detectChanges();

			const dismissButton = fixture.nativeElement.querySelector(
				"[aria-label='Dismiss']"
			);
			expect(dismissButton).toBeTruthy();
		});

		it("should dismiss notification when dismiss button is clicked", () =>
		{
			notificationService.success("Success");
			fixture.detectChanges();
			expect(
				fixture.nativeElement.querySelectorAll(".toast").length
			).toBe(1);

			const dismissButton = fixture.nativeElement.querySelector(
				"[aria-label='Dismiss']"
			) as HTMLButtonElement;
			dismissButton.click();
			fixture.detectChanges();

			expect(
				fixture.nativeElement.querySelectorAll(".toast").length
			).toBe(0);
		});
	});
});
