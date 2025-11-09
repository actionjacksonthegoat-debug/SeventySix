import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	HttpClientTestingModule,
	HttpTestingController
} from "@angular/common/http/testing";
import { LoggerService, LogLevel } from "./logger.service";

describe("LoggerService", () =>
{
	let service: LoggerService;
	let httpMock: HttpTestingController;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [provideZonelessChangeDetection()]
		});

		service = TestBed.inject(LoggerService);
		httpMock = TestBed.inject(HttpTestingController);

		// Mock console methods
		spyOn(console, "log");
		spyOn(console, "warn");
		spyOn(console, "error");
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	describe("debug", () =>
	{
		it("should log debug message to console", () =>
		{
			service.debug("Debug message");

			expect(console.log).toHaveBeenCalled();
			const call = (console.log as jasmine.Spy).calls.mostRecent();
			expect(call.args[1]).toBe("Debug message");
		});

		it("should include context in debug log", () =>
		{
			const context = { userId: 123 };

			service.debug("Debug with context", context);

			expect(console.log).toHaveBeenCalled();
			const call = (console.log as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(context);
		});
	});

	describe("info", () =>
	{
		it("should log info message to console", () =>
		{
			service.info("Info message");

			expect(console.log).toHaveBeenCalled();
			const call = (console.log as jasmine.Spy).calls.mostRecent();
			expect(call.args[1]).toBe("Info message");
		});

		it("should include context in info log", () =>
		{
			const context = { action: "test" };

			service.info("Info with context", context);

			expect(console.log).toHaveBeenCalled();
			const call = (console.log as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(context);
		});
	});

	describe("warning", () =>
	{
		it("should log warning message to console", () =>
		{
			service.warning("Warning message");

			expect(console.warn).toHaveBeenCalled();
			const call = (console.warn as jasmine.Spy).calls.mostRecent();
			expect(call.args[1]).toBe("Warning message");
		});

		it("should include context in warning log", () =>
		{
			const context = { reason: "timeout" };

			service.warning("Warning with context", context);

			expect(console.warn).toHaveBeenCalled();
			const call = (console.warn as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(context);
		});
	});

	describe("error", () =>
	{
		it("should log error message to console", () =>
		{
			service.error("Error message");

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();
			expect(call.args[1]).toBe("Error message");
		});

		it("should include error object in log", () =>
		{
			const error = new Error("Test error");

			service.error("Error with exception", error);

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(error);
		});

		it("should include both error and context", () =>
		{
			const error = new Error("Test error");
			const context = { operation: "save" };

			service.error("Error with context", error, context);

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(context);
			expect(call.args[3]).toBe(error);
		});
	});

	describe("critical", () =>
	{
		it("should log critical message to console", () =>
		{
			service.critical("Critical error");

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();
			expect(call.args[1]).toBe("Critical error");
		});

		it("should include error object in critical log", () =>
		{
			const error = new Error("Critical failure");

			service.critical("Critical failure occurred", error);

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();
			expect(call.args[2]).toBe(error);
		});
	});

	describe("log levels", () =>
	{
		it("should use console.log for debug and info", () =>
		{
			service.debug("Debug");
			service.info("Info");

			expect(console.log).toHaveBeenCalledTimes(2);
			expect(console.warn).not.toHaveBeenCalled();
			expect(console.error).not.toHaveBeenCalled();
		});

		it("should use console.warn for warnings", () =>
		{
			service.warning("Warning");

			expect(console.warn).toHaveBeenCalledTimes(1);
			expect(console.log).not.toHaveBeenCalled();
			expect(console.error).not.toHaveBeenCalled();
		});

		it("should use console.error for errors and critical", () =>
		{
			service.error("Error");
			service.critical("Critical");

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.log).not.toHaveBeenCalled();
			expect(console.warn).not.toHaveBeenCalled();
		});
	});

	describe("timestamp", () =>
	{
		it("should include timestamp in log prefix", () =>
		{
			service.info("Test message");

			const call = (console.log as jasmine.Spy).calls.mostRecent();
			const prefix = call.args[0] as string;
			expect(prefix).toContain("[Info]");
			expect(prefix).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});

	describe("structured logging", () =>
	{
		it("should create structured log entry with all fields", () =>
		{
			const context = { user: "test", action: "login" };
			const error = new Error("Login failed");

			service.error("Login error", error, context);

			expect(console.error).toHaveBeenCalled();
			const call = (console.error as jasmine.Spy).calls.mostRecent();

			// Verify prefix includes level
			expect(call.args[0]).toContain("[Error]");

			// Verify message
			expect(call.args[1]).toBe("Login error");

			// Verify context
			expect(call.args[2]).toBe(context);

			// Verify error
			expect(call.args[3]).toBe(error);
		});
	});
});
