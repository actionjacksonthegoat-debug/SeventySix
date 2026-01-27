/**
 * SwUpdateService Tests
 * Uses test factory pattern to eliminate repetitive TestBed configuration.
 */
import {
	createSwUpdateTestContext,
	type SwUpdateTestContext
} from "@shared/testing";
import { describe, expect, it } from "vitest";

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
	});
