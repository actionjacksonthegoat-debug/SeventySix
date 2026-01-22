/**
 * Service Worker Update Test Factory
 * Provides parameterized test context creation for SwUpdateService tests
 * Eliminates repetitive TestBed configuration (was 7 calls, now reusable factory)
 *
 * @example
 * const context = createSwUpdateTestContext({ isEnabled: true });
 * context.swUpdateSpy.checkForUpdate.mockResolvedValue(true);
 * const result = await context.service.checkForUpdate();
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { LoggerService, SwUpdateService } from "@shared/services";
import { createMockLogger, type MockLoggerService } from "@testing/mock-factories";
import { Subject } from "rxjs";
import { type Mock, vi } from "vitest";

/**
 * Mock SwUpdate interface for testing service worker update functionality.
 */
export interface MockSwUpdate
{
	checkForUpdate: Mock<() => Promise<boolean>>;
	activateUpdate: Mock<() => Promise<boolean>>;
	isEnabled: boolean;
	versionUpdates: ReturnType<typeof Subject.prototype.asObservable>;
	unrecoverable: Subject<unknown>;
}

/**
 * SwUpdate test context containing all dependencies and utilities.
 */
export interface SwUpdateTestContext
{
	/** The service under test */
	service: SwUpdateService;
	/** Mock SwUpdate for controlling service worker behavior */
	swUpdateSpy: MockSwUpdate;
	/** Mock logger for verifying log calls */
	loggerSpy: MockLoggerService;
	/** Subject to emit version updates during tests */
	versionUpdatesSubject: Subject<VersionReadyEvent>;
	/** Subject to emit unrecoverable errors during tests */
	unrecoverableSubject: Subject<unknown>;
}

/**
 * Configuration options for SwUpdate test context.
 */
export interface SwUpdateTestOptions
{
	/** Whether service worker is enabled (default: true) */
	isEnabled?: boolean;
}

/**
 * Creates a test context for SwUpdateService with parameterized configuration.
 * Eliminates repetitive TestBed.resetTestingModule and configureTestingModule calls.
 *
 * @param {SwUpdateTestOptions} options
 * Configuration options for the test context.
 * @returns {SwUpdateTestContext}
 * Complete test context with service, mocks, and subjects.
 *
 * @example
 * // Test with service worker disabled
 * const context = createSwUpdateTestContext({ isEnabled: false });
 * const result = await context.service.checkForUpdate();
 * expect(result).toBe(false);
 *
 * @example
 * // Test update detection
 * const context = createSwUpdateTestContext({ isEnabled: true });
 * context.swUpdateSpy.checkForUpdate.mockResolvedValue(true);
 * const result = await context.service.checkForUpdate();
 * expect(result).toBe(true);
 * expect(context.loggerSpy.info).toHaveBeenCalledWith("Update found");
 */
export function createSwUpdateTestContext(
	options: SwUpdateTestOptions = {}): SwUpdateTestContext
{
	const {
		isEnabled = true
	} = options;

	const versionUpdatesSubject: Subject<VersionReadyEvent> =
		new Subject<VersionReadyEvent>();

	const unrecoverableSubject: Subject<unknown> =
		new Subject<unknown>();

	const swUpdateSpy: MockSwUpdate =
		{
			checkForUpdate: vi.fn(),
			activateUpdate: vi.fn(),
			isEnabled,
			versionUpdates: versionUpdatesSubject.asObservable(),
			unrecoverable: unrecoverableSubject
		};

	const loggerSpy: MockLoggerService =
		createMockLogger();

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

	const service: SwUpdateService =
		TestBed.inject(SwUpdateService);

	return {
		service,
		swUpdateSpy,
		loggerSpy,
		versionUpdatesSubject,
		unrecoverableSubject
	};
}
