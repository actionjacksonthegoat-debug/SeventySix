/* eslint-disable no-console */

import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { setupSimpleServiceTest } from "@shared/testing";
import { vi } from "vitest";
import { LoggerService } from "./logger.service";

describe("LoggerService",
	() =>
	{
		let service: LoggerService;
		let httpMock: HttpTestingController;
		let consoleLogSpy: ReturnType<typeof vi.spyOn>;
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(
			() =>
			{
				vi.clearAllMocks();

				service =
					setupSimpleServiceTest(
						LoggerService,
						[
							provideHttpClient(),
							provideHttpClientTesting()
						]);
				httpMock =
					TestBed.inject(HttpTestingController);

				consoleLogSpy =
					vi
						.spyOn(console, "log")
						.mockImplementation(
							() =>
							{});
				consoleWarnSpy =
					vi
						.spyOn(console, "warn")
						.mockImplementation(
							() =>
							{});
				consoleErrorSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});
			});

		afterEach(
			() =>
			{
				httpMock.verify();
			});

		describe("debug",
			() =>
			{
				it("should log debug message to console",
					() =>
					{
						service.debug("Debug message");

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Debug message");
					});

				it("should include context in debug log",
					() =>
					{
						const context: { userId: number; } =
							{ userId: 123 };

						service.debug("Debug with context", context);

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(context);
					});
			});

		describe("info",
			() =>
			{
				it("should log info message to console",
					() =>
					{
						service.info("Info message");

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Info message");
					});

				it("should include context in info log",
					() =>
					{
						const context: { action: string; } =
							{ action: "test" };

						service.info("Info with context", context);

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(context);
					});
			});

		describe("warning",
			() =>
			{
				it("should log warning message to console",
					() =>
					{
						service.warning("Warning message");

						expect(console.warn)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleWarnSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Warning message");
					});

				it("should include context in warning log",
					() =>
					{
						const context: { reason: string; } =
							{ reason: "timeout" };

						service.warning("Warning with context", context);

						expect(console.warn)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleWarnSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(context);
					});
			});

		describe("error",
			() =>
			{
				it("should log error message to console",
					() =>
					{
						service.error("Error message");

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Error message");
					});

				it("should include error object in log",
					() =>
					{
						const error: Error =
							new Error("Test error");

						service.error("Error with exception", error);

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(error);
					});

				it("should include both error and context",
					() =>
					{
						const error: Error =
							new Error("Test error");
						const context: { operation: string; } =
							{ operation: "save" };

						service.error("Error with context", error, context);

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(context);
						expect(lastCall?.[3])
							.toBe(error);
					});
			});

		describe("critical",
			() =>
			{
				it("should log critical message to console",
					() =>
					{
						service.critical("Critical error");

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Critical error");
					});

				it("should include error object in critical log",
					() =>
					{
						const error: Error =
							new Error("Critical failure");

						service.critical("Critical failure occurred", error);

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(error);
					});
			});

		describe("log levels",
			() =>
			{
				it("should use console.log for debug and info",
					() =>
					{
						service.debug("Debug");
						service.info("Info");

						expect(console.log)
							.toHaveBeenCalledTimes(2);
						expect(console.warn).not.toHaveBeenCalled();
						expect(console.error).not.toHaveBeenCalled();
					});

				it("should use console.warn for warnings",
					() =>
					{
						service.warning("Warning");

						expect(console.warn)
							.toHaveBeenCalledTimes(1);
						expect(console.log).not.toHaveBeenCalled();
						expect(console.error).not.toHaveBeenCalled();
					});

				it("should use console.error for errors and critical",
					() =>
					{
						service.error("Error");
						service.critical("Critical");

						expect(console.error)
							.toHaveBeenCalledTimes(2);
						expect(console.log).not.toHaveBeenCalled();
						expect(console.warn).not.toHaveBeenCalled();
					});
			});

		describe("timestamp",
			() =>
			{
				it("should include timestamp in log prefix",
					() =>
					{
						service.info("Test message");

						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						const prefix: string =
							lastCall?.[0] as string;
						expect(prefix)
							.toContain("[Information]");
						expect(prefix)
							.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
					});
			});

		describe("structured logging",
			() =>
			{
				it("should create structured log entry with all fields",
					() =>
					{
						const context: { user: string; action: string; } =
							{
								user: "test",
								action: "login"
							};
						const error: Error =
							new Error("Login failed");

						service.error("Login error", error, context);

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;

						// Verify prefix includes level
						expect(lastCall?.[0])
							.toContain("[Error]");

						// Verify message
						expect(lastCall?.[1])
							.toBe("Login error");

						// Verify context
						expect(lastCall?.[2])
							.toBe(context);

						// Verify error
						expect(lastCall?.[3])
							.toBe(error);
					});
			});

		describe("force methods",
			() =>
			{
				it("should force log debug message regardless of level filtering",
					() =>
					{
						service.forceDebug("Force debug message");

						// Flush the HTTP request that force logging sends
						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								"http://localhost:1234/api/v1/logs/client");
						req.flush({});

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Force debug message");
					});

				it("should force log info message regardless of level filtering",
					() =>
					{
						service.forceInfo("Force info message");

						// Flush the HTTP request that force logging sends
						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								"http://localhost:1234/api/v1/logs/client");
						req.flush({});

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Force info message");
					});

				it("should force log warning message regardless of level filtering",
					() =>
					{
						service.forceWarning("Force warning message");

						// Flush the HTTP request that force logging sends
						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								"http://localhost:1234/api/v1/logs/client");
						req.flush({});

						expect(console.warn)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleWarnSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Force warning message");
					});

				it("should force log error message regardless of level filtering",
					() =>
					{
						const error: Error =
							new Error("Test error");

						service.forceError("Force error message", error);

						// Flush the HTTP request that force logging sends
						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								"http://localhost:1234/api/v1/logs/client");
						req.flush({});

						expect(console.error)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleErrorSpy.mock.lastCall;
						expect(lastCall?.[1])
							.toBe("Force error message");
						expect(lastCall?.[2])
							.toBe(error);
					});

				it("should include context in force log methods",
					() =>
					{
						const context: { source: string; } =
							{ source: "test" };

						service.forceInfo("Force info with context", context);

						// Flush the HTTP request that force logging sends
						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								"http://localhost:1234/api/v1/logs/client");
						req.flush({});

						expect(console.log)
							.toHaveBeenCalled();
						const lastCall: unknown[] | undefined =
							consoleLogSpy.mock.lastCall;
						expect(lastCall?.[2])
							.toBe(context);
					});
			});
	});