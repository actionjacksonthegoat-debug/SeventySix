/**
 * Log Test Fixtures
 * Centralized test data for Log entities
 * Eliminates duplication across log-related tests
 */

import { LogResponse } from "@admin/logs/models/log.model";

/**
 * Log fixture factory
 * Provides consistent test data across all log-related tests
 */
export class LogFixtures
{
	/**
	 * Standard error log entry
	 */
	static readonly ERROR_LOG: LogResponse = {
		id: 1,
		createDate: new Date("2024-01-01T12:00:00Z"),
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

	/**
	 * Standard warning log entry
	 */
	static readonly WARNING_LOG: LogResponse = {
		id: 2,
		createDate: new Date("2024-01-01T12:01:00Z"),
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

	/**
	 * Standard info log entry
	 */
	static readonly INFO_LOG: LogResponse = {
		id: 3,
		createDate: new Date("2024-01-01T12:02:00Z"),
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

	/**
	 * Create a custom log with optional overrides
	 * Uses ERROR_LOG as base template
	 *
	 * @param overrides - Partial log properties to override
	 * @returns LogResponse object with merged properties
	 *
	 * @example
	 * const warningLog = LogFixtures.createLog({ logLevel: 'Warning' });
	 * const customLog = LogFixtures.createLog({ message: 'Custom message' });
	 */
	static createLog(overrides?: Partial<LogResponse>): LogResponse
	{
		return { ...LogFixtures.ERROR_LOG, ...overrides };
	}

	/**
	 * Create multiple logs with incremental IDs
	 * Useful for testing pagination and lists
	 *
	 * @param count - Number of logs to create
	 * @param logLevel - Optional log level for all logs
	 * @returns Array of log objects
	 *
	 * @example
	 * const logs = LogFixtures.createLogs(50); // For pagination tests
	 * const errorLogs = LogFixtures.createLogs(10, 'Error');
	 */
	static createLogs(count: number, logLevel?: string): LogResponse[]
	{
		return Array.from({ length: count }, (_, i) =>
			LogFixtures.createLog({
				id: i + 1,
				createDate: new Date(Date.now() - i * 60000), // Each log 1 min apart
				logLevel: logLevel || "Information",
				message: `Test log message ${i + 1}`
			})
		);
	}

	/**
	 * Get array of predefined test logs
	 * Includes error, warning, and info logs
	 *
	 * @returns Array containing all predefined logs
	 */
	static getAll(): LogResponse[]
	{
		return [
			LogFixtures.ERROR_LOG,
			LogFixtures.WARNING_LOG,
			LogFixtures.INFO_LOG
		];
	}
}
