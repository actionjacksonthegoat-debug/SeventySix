import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	unsavedChangesGuard,
	CanComponentDeactivate
} from "./unsaved-changes.guard";
import { NotificationService } from "../services/notification.service";

describe("unsavedChangesGuard", () =>
{
	let mockNotification: jasmine.SpyObj<NotificationService>;

	beforeEach(() =>
	{
		mockNotification = jasmine.createSpyObj("NotificationService", [
			"info"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: NotificationService, useValue: mockNotification }
			]
		});

		// Mock window.confirm
		spyOn(window, "confirm");
	});

	it("should allow navigation when canDeactivate returns true", () =>
	{
		const component: CanComponentDeactivate = {
			canDeactivate: () => true
		};

		const result = TestBed.runInInjectionContext(() =>
			unsavedChangesGuard(component, {} as any, {} as any, {} as any)
		);

		expect(result).toBe(true);
	});

	it("should allow navigation when component has no canDeactivate method", () =>
	{
		const component = {} as CanComponentDeactivate;

		const result = TestBed.runInInjectionContext(() =>
			unsavedChangesGuard(component, {} as any, {} as any, {} as any)
		);

		expect(result).toBe(true);
	});

	it("should show confirm dialog when canDeactivate returns false", () =>
	{
		const component: CanComponentDeactivate = {
			canDeactivate: () => false
		};
		(window.confirm as jasmine.Spy).and.returnValue(true);

		const result = TestBed.runInInjectionContext(() =>
			unsavedChangesGuard(component, {} as any, {} as any, {} as any)
		);

		expect(window.confirm).toHaveBeenCalled();
		expect(result).toBe(true);
	});

	it("should prevent navigation when user cancels confirm dialog", () =>
	{
		const component: CanComponentDeactivate = {
			canDeactivate: () => false
		};
		(window.confirm as jasmine.Spy).and.returnValue(false);

		const result = TestBed.runInInjectionContext(() =>
			unsavedChangesGuard(component, {} as any, {} as any, {} as any)
		);

		expect(window.confirm).toHaveBeenCalled();
		expect(mockNotification.info).toHaveBeenCalledWith(
			"Navigation cancelled"
		);
		expect(result).toBe(false);
	});
});
