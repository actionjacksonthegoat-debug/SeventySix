import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogLevel, LogResponse } from "@admin/log-management/models";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { LogTableComponent } from "./log-table.component";

describe("LogTableComponent", () =>
{
	let component: LogTableComponent;
	let fixture: ComponentFixture<LogTableComponent>;

	const createMockLog = (
		id: number,
		logLevel: string = "Error"
	): LogResponse => ({
		id,
		timestamp: new Date(),
		logLevel,
		message: `Test log message ${id}`,
		sourceContext: "TestService",
		exception: null,
		stackTrace: null,
		requestId: null,
		requestPath: null,
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
		duration: null,
		statusCode: null,
		properties: null
	});

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogTableComponent, NoopAnimationsModule],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(LogTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should initialize with empty data", () =>
	{
		expect(component.logs()).toEqual([]);
		expect(component.totalCount()).toBe(0);
	});

	it("should display logs when provided", () =>
	{
		const logs = [createMockLog(1), createMockLog(2)];

		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		expect(component.dataSource.data.length).toBe(2);
	});

	it("should update data source when logs change", () =>
	{
		const initialLogs = [createMockLog(1)];
		fixture.componentRef.setInput("logs", initialLogs);
		fixture.detectChanges();

		expect(component.dataSource.data.length).toBe(1);

		const updatedLogs = [
			createMockLog(1),
			createMockLog(2),
			createMockLog(3)
		];
		fixture.componentRef.setInput("logs", updatedLogs);
		fixture.detectChanges();

		expect(component.dataSource.data.length).toBe(3);
	});

	it("should emit logSelected when row is clicked", (done: DoneFn) =>
	{
		const log = createMockLog(1);

		component.logSelected.subscribe((selectedLog: LogResponse) =>
		{
			expect(selectedLog.id).toBe(1);
			done();
		});

		component.onRowClick(log);
	});

	it("should toggle selection", () =>
	{
		const log = createMockLog(1);

		expect(component.selection.isSelected(log)).toBe(false);

		component.toggleSelection(log);

		expect(component.selection.isSelected(log)).toBe(true);

		component.toggleSelection(log);

		expect(component.selection.isSelected(log)).toBe(false);
	});

	it("should select all logs", () =>
	{
		const logs = [createMockLog(1), createMockLog(2), createMockLog(3)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		component.selectAll();

		expect(component.selection.selected.length).toBe(3);
	});

	it("should deselect all logs when all are selected", () =>
	{
		const logs = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		component.selectAll();
		expect(component.selection.selected.length).toBe(2);

		component.selectAll();
		expect(component.selection.selected.length).toBe(0);
	});

	it("should check if all logs are selected", () =>
	{
		const logs = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		expect(component.isAllSelected()).toBe(false);

		component.selectAll();

		expect(component.isAllSelected()).toBe(true);
	});

	it("should emit deleteSelected when delete is triggered", (done: DoneFn) =>
	{
		const logs = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		component.selection.select(logs[0], logs[1]);

		component.deleteSelected.subscribe((ids: number[]) =>
		{
			expect(ids.length).toBe(2);
			expect(ids).toContain(1);
			expect(ids).toContain(2);
			done();
		});

		component.onDeleteSelected();
	});

	it("should emit deleteLog when single delete is triggered", (done: DoneFn) =>
	{
		const log = createMockLog(42);

		component.deleteLog.subscribe((id: number) =>
		{
			expect(id).toBe(42);
			done();
		});

		component.onDeleteLog(log);
	});

	it("should clear selection after delete", () =>
	{
		const logs = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		component.selection.select(logs[0]);
		expect(component.selection.selected.length).toBe(1);

		component.onDeleteSelected();

		expect(component.selection.selected.length).toBe(0);
	});

	it("should format log level display name", () =>
	{
		expect(component.getLevelName("Error")).toBe("Error");
		expect(component.getLevelName("Warning")).toBe("Warning");
		expect(component.getLevelName("Fatal")).toBe("Fatal");
		expect(component.getLevelName("Information")).toBe("Info");
		expect(component.getLevelName("Debug")).toBe("Debug");
		expect(component.getLevelName("Verbose")).toBe("Verbose");
	});

	it("should return level CSS class", () =>
	{
		expect(component.getLevelClass("Error")).toBe("level-error");
		expect(component.getLevelClass("Warning")).toBe("level-warning");
		expect(component.getLevelClass("Fatal")).toBe("level-fatal");
		expect(component.getLevelClass("Information")).toBe("level-info");
	});

	it("should format timestamp as relative time", () =>
	{
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

		const result = component.getRelativeTime(twoMinutesAgo);

		expect(result).toContain("minute");
		expect(result).toContain("ago");
	});

	it("should truncate long messages", () =>
	{
		const longMessage = "A".repeat(150);

		const result = component.truncateMessage(longMessage, 100);

		expect(result.length).toBeLessThanOrEqual(103); // 100 + "..."
		expect(result).toContain("...");
	});

	it("should not truncate short messages", () =>
	{
		const shortMessage = "Short message";

		const result = component.truncateMessage(shortMessage, 100);

		expect(result).toBe(shortMessage);
		expect(result).not.toContain("...");
	});

	it("should emit pageChange when page is changed", (done: DoneFn) =>
	{
		component.pageChange.subscribe((page: number) =>
		{
			expect(page).toBe(2);
			done();
		});

		component.onPageChange({ pageIndex: 1, pageSize: 50, length: 100 });
	});

	it("should emit pageSizeChange when page size is changed", (done: DoneFn) =>
	{
		component.pageSizeChange.subscribe((size: number) =>
		{
			expect(size).toBe(100);
			done();
		});

		component.onPageChange({ pageIndex: 0, pageSize: 100, length: 200 });
	});

	it("should have correct page size options", () =>
	{
		expect(component.pageSizeOptions).toEqual([25, 50, 100]);
	});

	it("should display no data message when logs are empty", () =>
	{
		fixture.componentRef.setInput("logs", []);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("No logs");
	});

	it("should not allow delete when no logs are selected", () =>
	{
		expect(component.selection.selected.length).toBe(0);

		component.onDeleteSelected();

		// Should not emit
		let emitted = false;
		component.deleteSelected.subscribe(() =>
		{
			emitted = true;
		});

		expect(emitted).toBe(false);
	});
});
