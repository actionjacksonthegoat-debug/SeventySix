import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LogResponse, LogLevel } from "@admin/logs/models";
import { Clipboard } from "@angular/cdk/clipboard";
import { LogDetailDialogComponent } from "./log-detail-dialog.component";

describe("LogDetailDialogComponent", () =>
{
	let component: LogDetailDialogComponent;
	let fixture: ComponentFixture<LogDetailDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<LogDetailDialogComponent>>;
	let mockClipboard: jasmine.SpyObj<Clipboard>;

	const mockLog: LogResponse = {
		id: 1,
		createDate: new Date("2024-11-13T09:00:00Z"),
		logLevel: "Error",
		message: "An error occurred while processing the request.",
		exceptionMessage: "System.Exception: Test exception",
		baseExceptionMessage: null,
		stackTrace:
			"   at TestService.Method()\n      in TestService.cs:line 42\n   at TestController.Action()\n      in TestController.cs:line 87",
		sourceContext: "TestService",
		requestMethod: "GET",
		requestPath: "/api/test",
		statusCode: 500,
		durationMs: 1500,
		properties: JSON.stringify({ key: "value", nested: { prop: "data" } }),
		machineName: "TEST-MACHINE",
		environment: "Test",
		correlationId: "corr-123",
		spanId: "span-456",
		parentSpanId: "parent-789"
	};

	beforeEach(async () =>
	{
		mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
		mockClipboard = jasmine.createSpyObj("Clipboard", ["copy"]);

		await TestBed.configureTestingModule({
			imports: [LogDetailDialogComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: MAT_DIALOG_DATA, useValue: mockLog },
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: Clipboard, useValue: mockClipboard }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LogDetailDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should initialize with log data", () =>
	{
		expect(component.log()).toEqual(mockLog);
	});

	it("should display log level name", () =>
	{
		expect(component.getLevelName("Error")).toBe("Error");
		expect(component.getLevelName("Warning")).toBe("Warning");
		expect(component.getLevelName("Fatal")).toBe("Fatal");
		expect(component.getLevelName("Information")).toBe("Info");
		expect(component.getLevelName("Debug")).toBe("Debug");
		expect(component.getLevelName("Verbose")).toBe("Verbose");
	});

	it("should display log level icon", () =>
	{
		expect(component.getLevelIcon("Error")).toBe("error");
		expect(component.getLevelIcon("Warning")).toBe("warning");
		expect(component.getLevelIcon("Fatal")).toBe("cancel");
		expect(component.getLevelIcon("Information")).toBe("info");
	});

	it("should display log level CSS class", () =>
	{
		expect(component.getLevelClass("Error")).toBe("level-error");
		expect(component.getLevelClass("Warning")).toBe("level-warning");
		expect(component.getLevelClass("Fatal")).toBe("level-fatal");
	});

	it("should format relative time correctly", () =>
	{
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
		const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
		const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

		expect(component.getRelativeTime(twoMinutesAgo)).toBe("2 minutes ago");
		expect(component.getRelativeTime(twoHoursAgo)).toBe("2 hours ago");
		expect(component.getRelativeTime(twoDaysAgo)).toBe("2 days ago");
	});

	it("should format relative time as 'just now' for recent logs", () =>
	{
		const now = new Date();
		expect(component.getRelativeTime(now)).toBe("just now");
	});

	it("should format stack trace with line breaks", () =>
	{
		const stackTrace =
			"   at TestService.Method()\n      in TestService.cs:line 42\n   at TestController.Action()";
		const formatted = component.formatStackTrace(stackTrace);

		expect(formatted).toContain("at TestService.Method()");
		expect(formatted).toContain("in TestService.cs:line 42");
		expect(formatted.split("\n").length).toBeGreaterThan(1);
	});

	it("should return empty string when stack trace is null", () =>
	{
		expect(component.formatStackTrace(null)).toBe("");
	});

	it("should format properties as JSON", () =>
	{
		const properties: string = JSON.stringify({
			key: "value",
			nested: { prop: "data" }
		});
		const formatted: string = component.formatProperties(properties);

		expect(formatted).toContain('"key"');
		expect(formatted).toContain('"value"');
		expect(formatted).toContain('"nested"');
	});

	it("should return empty string when properties is null", () =>
	{
		expect(component.formatProperties(null)).toBe("");
	});

	it("should return original string when properties is invalid JSON", () =>
	{
		const invalidJson: string = "not valid json";
		expect(component.formatProperties(invalidJson)).toBe(invalidJson);
	});

	it("should toggle stack trace collapse state", () =>
	{
		expect(component.stackTraceCollapsed()).toBe(false);
		component.toggleStackTrace();
		expect(component.stackTraceCollapsed()).toBe(true);
		component.toggleStackTrace();
		expect(component.stackTraceCollapsed()).toBe(false);
	});

	it("should toggle properties collapse state", () =>
	{
		expect(component.propertiesCollapsed()).toBe(true);
		component.toggleProperties();
		expect(component.propertiesCollapsed()).toBe(false);
		component.toggleProperties();
		expect(component.propertiesCollapsed()).toBe(true);
	});

	it("should copy log details to clipboard as JSON", (done) =>
	{
		mockClipboard.copy.and.returnValue(true);

		component.copyToClipboard();

		setTimeout(() =>
		{
			expect(mockClipboard.copy).toHaveBeenCalledWith(
				jasmine.any(String)
			);
			const copiedText = mockClipboard.copy.calls.mostRecent().args[0];
			const parsed = JSON.parse(copiedText);
			expect(parsed.id).toBe(mockLog.id);
			expect(parsed.message).toBe(mockLog.message);
			done();
		}, 0);
	});

	it("should emit delete event and close dialog", (done) =>
	{
		component.deleteLog.subscribe((id: number) =>
		{
			expect(id).toBe(mockLog.id);
			done();
		});

		component.onDelete();

		expect(mockDialogRef.close).toHaveBeenCalled();
	});

	it("should close dialog when close is called", () =>
	{
		component.onClose();
		expect(mockDialogRef.close).toHaveBeenCalled();
	});

	it("should display formatted request information", () =>
	{
		expect(component.log().requestPath).toBe("/api/test");
		expect(component.log().statusCode).toBe(500);
		expect(component.log().durationMs).toBe(1500);
	});

	it("should display formatted source context", () =>
	{
		expect(component.log().sourceContext).toBe("TestService");
		expect(component.log().requestMethod).toBe("GET");
	});

	it("should display formatted metadata", () =>
	{
		expect(component.log().machineName).toBe("TEST-MACHINE");
		expect(component.log().environment).toBe("Test");
	});

	it("should handle log with null fields gracefully", () =>
	{
		// Test that formatters handle null values
		expect(component.formatStackTrace(null)).toBe("");
		expect(component.formatProperties(null)).toBe("");
	});

	it("should display duration in milliseconds", () =>
	{
		expect(component.log().durationMs).toBe(1500);
	});

	it("should format HTTP method from request info", () =>
	{
		// Test that request path is displayed correctly
		const requestPath = component.log().requestPath;
		expect(requestPath).toBe("/api/test");
	});

	it("should show correlation ID for request tracking", () =>
	{
		expect(component.log().correlationId).toBe("corr-123");
		expect(component.log().spanId).toBe("span-456");
	});

	describe("isError", () =>
	{
		it("should return true for Error level", () =>
		{
			component.log.set({ ...mockLog, logLevel: "Error" });
			expect(component.isError()).toBe(true);
		});

		it("should return true for Fatal level", () =>
		{
			component.log.set({ ...mockLog, logLevel: "Fatal" });
			expect(component.isError()).toBe(true);
		});

		it("should return false for non-error levels", () =>
		{
			component.log.set({ ...mockLog, logLevel: "Warning" });
			expect(component.isError()).toBe(false);

			component.log.set({ ...mockLog, logLevel: "Information" });
			expect(component.isError()).toBe(false);
		});
	});

	describe("hasCorrelationId", () =>
	{
		it("should return true when correlation ID exists", () =>
		{
			component.log.set({ ...mockLog, correlationId: "test-123" });
			expect(component.hasCorrelationId()).toBe(true);
		});

		it("should return false when correlation ID is null", () =>
		{
			component.log.set({ ...mockLog, correlationId: null });
			expect(component.hasCorrelationId()).toBe(false);
		});

		it("should return false when correlation ID is empty string", () =>
		{
			component.log.set({ ...mockLog, correlationId: "" });
			expect(component.hasCorrelationId()).toBe(false);
		});
	});

	describe("isRootSpan", () =>
	{
		it("should return false when parentSpanId is null", () =>
		{
			expect(component.isRootSpan(null)).toBe(false);
		});

		it("should return true when parentSpanId is all zeros", () =>
		{
			expect(component.isRootSpan("0000000000000000")).toBe(true);
			expect(component.isRootSpan("00000000")).toBe(true);
		});

		it("should return false when parentSpanId has non-zero values", () =>
		{
			expect(component.isRootSpan("parent-789")).toBe(false);
			expect(component.isRootSpan("1234567890abcdef")).toBe(false);
		});
	});

	describe("getRelativeTime", () =>
	{
		it("should return days ago when difference is in days", () =>
		{
			const now = new Date();
			const threeDaysAgo = new Date(
				now.getTime() - 3 * 24 * 60 * 60 * 1000
			);
			expect(component.getRelativeTime(threeDaysAgo)).toBe("3 days ago");
		});

		it("should return singular day when difference is 1 day", () =>
		{
			const now = new Date();
			const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
			expect(component.getRelativeTime(oneDayAgo)).toBe("1 day ago");
		});

		it("should return hours ago when difference is in hours", () =>
		{
			const now = new Date();
			const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
			expect(component.getRelativeTime(threeHoursAgo)).toBe(
				"3 hours ago"
			);
		});

		it("should return singular hour when difference is 1 hour", () =>
		{
			const now = new Date();
			const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
			expect(component.getRelativeTime(oneHourAgo)).toBe("1 hour ago");
		});

		it("should return minutes ago when difference is in minutes", () =>
		{
			const now = new Date();
			const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
			expect(component.getRelativeTime(fiveMinutesAgo)).toBe(
				"5 minutes ago"
			);
		});

		it("should return singular minute when difference is 1 minute", () =>
		{
			const now = new Date();
			const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
			expect(component.getRelativeTime(oneMinuteAgo)).toBe(
				"1 minute ago"
			);
		});
	});

	describe("getStackFrameCount", () =>
	{
		it("should return 0 when stack trace is null", () =>
		{
			expect(component.getStackFrameCount(null)).toBe(0);
		});

		it("should count stack frames starting with 'at '", () =>
		{
			const stackTrace: string =
				"   at Method1()\n   at Method2()\n   at Method3()\nOther line";
			expect(component.getStackFrameCount(stackTrace)).toBe(3);
		});

		it("should return 0 when no frames match pattern", () =>
		{
			const stackTrace: string = "No frames here\nJust text";
			expect(component.getStackFrameCount(stackTrace)).toBe(0);
		});
	});

	describe("openInJaeger", () =>
	{
		it("should show alert when no correlation ID exists", () =>
		{
			spyOn(window, "alert");
			component.log.set({ ...mockLog, correlationId: null });

			component.openInJaeger();

			expect(window.alert).toHaveBeenCalledWith(
				jasmine.stringContaining("No trace ID available")
			);
		});

		it("should open Jaeger URL when correlation ID exists", () =>
		{
			spyOn(window, "open");
			component.log.set({ ...mockLog, correlationId: "trace-123" });

			component.openInJaeger();

			expect(window.open).toHaveBeenCalledWith(
				jasmine.stringContaining("trace-123"),
				"_blank"
			);
		});
	});

	describe("toggleException", () =>
	{
		it("should toggle exception collapse state", () =>
		{
			expect(component.exceptionCollapsed()).toBe(false);
			component.toggleException();
			expect(component.exceptionCollapsed()).toBe(true);
			component.toggleException();
			expect(component.exceptionCollapsed()).toBe(false);
		});
	});

	describe("handleEscape", () =>
	{
		it("should close dialog on escape key", () =>
		{
			component.handleEscape();
			expect(mockDialogRef.close).toHaveBeenCalled();
		});
	});
});
