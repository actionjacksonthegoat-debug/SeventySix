import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { createMockLogger } from "@shared/testing";
import { Subject } from "rxjs";
import { vi } from "vitest";
import { LoggerService } from "./logger.service";
import { SwUpdateService } from "./sw-update.service";

interface MockSwUpdate
{
	checkForUpdate: ReturnType<typeof vi.fn>;
	activateUpdate: ReturnType<typeof vi.fn>;
	isEnabled: boolean;
	versionUpdates: ReturnType<typeof Subject.prototype.asObservable>;
	unrecoverable: Subject<unknown>;
}

interface MockLoggerService
{
	info: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warning: ReturnType<typeof vi.fn>;
	debug: ReturnType<typeof vi.fn>;
}

describe("SwUpdateService",
	() =>
	{
		let service: SwUpdateService;
		let swUpdateSpy: MockSwUpdate;
		let loggerSpy: MockLoggerService;
		let versionUpdatesSubject: Subject<VersionReadyEvent>;

		const createSwUpdateSpy: (isEnabled: boolean) => MockSwUpdate =
			(isEnabled: boolean) =>
			{
				versionUpdatesSubject =
					new Subject<VersionReadyEvent>();

				return {
					checkForUpdate: vi.fn(),
					activateUpdate: vi.fn(),
					isEnabled,
					versionUpdates: versionUpdatesSubject.asObservable(),
					unrecoverable: new Subject()
				};
			};

		beforeEach(
			() =>
			{
				loggerSpy =
					createMockLogger() as unknown as MockLoggerService;
			});

		it("should be created",
			() =>
			{
				swUpdateSpy =
					createSwUpdateSpy(true);

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SwUpdateService,
							{ provide: SwUpdate, useValue: swUpdateSpy },
							{ provide: LoggerService, useValue: loggerSpy }
						]
					});

				service =
					TestBed.inject(SwUpdateService);
				expect(service)
					.toBeTruthy();
			});

		describe("checkForUpdate",
			() =>
			{
				it("should return false when SW is not enabled",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(false);

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						const result: boolean =
							await service.checkForUpdate();
						expect(result)
							.toBe(false);
					});

				it("should return true when update is found",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(true);
						swUpdateSpy.checkForUpdate.mockResolvedValue(true);

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						const result: boolean =
							await service.checkForUpdate();

						expect(result)
							.toBe(true);
						expect(loggerSpy.info)
							.toHaveBeenCalledWith("Update found");
					});

				it("should return false when no update is available",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(true);
						swUpdateSpy.checkForUpdate.mockResolvedValue(false);

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						const result: boolean =
							await service.checkForUpdate();

						expect(result)
							.toBe(false);
						expect(loggerSpy.info)
							.toHaveBeenCalledWith("No update available");
					});

				it("should handle errors and return false",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(true);
						swUpdateSpy.checkForUpdate.mockRejectedValue(new Error("Test error"));

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						const result: boolean =
							await service.checkForUpdate();

						expect(result)
							.toBe(false);
						expect(loggerSpy.error)
							.toHaveBeenCalled();
					});
			});

		describe("forceUpdate",
			() =>
			{
				it("should not update when SW is not enabled",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(false);

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						await service.forceUpdate();
						expect(swUpdateSpy.checkForUpdate).not.toHaveBeenCalled();
					});

				it("should handle errors",
					async () =>
					{
						swUpdateSpy =
							createSwUpdateSpy(true);
						swUpdateSpy.checkForUpdate.mockRejectedValue(new Error("Test error"));

						TestBed.resetTestingModule();
						TestBed.configureTestingModule(
							{
								providers: [
									provideZonelessChangeDetection(),
									SwUpdateService,
									{ provide: SwUpdate, useValue: swUpdateSpy },
									{ provide: LoggerService, useValue: loggerSpy }
								]
							});

						service =
							TestBed.inject(SwUpdateService);
						await service.forceUpdate();

						expect(loggerSpy.error)
							.toHaveBeenCalled();
					});
			});
	});
