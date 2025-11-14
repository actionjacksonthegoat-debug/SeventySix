import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogStatistics } from "@admin/log-management/models";
import { LogSummaryComponent } from "./log-summary.component";

describe("LogSummaryComponent", () =>
{
	let component: LogSummaryComponent;
	let fixture: ComponentFixture<LogSummaryComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogSummaryComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(LogSummaryComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display total count", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 1234,
			errorCount: 56,
			warningCount: 78,
			criticalCount: 10,
			infoCount: 900,
			debugCount: 190,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("1,234");
	});

	it("should display error count", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 1000,
			errorCount: 456,
			warningCount: 100,
			criticalCount: 5,
			infoCount: 350,
			debugCount: 89,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("456");
	});

	it("should display warning count", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 1000,
			errorCount: 50,
			warningCount: 678,
			criticalCount: 5,
			infoCount: 200,
			debugCount: 67,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("678");
	});

	it("should display fatal count", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 1000,
			errorCount: 50,
			warningCount: 75,
			criticalCount: 12,
			infoCount: 800,
			debugCount: 63,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("12");
	});

	it("should display last updated time when provided", () =>
	{
		const lastUpdated = new Date();

		fixture.componentRef.setInput("lastUpdated", lastUpdated);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("updated");
	});

	it("should not display last updated when not provided", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).not.toContain("updated");
	});

	it("should format large numbers with commas", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 123456,
			errorCount: 12345,
			warningCount: 67890,
			criticalCount: 123,
			infoCount: 40000,
			debugCount: 3098,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("123,456");
		expect(compiled.textContent).toContain("12,345");
		expect(compiled.textContent).toContain("67,890");
	});

	it("should display zero counts", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 100,
			errorCount: 10,
			warningCount: 20,
			criticalCount: 0,
			infoCount: 60,
			debugCount: 10,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("100");
	});

	it("should handle null statistics gracefully", () =>
	{
		fixture.componentRef.setInput("statistics", null);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled).toBeTruthy();
	});

	it("should show relative time for last updated", () =>
	{
		const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

		fixture.componentRef.setInput("lastUpdated", twoMinutesAgo);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		// Should show something like "2 minutes ago"
		expect(compiled.textContent).toContain("ago");
	});

	it("should compute formatted total count", () =>
	{
		const mockStats: LogStatistics = {
			totalLogs: 5432,
			errorCount: 432,
			warningCount: 100,
			criticalCount: 10,
			infoCount: 4800,
			debugCount: 90,
			oldestLogDate: "2024-01-01T00:00:00Z",
			newestLogDate: "2024-01-15T00:00:00Z"
		};

		fixture.componentRef.setInput("statistics", mockStats);
		fixture.detectChanges();

		expect(component.formattedTotal()).toBe("5,432");
	});

	it("should return empty string when statistics is null", () =>
	{
		fixture.componentRef.setInput("statistics", null);
		fixture.detectChanges();

		expect(component.formattedTotal()).toBe("");
		expect(component.formattedErrors()).toBe("");
		expect(component.formattedWarnings()).toBe("");
		expect(component.formattedFatals()).toBe("");
	});
});
