import { vi } from "vitest";

import { NotificationLevel } from "@shared/constants";
import { Notification } from "@shared/models";
import { setupSimpleServiceTest } from "@shared/testing";
import { NotificationService } from "./notification.service";

describe("NotificationService duration fallback branches",
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

		it("should default showWithDetails duration to zero when omitted",
			() =>
			{
				const privateService: {
					showWithDetails: (
						level: NotificationLevel,
						message: string,
						details?: string[],
						copyData?: string,
						duration?: number) => void;
				} =
					service as unknown as {
						showWithDetails: (
							level: NotificationLevel,
							message: string,
							details?: string[],
							copyData?: string,
							duration?: number) => void;
					};

				privateService.showWithDetails(
					NotificationLevel.Info,
					"No duration provided");

				const notification: Notification =
					service.readonlyNotifications()[0];
				expect(notification.duration)
					.toBe(0);

				vi.advanceTimersByTime(20000);
				expect(service.readonlyNotifications().length)
					.toBe(1);
			});

		it("should default showWithAction duration to zero when omitted",
			() =>
			{
				const privateService: {
					showWithAction: (
						level: NotificationLevel,
						message: string,
						actionLabel: string,
						onAction: () => void,
						duration?: number) => void;
				} =
					service as unknown as {
						showWithAction: (
							level: NotificationLevel,
							message: string,
							actionLabel: string,
							onAction: () => void,
							duration?: number) => void;
					};

				privateService.showWithAction(
					NotificationLevel.Warning,
					"Action without duration",
					"Retry",
					() => undefined);

				const notification: Notification =
					service.readonlyNotifications()[0];
				expect(notification.duration)
					.toBe(0);

				vi.advanceTimersByTime(20000);
				expect(service.readonlyNotifications().length)
					.toBe(1);
			});
	});