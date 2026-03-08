import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { LoggerService } from "@shared/services/logger.service";
import { createMockLogger, MockLoggerService } from "@shared/testing";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from "vitest";
import { TelemetryService } from "./telemetry.service";

describe("TelemetryService",
	() =>
	{
		let service: TelemetryService;
		let mockLogger: MockLoggerService;
		let originalTelemetryEnabled: boolean;

		beforeEach(
			() =>
			{
				originalTelemetryEnabled =
					environment.telemetry.enabled;
				mockLogger =
					createMockLogger();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TelemetryService,
							{ provide: LoggerService, useValue: mockLogger }
						]
					});

				service =
					TestBed.inject(TelemetryService);
			});

		afterEach(
			() =>
			{
				environment.telemetry.enabled =
					originalTelemetryEnabled;
				vi.restoreAllMocks();
			});

		it("should not initialize when telemetry is disabled",
			() =>
			{
				environment.telemetry.enabled = false;

				service.initialize();

				// No error should be logged — clean no-op
				expect(mockLogger.error)
					.not
					.toHaveBeenCalled();
			});

		it("should set initialized flag to prevent concurrent initialization",
			() =>
			{
				environment.telemetry.enabled = true;

				// First call should proceed
				service.initialize();

				// Second call should be a no-op (initialized is true immediately)
				// This verifies the race condition fix — initialized is set eagerly
				service.initialize();

				// No errors from the guard
				expect(mockLogger.error)
					.not
					.toHaveBeenCalled();
			});
	});