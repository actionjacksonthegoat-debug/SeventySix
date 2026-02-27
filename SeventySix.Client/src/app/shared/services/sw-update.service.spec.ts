/**
 * SwUpdateService Tests
 * Uses test factory pattern to eliminate repetitive TestBed configuration.
 */
import {
	createSwUpdateTestContext,
	type SwUpdateTestContext
} from "@shared/testing";
import { describe, expect, it, vi } from "vitest";

describe("SwUpdateService",
	() =>
	{
		it("should be created",
			() =>
			{
				const context: SwUpdateTestContext =
					createSwUpdateTestContext(
						{ isEnabled: true });

				expect(context.service)
					.toBeTruthy();
			});

		describe("checkForUpdate",
			() =>
			{
				it("should return false when SW is not enabled",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: false });

						const result: boolean =
							await context.service.checkForUpdate();

						expect(result)
							.toBe(false);
					});

				it("should return true when update is found",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockResolvedValue(true);

						const result: boolean =
							await context.service.checkForUpdate();

						expect(result)
							.toBe(true);
						expect(context.loggerSpy.info)
							.toHaveBeenCalledWith("Update found");
					});

				it("should return false when no update is available",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockResolvedValue(false);

						const result: boolean =
							await context.service.checkForUpdate();

						expect(result)
							.toBe(false);
						expect(context.loggerSpy.info)
							.toHaveBeenCalledWith("No update available");
					});

				it("should handle errors and return false",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockRejectedValue(new Error("Test error"));

						const result: boolean =
							await context.service.checkForUpdate();

						expect(result)
							.toBe(false);
						expect(context.loggerSpy.error)
							.toHaveBeenCalled();
					});
			});

		describe("forceUpdate",
			() =>
			{
				it("should not update when SW is not enabled",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: false });

						await context.service.forceUpdate();

						expect(context.swUpdateSpy.checkForUpdate)
							.not
							.toHaveBeenCalled();
					});

				it("should activate and reload when update is found",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockResolvedValue(true);
						context.swUpdateSpy.activateUpdate.mockResolvedValue(undefined);

						await context.service.forceUpdate();

						expect(context.swUpdateSpy.activateUpdate)
							.toHaveBeenCalled();
						expect(context.windowServiceSpy.reload)
							.toHaveBeenCalled();
					});

				it("should not activate when no update is found",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockResolvedValue(false);

						await context.service.forceUpdate();

						expect(context.swUpdateSpy.activateUpdate)
							.not
							.toHaveBeenCalled();
					});

				it("should handle errors",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.checkForUpdate.mockRejectedValue(new Error("Test error"));

						await context.service.forceUpdate();

						expect(context.loggerSpy.error)
							.toHaveBeenCalled();
					});
			});

		describe("version updates",
			() =>
			{
				it("should activate update and reload when user confirms",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.activateUpdate.mockResolvedValue(undefined);
						vi
							.spyOn(window, "confirm")
							.mockReturnValue(true);
						vi
							.spyOn(window, "alert")
							.mockImplementation(
								() =>
								{});

						context.versionUpdatesSubject.next(
							{
								type: "VERSION_READY",
								currentVersion: { hash: "abc" },
								latestVersion: { hash: "def" }
							});

						// Allow async activateUpdate to complete
						await new Promise<void>(
							(resolve) =>
							{
								setTimeout(resolve, 0);
							});

						expect(context.swUpdateSpy.activateUpdate)
							.toHaveBeenCalled();
						expect(context.windowServiceSpy.reload)
							.toHaveBeenCalled();
					});

				it("should not activate update when user declines",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						vi
							.spyOn(window, "confirm")
							.mockReturnValue(false);

						context.versionUpdatesSubject.next(
							{
								type: "VERSION_READY",
								currentVersion: { hash: "abc" },
								latestVersion: { hash: "def" }
							});

						await new Promise<void>(
							(resolve) =>
							{
								setTimeout(resolve, 0);
							});

						expect(context.swUpdateSpy.activateUpdate)
							.not
							.toHaveBeenCalled();
						expect(context.windowServiceSpy.reload)
							.not
							.toHaveBeenCalled();
					});

				it("should log error when activateUpdate fails",
					async () =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						context.swUpdateSpy.activateUpdate.mockRejectedValue(new Error("Activate error"));
						vi
							.spyOn(window, "confirm")
							.mockReturnValue(true);
						vi
							.spyOn(window, "alert")
							.mockImplementation(
								() =>
								{});

						context.versionUpdatesSubject.next(
							{
								type: "VERSION_READY",
								currentVersion: { hash: "abc" },
								latestVersion: { hash: "def" }
							});

						await new Promise<void>(
							(resolve) =>
							{
								setTimeout(resolve, 50);
							});

						expect(context.loggerSpy.error)
							.toHaveBeenCalled();
					});
			});

		describe("unrecoverable state",
			() =>
			{
				it("should log error and reload on unrecoverable state",
					() =>
					{
						const context: SwUpdateTestContext =
							createSwUpdateTestContext(
								{ isEnabled: true });
						vi
							.spyOn(window, "alert")
							.mockImplementation(
								() =>
								{});

						context.unrecoverableSubject.next(
							{
								type: "UNRECOVERABLE_STATE",
								reason: "hash mismatch"
							});

						expect(context.loggerSpy.error)
							.toHaveBeenCalled();
						expect(context.windowServiceSpy.reload)
							.toHaveBeenCalled();
					});
			});
	});