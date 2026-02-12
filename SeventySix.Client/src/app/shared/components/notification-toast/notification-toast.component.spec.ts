import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationService } from "@shared/services";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { vi } from "vitest";
import { NotificationToastComponent } from "./notification-toast.component";

describe("NotificationToastComponent",
	() =>
	{
		let component: NotificationToastComponent;
		let fixture: ComponentFixture<NotificationToastComponent>;
		let notificationService: NotificationService;

		beforeEach(
			async () =>
			{
				fixture =
					await new ComponentTestBed<NotificationToastComponent>()
						.withRealService(NotificationService)
						.build(NotificationToastComponent);

				component =
					fixture.componentInstance;
				notificationService =
					TestBed.inject(NotificationService);
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		describe("notification display",
			() =>
			{
				it("should display notifications from service",
					() =>
					{
						notificationService.success("Test message");
						fixture.detectChanges();

						const compiled: HTMLElement =
							fixture.nativeElement;
						expect(
							compiled.querySelector(".toast-message")?.textContent)
							.toContain("Test message");
					});

				it("should display multiple notifications",
					() =>
					{
						notificationService.success("First");
						notificationService.error("Second");
						fixture.detectChanges();

						const toasts: NodeListOf<HTMLElement> =
							fixture.nativeElement.querySelectorAll(".toast");
						expect(toasts.length)
							.toBe(2);
					});

				it("should apply correct CSS class for error level",
					() =>
					{
						notificationService.error("Error");
						fixture.detectChanges();

						const toast: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast");
						expect(toast?.classList.contains("toast-error"))
							.toBe(true);
					});

				it("should apply correct CSS class for warning level",
					() =>
					{
						notificationService.warning("Warning");
						fixture.detectChanges();

						const toast: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast");
						expect(toast?.classList.contains("toast-warning"))
							.toBe(true);
					});

				it("should apply correct CSS class for info level",
					() =>
					{
						notificationService.info("Info");
						fixture.detectChanges();

						const toast: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast");
						expect(toast?.classList.contains("toast-info"))
							.toBe(true);
					});

				it("should apply correct CSS class for success level",
					() =>
					{
						notificationService.success("Success");
						fixture.detectChanges();

						const toast: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast");
						expect(toast?.classList.contains("toast-success"))
							.toBe(true);
					});
			});

		describe("icons",
			() =>
			{
				it("should show cancel icon for error notifications",
					() =>
					{
						notificationService.error("Error");
						fixture.detectChanges();

						const icon: HTMLElement | null =
							fixture.nativeElement.querySelector("mat-icon");
						expect(icon?.textContent?.trim())
							.toBe("cancel");
					});

				it("should show warning icon for warning notifications",
					() =>
					{
						notificationService.warning("Warning");
						fixture.detectChanges();

						const icon: HTMLElement | null =
							fixture.nativeElement.querySelector("mat-icon");
						expect(icon?.textContent?.trim())
							.toBe("warning");
					});

				it("should show lightbulb icon for info notifications",
					() =>
					{
						notificationService.info("Info");
						fixture.detectChanges();

						const icon: HTMLElement | null =
							fixture.nativeElement.querySelector("mat-icon");
						expect(icon?.textContent?.trim())
							.toBe("lightbulb");
					});

				it("should show check_circle icon for success notifications",
					() =>
					{
						notificationService.success("Success");
						fixture.detectChanges();

						const icon: HTMLElement | null =
							fixture.nativeElement.querySelector("mat-icon");
						expect(icon?.textContent?.trim())
							.toBe("check_circle");
					});
			});

		describe("details display",
			() =>
			{
				it("should show details when present",
					() =>
					{
						notificationService.errorWithDetails("Error",
							[
								"Detail 1",
								"Detail 2"
							]);
						fixture.detectChanges();

						const details: NodeListOf<HTMLLIElement> =
							fixture.nativeElement.querySelectorAll(".toast-details li");
						expect(details.length)
							.toBe(2);
						expect(details[0].textContent)
							.toBe("Detail 1");
						expect(details[1].textContent)
							.toBe("Detail 2");
					});

				it("should not show details section when details are empty",
					() =>
					{
						notificationService.error("Error");
						fixture.detectChanges();

						const detailsSection: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast-details");
						expect(detailsSection)
							.toBeNull();
					});

				it("should not show details section when details are undefined",
					() =>
					{
						notificationService.errorWithDetails("Error", undefined);
						fixture.detectChanges();

						const detailsSection: HTMLElement | null =
							fixture.nativeElement.querySelector(".toast-details");
						expect(detailsSection)
							.toBeNull();
					});
			});

		describe("copy button",
			() =>
			{
				it("should show copy button when copyData is present",
					() =>
					{
						notificationService.errorWithDetails(
							"Error",
							undefined,
							"Copy data");
						fixture.detectChanges();

						const copyButton: HTMLElement | null =
							fixture.nativeElement.querySelector(
								"[aria-label='Copy error details']");
						expect(copyButton)
							.toBeTruthy();
					});

				it("should not show copy button when copyData is absent",
					() =>
					{
						notificationService.error("Error");
						fixture.detectChanges();

						const copyButton: HTMLElement | null =
							fixture.nativeElement.querySelector(
								"[aria-label='Copy error details']");
						expect(copyButton)
							.toBeNull();
					});

				it("should call copyToClipboard when copy button is clicked",
					async () =>
					{
						const copySpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(
									notificationService,
									"copyToClipboard")
								.mockReturnValue(Promise.resolve(true));
						notificationService.errorWithDetails(
							"Error",
							undefined,
							"Copy data");
						fixture.detectChanges();

						const copyButton: HTMLButtonElement =
							fixture.nativeElement.querySelector(
								"[aria-label='Copy error details']") as HTMLButtonElement;
						copyButton.click();

						expect(copySpy)
							.toHaveBeenCalled();
					});
			});

		describe("dismiss button",
			() =>
			{
				it("should show dismiss button for all notifications",
					() =>
					{
						notificationService.success("Success");
						fixture.detectChanges();

						const dismissButton: HTMLElement | null =
							fixture.nativeElement.querySelector("[aria-label='Dismiss']");
						expect(dismissButton)
							.toBeTruthy();
					});

				it("should dismiss notification when dismiss button is clicked",
					() =>
					{
						notificationService.success("Success");
						fixture.detectChanges();
						expect(
							fixture.nativeElement.querySelectorAll(".toast").length)
							.toBe(1);

						const dismissButton: HTMLButtonElement =
							fixture.nativeElement.querySelector(
								"[aria-label='Dismiss']") as HTMLButtonElement;
						dismissButton.click();
						fixture.detectChanges();

						expect(
							fixture.nativeElement.querySelectorAll(".toast").length)
							.toBe(0);
					});

				it("should render dismiss button for multiline notification with details",
					() =>
					{
						notificationService.errorWithDetails(
							"A very long error message that would span across multiple lines in the toast notification",
							[
								"Validation failed for field 'email'",
								"Validation failed for field 'username'"
							]);
						fixture.detectChanges();

						const dismissButton: HTMLElement | null =
							fixture.nativeElement.querySelector("[aria-label='Dismiss']");
						expect(dismissButton)
							.toBeTruthy();

						dismissButton!.click();
						fixture.detectChanges();

						expect(
							fixture.nativeElement.querySelectorAll(".toast").length)
							.toBe(0);
					});
			});
	});
