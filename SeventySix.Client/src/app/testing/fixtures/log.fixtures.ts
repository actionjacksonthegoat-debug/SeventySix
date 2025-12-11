/**
 * Log Test Fixtures
 * Centralized test data for Log entities
 * Eliminates duplication across log-related tests
 */

import { LogDto } from "@admin/logs/models";

/** Log fixture factory for consistent test data across log-related tests. */
export class LogFixtures
{
	/** Standard error log entry. */
	static readonly ERROR_LOG: LogDto = {
		id: 1,
		createDate: "2024-01-01T12:00:00Z",
		logLevel: "Error",
		message: "Test error message",
		sourceContext: "TestComponent",
		requestMethod: "GET",
		requestPath: "/api/test",
		statusCode: 500,
		durationMs: 1500,
		exceptionMessage: "Test exception",
		baseExceptionMessage: null,
		stackTrace: "Test stack trace",
		properties: null,
		machineName: "TEST-MACHINE",
		environment: "Test",
		correlationId: "corr-123",
		spanId: "span-456",
		parentSpanId: null
	};

	/** Standard warning log entry. */
	static readonly WARNING_LOG: LogDto = {
		id: 2,
		createDate: "2024-01-01T12:01:00Z",
		logLevel: "Warning",
		message: "Test warning message",
		sourceContext: "TestService",
		requestMethod: "POST",
		requestPath: "/api/test",
		statusCode: 400,
		durationMs: 250,
		exceptionMessage: null,
		baseExceptionMessage: null,
		stackTrace: null,
		properties: null,
		machineName: "TEST-MACHINE",
		environment: "Test",
		correlationId: "corr-124",
		spanId: "span-457",
		parentSpanId: null
	};

	/** Standard info log entry. */
	static readonly INFO_LOG: LogDto = {
		id: 3,
		createDate: "2024-01-01T12:02:00Z",
		logLevel: "Information",
		message: "Test info message",
		sourceContext: "TestController",
		requestMethod: "GET",
		requestPath: "/api/test",
		statusCode: 200,
		durationMs: 50,
		exceptionMessage: null,
		baseExceptionMessage: null,
		stackTrace: null,
		properties: null,
		machineName: "TEST-MACHINE",
		environment: "Test",
		correlationId: "corr-125",
		spanId: "span-458",
		parentSpanId: null
	};

	/** Create a custom log with optional overrides. Uses ERROR_LOG as base template. */
	static createLog(overrides?: Partial<LogDto>): LogDto
	{
		return { ...LogFixtures.ERROR_LOG, ...overrides };
	}

	/** Create multiple logs with incremental IDs. Useful for testing pagination and lists. */
	static createLogs(count: number, logLevel?: string): LogDto[]
	{
		return Array.from({ length: count }, (_, i) =>
			LogFixtures.createLog({
				id: i + 1,
				createDate: new Date(Date.now() - i * 60000).toISOString(),
				logLevel: logLevel || "Information",
				message: `Test log message ${i + 1}`
			}));
	}

	/** Get array of predefined test logs. Includes error, warning, and info logs. */
	static getAll(): LogDto[]
	{
		return [
			LogFixtures.ERROR_LOG,
			LogFixtures.WARNING_LOG,
			LogFixtures.INFO_LOG
		];
	}
}
