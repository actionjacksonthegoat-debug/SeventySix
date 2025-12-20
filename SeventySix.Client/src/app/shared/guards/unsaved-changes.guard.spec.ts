import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from "@angular/router";
import { CanComponentDeactivate } from "@shared/interfaces";
import { NotificationService } from "@shared/services/notification.service";
import { createMockNotificationService } from "@shared/testing";
import { unsavedChangesGuard } from "./unsaved-changes.guard";

describe("unsavedChangesGuard",
	() =>
	{
		let mockNotification: jasmine.SpyObj<NotificationService>;

		beforeEach(
			() =>
			{
				mockNotification =
					createMockNotificationService();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							{ provide: NotificationService, useValue: mockNotification }
						]
					});

				// Mock window.confirm
				spyOn(window, "confirm");
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
				(window.confirm as jasmine.Spy).and.returnValue(true);

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
				(window.confirm as jasmine.Spy).and.returnValue(false);

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
