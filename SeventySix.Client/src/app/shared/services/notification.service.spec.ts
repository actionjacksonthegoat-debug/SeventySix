import { Clipboard } from "@angular/cdk/clipboard";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";

import { NotificationLevel } from "@shared/constants";
import { Notification } from "@shared/models";
import { LoggerService } from "@shared/services/logger.service";
import { setupSimpleServiceTest } from "@shared/testing";
import { NotificationService } from "./notification.service";

describe("NotificationService",
	() =>
	{
		let service: NotificationService;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(NotificationService);
				vi.useFakeTimers();
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
			});

		describe("success",
			() =>
			{
				it("should create a success notification",
					() =>
					{
						service.success("Success message");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Success);
						expect(notifications[0].message)
							.toBe("Success message");
					});

				it("should auto-dismiss after default duration",
					() =>
					{
						service.success("Success message");
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(5000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});

				it("should use custom duration",
					() =>
					{
						service.success("Success message", 3000);
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(3000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("info",
			() =>
			{
				it("should create an info notification",
					() =>
					{
						service.info("Info message");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Info);
						expect(notifications[0].message)
							.toBe("Info message");
					});

				it("should auto-dismiss after 5 seconds",
					() =>
					{
						service.info("Info message");
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(5000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("warning",
			() =>
			{
				it("should create a warning notification",
					() =>
					{
						service.warning("Warning message");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Warning);
						expect(notifications[0].message)
							.toBe("Warning message");
					});

				it("should auto-dismiss after 7 seconds",
					() =>
					{
						service.warning("Warning message");
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(7000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("error",
			() =>
			{
				it("should create an error notification",
					() =>
					{
						service.error("Error message");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Error);
						expect(notifications[0].message)
							.toBe("Error message");
					});

				it("should auto-dismiss after 10 seconds",
					() =>
					{
						service.error("Error message");
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(10000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("dismiss",
			() =>
			{
				it("should remove specific notification by ID",
					() =>
					{
						service.success("Message 1");
						service.info("Message 2");
						service.warning("Message 3");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(3);

						const idToRemove: string =
							notifications[1].id;
						service.dismiss(idToRemove);

						const updatedNotifications: Notification[] =
							service.readonlyNotifications();
						expect(updatedNotifications.length)
							.toBe(2);
						expect(
							updatedNotifications.find(
								(notification) =>
									notification.id === idToRemove))
							.toBeUndefined();
					});

				it("should do nothing if ID does not exist",
					() =>
					{
						service.success("Message 1");

						service.dismiss("non-existent-id");

						expect(service.readonlyNotifications().length)
							.toBe(1);
					});
			});

		describe("clearAll",
			() =>
			{
				it("should remove all notifications",
					() =>
					{
						service.success("Message 1");
						service.info("Message 2");
						service.warning("Message 3");

						expect(service.readonlyNotifications().length)
							.toBe(3);

						service.clearAll();

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});

				it("should do nothing when no notifications exist",
					() =>
					{
						service.clearAll();

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("multiple notifications",
			() =>
			{
				it("should handle multiple notifications correctly",
					() =>
					{
						service.success("Success 1");
						service.error("Error 1");
						service.warning("Warning 1");

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(3);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Success);
						expect(notifications[1].level)
							.toBe(NotificationLevel.Error);
						expect(notifications[2].level)
							.toBe(NotificationLevel.Warning);
					});

				it("should generate unique IDs for each notification",
					() =>
					{
						service.success("Message 1");
						service.success("Message 2");
						service.success("Message 3");

						const notifications: Notification[] =
							service.readonlyNotifications();
						const ids: string[] =
							notifications.map(
								(notification) => notification.id);
						const uniqueIds: Set<string> =
							new Set(ids);

						expect(uniqueIds.size)
							.toBe(3);
					});
			});

		describe("notification properties",
			() =>
			{
				it("should include duration in notification",
					() =>
					{
						service.success("Message", 3000);

						const notification: Notification =
							service.readonlyNotifications()[0];
						expect(notification.duration)
							.toBe(3000);
					});

				it("should include message in notification",
					() =>
					{
						const message: string = "Test notification message";
						service.info(message);

						const notification: Notification =
							service.readonlyNotifications()[0];
						expect(notification.message)
							.toBe(message);
					});
			});

		describe("successWithDetails",
			() =>
			{
				it("should create a success notification with details",
					() =>
					{
						const details: string[] =
							["Detail 1", "Detail 2"];

						service.successWithDetails("Test success", details);

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Success);
						expect(notifications[0].message)
							.toBe("Test success");
						expect(notifications[0].details)
							.toEqual(details);
					});

				it("should auto-dismiss after 5 seconds",
					() =>
					{
						service.successWithDetails("Test success",
							["Detail"]);

						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(5001);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("infoWithDetails",
			() =>
			{
				it("should create an info notification with details",
					() =>
					{
						const details: string[] =
							["Detail 1", "Detail 2"];

						service.infoWithDetails("Test info", details);

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Info);
						expect(notifications[0].message)
							.toBe("Test info");
						expect(notifications[0].details)
							.toEqual(details);
					});

				it("should auto-dismiss after 5 seconds",
					() =>
					{
						service.infoWithDetails("Test info",
							["Detail"]);

						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(5001);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("warningWithDetails",
			() =>
			{
				it("should create a warning notification with details",
					() =>
					{
						const details: string[] =
							["Detail 1", "Detail 2"];

						service.warningWithDetails("Test warning", details);

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Warning);
						expect(notifications[0].message)
							.toBe("Test warning");
						expect(notifications[0].details)
							.toEqual(details);
					});

				it("should auto-dismiss after 7 seconds",
					() =>
					{
						service.warningWithDetails("Test warning",
							["Detail"]);

						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(7001);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});
			});

		describe("errorWithDetails",
			() =>
			{
				it("should create error notification with details",
					() =>
					{
						const details: string[] =
							["Detail 1", "Detail 2"];
						service.errorWithDetails("Error message", details);

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications.length)
							.toBe(1);
						expect(notifications[0].level)
							.toBe(NotificationLevel.Error);
						expect(notifications[0].message)
							.toBe("Error message");
						expect(notifications[0].details)
							.toEqual(details);
					});

				it("should create error notification with copy data",
					() =>
					{
						const copyData: string =
							JSON.stringify(
								{
									error: "Test error",
									stack: "Error stack trace"
								});

						service.errorWithDetails("Error message", undefined, copyData);

						const notifications: Notification[] =
							service.readonlyNotifications();
						expect(notifications[0].copyData)
							.toBe(copyData);
					});

				it("should create error notification with both details and copy data",
					() =>
					{
						const details: string[] =
							["Validation failed", "Field 'email' is required"];
						const copyData: string =
							JSON.stringify(
								{ error: "Validation error" });

						service.errorWithDetails("Form error", details, copyData);

						const notification: Notification =
							service.readonlyNotifications()[0];
						expect(notification.details)
							.toEqual(details);
						expect(notification.copyData)
							.toBe(copyData);
					});

				it("should auto-dismiss after custom duration",
					() =>
					{
						service.errorWithDetails("Error",
							["Detail 1"], undefined, 5000);
						expect(service.readonlyNotifications().length)
							.toBe(1);

						vi.advanceTimersByTime(5000);

						expect(service.readonlyNotifications().length)
							.toBe(0);
					});

				it("should work without details or copy data",
					() =>
					{
						service.errorWithDetails("Simple error");

						const notification: Notification =
							service.readonlyNotifications()[0];
						expect(notification.message)
							.toBe("Simple error");
						expect(notification.details)
							.toBeUndefined();
						expect(notification.copyData)
							.toBeUndefined();
					});
			});
	});

describe("NotificationService copyToClipboard",
	() =>
	{
		let service: NotificationService;
		let clipboardMock: { copy: ReturnType<typeof vi.fn>; };

		beforeEach(
			() =>
			{
			// Mock CDK Clipboard
				clipboardMock =
					{
						copy: vi
							.fn()
							.mockReturnValue(true)
					};
				service =
					setupSimpleServiceTest(
						NotificationService,
						[{ provide: Clipboard, useValue: clipboardMock }]);
			});

		it("should copy notification data to clipboard",
			() =>
			{
				vi
					.spyOn(console, "info")
					.mockImplementation(
						() =>
						{});
				const copyData: string = "Error details to copy";
				service.errorWithDetails("Error", undefined, copyData);
				const notification: Notification =
					service.readonlyNotifications()[0];

				const result: boolean =
					service.copyToClipboard(notification);

				expect(result)
					.toBe(true);
				expect(clipboardMock.copy)
					.toHaveBeenCalledWith(copyData);
			});

		it("should return false if notification has no copy data",
			() =>
			{
				service.error("Error without copy data");
				const notification: Notification =
					service.readonlyNotifications()[0];

				const result: boolean =
					service.copyToClipboard(notification);

				expect(result)
					.toBe(false);
				expect(clipboardMock.copy).not.toHaveBeenCalled();
			});

		it("should return false and log error if clipboard copy fails",
			() =>
			{
				const logger: LoggerService =
					TestBed.inject(LoggerService);
				const loggerErrorSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(logger, "error");
				clipboardMock.copy.mockReturnValue(false);

				service.errorWithDetails("Error", undefined, "Copy data");
				const notification: Notification =
					service.readonlyNotifications()[0];

				const result: boolean =
					service.copyToClipboard(notification);

				expect(result)
					.toBe(false);
				expect(loggerErrorSpy)
					.toHaveBeenCalled();
			});

		it("should copy successfully and return true",
			() =>
			{
				service.errorWithDetails("Error", undefined, "Copy data");
				const notification: Notification =
					service.readonlyNotifications()[0];

				const result: boolean =
					service.copyToClipboard(notification);

				expect(result)
					.toBe(true);
			});

		it("should log copy data to LoggerService.debug when copying",
			() =>
			{
				const logger: LoggerService =
					TestBed.inject(LoggerService);
				const loggerDebugSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(logger, "debug");
				const copyData: string = "Error details to copy";

				service.errorWithDetails("Error", undefined, copyData);
				const notification: Notification =
					service.readonlyNotifications()[0];

				service.copyToClipboard(notification);

				expect(loggerDebugSpy)
					.toHaveBeenCalledWith(
						"Notification copied to clipboard",
						{ copyData });
			});
	});
