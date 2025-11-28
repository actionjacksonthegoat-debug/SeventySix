import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	LogDto,
	getLogLevelName,
	getLogLevelClassName,
	getRelativeTime,
	truncateText
} from "@admin/logs/models";
import { LogTableComponent, ProcessedLog } from "./log-table.component";

describe("LogTableComponent", () =>
{
	let component: LogTableComponent;
	let fixture: ComponentFixture<LogTableComponent>;

	const createMockLog = (id: number, logLevel: string = "Error"): LogDto => ({
		id,
		createDate: new Date(),
		logLevel,
		message: `Test log message ${id}`,
		exceptionMessage: null,
		baseExceptionMessage: null,
		stackTrace: null,
		sourceContext: "TestService",
		requestMethod: null,
		requestPath: null,
		statusCode: null,
		durationMs: null,
		properties: null,
		machineName: null,
		environment: null,
		correlationId: null,
		spanId: null,
		parentSpanId: null
	});

	const createMockProcessedLog = (
		id: number,
		logLevel: string = "Error"
	): ProcessedLog =>
	{
		const log: LogDto = createMockLog(id, logLevel);
		return {
			...log,
			levelClass: getLogLevelClassName(log.logLevel),
			levelName: getLogLevelName(log.logLevel),
			relativeTime: getRelativeTime(log.createDate),
			truncatedMessage: truncateText(log.message, 100)
		};
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogTableComponent],
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
		const logs: LogDto[] = [createMockLog(1), createMockLog(2)];

		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		expect(component.dataSource.data.length).toBe(2);
	});

	it("should update data source when logs change", () =>
	{
		const initialLogs: LogDto[] = [createMockLog(1)];
		fixture.componentRef.setInput("logs", initialLogs);
		fixture.detectChanges();

		expect(component.dataSource.data.length).toBe(1);

		const updatedLogs: LogDto[] = [
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
		const log: ProcessedLog = createMockProcessedLog(1);

		component.logSelected.subscribe((selectedLog: LogDto) =>
		{
			expect(selectedLog.id).toBe(1);
			done();
		});

		component.onRowClick(log);
	});

	it("should toggle selection", () =>
	{
		const log: ProcessedLog = createMockProcessedLog(1);

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
		const logs: LogDto[] = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		// Select from processedLogs which is what the component uses
		const processedLogs: ProcessedLog[] = component.processedLogs();
		component.selection.select(processedLogs[0], processedLogs[1]);

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
		const log: ProcessedLog = createMockProcessedLog(42);

		component.deleteLog.subscribe((id: number) =>
		{
			expect(id).toBe(42);
			done();
		});

		component.onDeleteLog(log);
	});

	it("should clear selection after delete", () =>
	{
		const logs: LogDto[] = [createMockLog(1), createMockLog(2)];
		fixture.componentRef.setInput("logs", logs);
		fixture.detectChanges();

		const processedLogs: ProcessedLog[] = component.processedLogs();
		component.selection.select(processedLogs[0]);
		expect(component.selection.selected.length).toBe(1);

		component.onDeleteSelected();

		expect(component.selection.selected.length).toBe(0);
	});

	it("should format log level display name via utility", () =>
	{
		expect(getLogLevelName("Error")).toBe("Error");
		expect(getLogLevelName("Warning")).toBe("Warning");
		expect(getLogLevelName("Fatal")).toBe("Fatal");
		expect(getLogLevelName("Information")).toBe("Info");
		expect(getLogLevelName("Debug")).toBe("Debug");
		expect(getLogLevelName("Verbose")).toBe("Verbose");
	});

	it("should return level CSS class via utility", () =>
	{
		expect(getLogLevelClassName("Error")).toBe("level-error");
		expect(getLogLevelClassName("Warning")).toBe("level-warning");
		expect(getLogLevelClassName("Fatal")).toBe("level-fatal");
		expect(getLogLevelClassName("Information")).toBe("level-info");
	});

	it("should format timestamp as relative time via utility", () =>
	{
		const now: Date = new Date();
		const twoMinutesAgo: Date = new Date(now.getTime() - 2 * 60 * 1000);

		const result: string = getRelativeTime(twoMinutesAgo);

		expect(result).toContain("minute");
		expect(result).toContain("ago");
	});

	it("should truncate long messages via utility", () =>
	{
		const longMessage: string = "A".repeat(150);

		const result: string = truncateText(longMessage, 100);

		expect(result.length).toBeLessThanOrEqual(103); // 100 + "..."
		expect(result).toContain("...");
	});

	it("should not truncate short messages via utility", () =>
	{
		const shortMessage: string = "Short message";

		const result: string = truncateText(shortMessage, 100);

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
		let emitted: boolean = false;
		component.deleteSelected.subscribe(() =>
		{
			emitted = true;
		});

		expect(emitted).toBe(false);
	});
});
