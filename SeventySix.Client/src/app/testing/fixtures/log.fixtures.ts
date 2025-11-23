/**
 * Log Test Fixtures
 * Centralized test data for Log entities
 * Eliminates duplication across log-related tests
 */

import { LogResponse } from "@features/admin/log-management/models/log.model";

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
		timestamp: new Date("2024-01-01T12:00:00Z"),
		logLevel: "Error",
		message: "Test error message",
		sourceContext: "TestComponent",
		requestPath: "/api/test",
		statusCode: 500,
		exception: "Test exception",
		stackTrace: "Test stack trace",
		properties: {},
		requestId: null,
		machineName: null,
		threadId: null,
		application: null,
		environment: null,
		userId: null,
		userName: null,
		sessionId: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null,
		clientIp: null,
		userAgent: null,
		duration: null
	};

	/**
	 * Standard warning log entry
	 */
	static readonly WARNING_LOG: LogResponse = {
		id: 2,
		timestamp: new Date("2024-01-01T12:01:00Z"),
		logLevel: "Warning",
		message: "Test warning message",
		sourceContext: "TestService",
		requestPath: "/api/test",
		statusCode: 400,
		exception: null,
		stackTrace: null,
		properties: {},
		requestId: null,
		machineName: null,
		threadId: null,
		application: null,
		environment: null,
		userId: null,
		userName: null,
		sessionId: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null,
		clientIp: null,
		userAgent: null,
		duration: null
	};

	/**
	 * Standard info log entry
	 */
	static readonly INFO_LOG: LogResponse = {
		id: 3,
		timestamp: new Date("2024-01-01T12:02:00Z"),
		logLevel: "Information",
		message: "Test info message",
		sourceContext: "TestController",
		requestPath: "/api/test",
		statusCode: 200,
		exception: null,
		stackTrace: null,
		properties: {},
		requestId: null,
		machineName: null,
		threadId: null,
		application: null,
		environment: null,
		userId: null,
		userName: null,
		sessionId: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null,
		clientIp: null,
		userAgent: null,
		duration: null
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
				timestamp: new Date(Date.now() - i * 60000), // Each log 1 min apart
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
