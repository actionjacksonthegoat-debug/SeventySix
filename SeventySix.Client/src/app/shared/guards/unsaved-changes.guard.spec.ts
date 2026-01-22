import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from "@angular/router";
import { CanComponentDeactivate } from "@shared/interfaces";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockNotificationService,
	type MockNotificationService
} from "@shared/testing";
import { type Mock, vi } from "vitest";
import { unsavedChangesGuard } from "./unsaved-changes.guard";

describe("unsavedChangesGuard",
	() =>
	{
		let mockNotification: MockNotificationService;
		let mockConfirm: Mock;

		beforeEach(
			() =>
			{
				mockNotification =
					createMockNotificationService();
				mockConfirm =
					vi.fn();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							{ provide: NotificationService, useValue: mockNotification }
						]
					});

				// Mock window.confirm
				vi
					.spyOn(window, "confirm")
					.mockImplementation(mockConfirm);
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should allow navigation when canDeactivate returns true",
			() =>
			{
				const component: CanComponentDeactivate =
					{
						canDeactivate: () => true
					};

				const result: boolean =
					TestBed.runInInjectionContext(
						() =>
							unsavedChangesGuard(
								component,
								{} as ActivatedRouteSnapshot,
								{} as RouterStateSnapshot,
								{} as RouterStateSnapshot)) as boolean;

				expect(result)
					.toBe(true);
			});

		it("should allow navigation when component has no canDeactivate method",
			() =>
			{
				const component: CanComponentDeactivate =
					{} as CanComponentDeactivate;

				const result: boolean =
					TestBed.runInInjectionContext(
						() =>
							unsavedChangesGuard(
								component,
								{} as ActivatedRouteSnapshot,
								{} as RouterStateSnapshot,
								{} as RouterStateSnapshot)) as boolean;

				expect(result)
					.toBe(true);
			});

		it("should show confirm dialog when canDeactivate returns false",
			() =>
			{
				const component: CanComponentDeactivate =
					{
						canDeactivate: () => false
					};
				mockConfirm.mockReturnValue(true);

				const result: boolean =
					TestBed.runInInjectionContext(
						() =>
							unsavedChangesGuard(
								component,
								{} as ActivatedRouteSnapshot,
								{} as RouterStateSnapshot,
								{} as RouterStateSnapshot)) as boolean;

				expect(window.confirm)
					.toHaveBeenCalled();
				expect(result)
					.toBe(true);
			});

		it("should prevent navigation when user cancels confirm dialog",
			() =>
			{
				const component: CanComponentDeactivate =
					{
						canDeactivate: () => false
					};
				mockConfirm.mockReturnValue(false);

				const result: boolean =
					TestBed.runInInjectionContext(
						() =>
							unsavedChangesGuard(
								component,
								{} as ActivatedRouteSnapshot,
								{} as RouterStateSnapshot,
								{} as RouterStateSnapshot)) as boolean;

				expect(window.confirm)
					.toHaveBeenCalled();
				expect(mockNotification.info)
					.toHaveBeenCalledWith(
						"Navigation cancelled");
				expect(result)
					.toBe(false);
			});
	});
