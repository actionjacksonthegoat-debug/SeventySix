import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { NotificationService, NotificationLevel } from "./notification.service";

describe("NotificationService", () =>
{
	let service: NotificationService;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
		service = TestBed.inject(NotificationService);
		jasmine.clock().install();
	});

	afterEach(() =>
	{
		jasmine.clock().uninstall();
	});

	describe("success", () =>
	{
		it("should create a success notification", () =>
		{
			service.success("Success message");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(1);
			expect(notifications[0].level).toBe(NotificationLevel.Success);
			expect(notifications[0].message).toBe("Success message");
		});

		it("should auto-dismiss after default duration", () =>
		{
			service.success("Success message");
			expect(service.notifications$().length).toBe(1);

			jasmine.clock().tick(5000);

			expect(service.notifications$().length).toBe(0);
		});

		it("should use custom duration", () =>
		{
			service.success("Success message", 3000);
			expect(service.notifications$().length).toBe(1);

			jasmine.clock().tick(3000);

			expect(service.notifications$().length).toBe(0);
		});
	});

	describe("info", () =>
	{
		it("should create an info notification", () =>
		{
			service.info("Info message");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(1);
			expect(notifications[0].level).toBe(NotificationLevel.Info);
			expect(notifications[0].message).toBe("Info message");
		});

		it("should auto-dismiss after 5 seconds", () =>
		{
			service.info("Info message");
			expect(service.notifications$().length).toBe(1);

			jasmine.clock().tick(5000);

			expect(service.notifications$().length).toBe(0);
		});
	});

	describe("warning", () =>
	{
		it("should create a warning notification", () =>
		{
			service.warning("Warning message");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(1);
			expect(notifications[0].level).toBe(NotificationLevel.Warning);
			expect(notifications[0].message).toBe("Warning message");
		});

		it("should auto-dismiss after 7 seconds", () =>
		{
			service.warning("Warning message");
			expect(service.notifications$().length).toBe(1);

			jasmine.clock().tick(7000);

			expect(service.notifications$().length).toBe(0);
		});
	});

	describe("error", () =>
	{
		it("should create an error notification", () =>
		{
			service.error("Error message");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(1);
			expect(notifications[0].level).toBe(NotificationLevel.Error);
			expect(notifications[0].message).toBe("Error message");
		});

		it("should auto-dismiss after 10 seconds", () =>
		{
			service.error("Error message");
			expect(service.notifications$().length).toBe(1);

			jasmine.clock().tick(10000);

			expect(service.notifications$().length).toBe(0);
		});
	});

	describe("dismiss", () =>
	{
		it("should remove specific notification by ID", () =>
		{
			service.success("Message 1");
			service.info("Message 2");
			service.warning("Message 3");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(3);

			const idToRemove = notifications[1].id;
			service.dismiss(idToRemove);

			const updatedNotifications = service.notifications$();
			expect(updatedNotifications.length).toBe(2);
			expect(
				updatedNotifications.find((n) => n.id === idToRemove)
			).toBeUndefined();
		});

		it("should do nothing if ID does not exist", () =>
		{
			service.success("Message 1");

			service.dismiss("non-existent-id");

			expect(service.notifications$().length).toBe(1);
		});
	});

	describe("clearAll", () =>
	{
		it("should remove all notifications", () =>
		{
			service.success("Message 1");
			service.info("Message 2");
			service.warning("Message 3");

			expect(service.notifications$().length).toBe(3);

			service.clearAll();

			expect(service.notifications$().length).toBe(0);
		});

		it("should do nothing when no notifications exist", () =>
		{
			service.clearAll();

			expect(service.notifications$().length).toBe(0);
		});
	});

	describe("multiple notifications", () =>
	{
		it("should handle multiple notifications correctly", () =>
		{
			service.success("Success 1");
			service.error("Error 1");
			service.warning("Warning 1");

			const notifications = service.notifications$();
			expect(notifications.length).toBe(3);
			expect(notifications[0].level).toBe(NotificationLevel.Success);
			expect(notifications[1].level).toBe(NotificationLevel.Error);
			expect(notifications[2].level).toBe(NotificationLevel.Warning);
		});

		it("should generate unique IDs for each notification", () =>
		{
			service.success("Message 1");
			service.success("Message 2");
			service.success("Message 3");

			const notifications = service.notifications$();
			const ids = notifications.map((n) => n.id);
			const uniqueIds = new Set(ids);

			expect(uniqueIds.size).toBe(3);
		});
	});

	describe("notification properties", () =>
	{
		it("should include duration in notification", () =>
		{
			service.success("Message", 3000);

			const notification = service.notifications$()[0];
			expect(notification.duration).toBe(3000);
		});

		it("should include message in notification", () =>
		{
			const message = "Test notification message";
			service.info(message);

			const notification = service.notifications$()[0];
			expect(notification.message).toBe(message);
		});
	});
});
