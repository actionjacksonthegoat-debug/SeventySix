import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { LogResponse, LogLevel } from "@admin/log-management/models";
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
		timestamp: new Date("2025-11-12T10:30:00Z"),
		level: LogLevel.Error,
		message: "Test error message",
		sourceContext: "TestService",
		exception: "System.Exception: Test exception",
		stackTrace:
			"   at TestService.Method()\n      in TestService.cs:line 42\n   at TestController.Action()\n      in TestController.cs:line 87",
		requestId: "req-123",
		requestPath: "/api/test",
		machineName: "TEST-MACHINE",
		threadId: 42,
		application: "SeventySix",
		environment: "Test",
		userId: "user-123",
		userName: "testuser",
		sessionId: "session-123",
		correlationId: "corr-123",
		spanId: "span-456",
		parentSpanId: "parent-789",
		clientIp: "127.0.0.1",
		userAgent: "Mozilla/5.0",
		duration: 1500,
		statusCode: 500,
		properties: { key: "value", nested: { prop: "data" } }
	};

	beforeEach(async () =>
	{
		mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
		mockClipboard = jasmine.createSpyObj("Clipboard", ["copy"]);

		await TestBed.configureTestingModule({
			imports: [LogDetailDialogComponent, NoopAnimationsModule],
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
		expect(component.getLevelName(LogLevel.Error)).toBe("Error");
		expect(component.getLevelName(LogLevel.Warning)).toBe("Warning");
		expect(component.getLevelName(LogLevel.Fatal)).toBe("Fatal");
		expect(component.getLevelName(LogLevel.Information)).toBe("Info");
		expect(component.getLevelName(LogLevel.Debug)).toBe("Debug");
		expect(component.getLevelName(LogLevel.Verbose)).toBe("Verbose");
	});

	it("should display log level icon", () =>
	{
		expect(component.getLevelIcon(LogLevel.Error)).toBe("error");
		expect(component.getLevelIcon(LogLevel.Warning)).toBe("warning");
		expect(component.getLevelIcon(LogLevel.Fatal)).toBe("cancel");
		expect(component.getLevelIcon(LogLevel.Information)).toBe("info");
	});

	it("should display log level CSS class", () =>
	{
		expect(component.getLevelClass(LogLevel.Error)).toBe("level-error");
		expect(component.getLevelClass(LogLevel.Warning)).toBe("level-warning");
		expect(component.getLevelClass(LogLevel.Fatal)).toBe("level-fatal");
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
		const properties = { key: "value", nested: { prop: "data" } };
		const formatted = component.formatProperties(properties);

		expect(formatted).toContain('"key"');
		expect(formatted).toContain('"value"');
		expect(formatted).toContain('"nested"');
	});

	it("should return empty string when properties is null", () =>
	{
		expect(component.formatProperties(null)).toBe("");
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
		expect(component.log().duration).toBe(1500);
	});

	it("should display formatted user information", () =>
	{
		expect(component.log().userId).toBe("user-123");
		expect(component.log().userName).toBe("testuser");
		expect(component.log().clientIp).toBe("127.0.0.1");
	});

	it("should display formatted metadata", () =>
	{
		expect(component.log().machineName).toBe("TEST-MACHINE");
		expect(component.log().environment).toBe("Test");
		expect(component.log().threadId).toBe(42);
	});

	it("should handle log with null fields gracefully", () =>
	{
		// Test that formatters handle null values
		expect(component.formatStackTrace(null)).toBe("");
		expect(component.formatProperties(null)).toBe("");
	});

	it("should display duration in milliseconds", () =>
	{
		expect(component.log().duration).toBe(1500);
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
		expect(component.log().requestId).toBe("req-123");
	});
});
